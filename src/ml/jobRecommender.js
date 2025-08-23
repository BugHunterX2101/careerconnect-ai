const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');
const natural = require('natural');
const winston = require('winston');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const { getRedisClient } = require('../database/redis');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/jobRecommender.log' }),
    new winston.transports.Console()
  ]
});

class JobRecommender {
  constructor() {
    this.model = null;
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.skillWeights = {
      required: 1.0,
      preferred: 0.7,
      'nice-to-have': 0.3
    };
  }

  async initialize() {
    try {
      logger.info('Initializing Job Recommender...');
      
      // Load BERT model
      this.model = await use.load();
      logger.info('BERT model loaded successfully');
      
      logger.info('Job Recommender initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Job Recommender:', error);
      throw error;
    }
  }

  async getJobRecommendations(userId, resumeId, options = {}) {
    try {
      logger.info(`Getting job recommendations for user: ${userId}, resume: ${resumeId}`);
      
      const {
        limit = 20,
        location = null,
        remoteOnly = false,
        minSalary = null,
        maxSalary = null,
        employmentType = null,
        seniorityLevel = null,
        skills = []
      } = options;

      // Get resume data
      const resume = await Resume.findOne({ _id: resumeId, userId, isActive: true });
      if (!resume) {
        throw new Error('Resume not found');
      }

      // Build query for jobs
      const jobQuery = this.buildJobQuery({
        location,
        remoteOnly,
        minSalary,
        maxSalary,
        employmentType,
        seniorityLevel
      });

      // Get jobs from database
      const jobs = await Job.find(jobQuery)
        .populate('employerId', 'firstName lastName company.name')
        .limit(limit * 2); // Get more jobs for better ranking

      if (jobs.length === 0) {
        return {
          recommendations: [],
          totalFound: 0,
          filters: options
        };
      }

      // Calculate match scores
      const scoredJobs = await this.calculateMatchScores(jobs, resume, skills);
      
      // Sort by match score and take top results
      const recommendations = scoredJobs
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      // Cache results
      await this.cacheRecommendations(userId, resumeId, recommendations);

      logger.info(`Generated ${recommendations.length} job recommendations`);

      return {
        recommendations,
        totalFound: jobs.length,
        filters: options,
        resumeScore: resume.aiAnalysis.overallScore
      };
    } catch (error) {
      logger.error('Error getting job recommendations:', error);
      throw error;
    }
  }

  buildJobQuery(filters) {
    const query = {
      status: 'active',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (filters.location) {
      query['location.city'] = new RegExp(filters.location, 'i');
    }

    if (filters.remoteOnly) {
      query['location.isRemote'] = true;
    }

    if (filters.minSalary || filters.maxSalary) {
      query['benefits.salary'] = {};
      if (filters.minSalary) {
        query['benefits.salary.min'] = { $gte: filters.minSalary };
      }
      if (filters.maxSalary) {
        query['benefits.salary.max'] = { $lte: filters.maxSalary };
      }
    }

    if (filters.employmentType) {
      query.employmentType = filters.employmentType;
    }

    if (filters.seniorityLevel) {
      query.seniorityLevel = filters.seniorityLevel;
    }

    return query;
  }

  async calculateMatchScores(jobs, resume, additionalSkills = []) {
    try {
      const resumeSkills = resume.skills.map(skill => skill.name.toLowerCase());
      const resumeKeywords = resume.aiAnalysis.extractedKeywords.map(kw => kw.keyword.toLowerCase());
      const allResumeKeywords = [...resumeSkills, ...resumeKeywords, ...additionalSkills];
      
      const scoredJobs = [];

      for (const job of jobs) {
        const matchScore = await this.calculateJobMatchScore(job, resume, allResumeKeywords);
        
        scoredJobs.push({
          job: job.toObject(),
          matchScore,
          matchDetails: {
            skillsMatch: matchScore.skillsMatch,
            experienceMatch: matchScore.experienceMatch,
            locationMatch: matchScore.locationMatch,
            salaryMatch: matchScore.salaryMatch,
            educationMatch: matchScore.educationMatch
          }
        });
      }

      return scoredJobs;
    } catch (error) {
      logger.error('Error calculating match scores:', error);
      throw error;
    }
  }

  async calculateJobMatchScore(job, resume, resumeKeywords) {
    try {
      // Skills matching (40% weight)
      const skillsMatch = this.calculateSkillsMatch(job, resumeKeywords);
      
      // Experience matching (25% weight)
      const experienceMatch = this.calculateExperienceMatch(job, resume);
      
      // Location matching (15% weight)
      const locationMatch = this.calculateLocationMatch(job, resume);
      
      // Salary matching (10% weight)
      const salaryMatch = this.calculateSalaryMatch(job, resume);
      
      // Education matching (10% weight)
      const educationMatch = this.calculateEducationMatch(job, resume);

      // Calculate weighted average
      const totalScore = (
        skillsMatch * 0.4 +
        experienceMatch * 0.25 +
        locationMatch * 0.15 +
        salaryMatch * 0.1 +
        educationMatch * 0.1
      );

      return {
        totalScore: Math.round(totalScore * 100) / 100,
        skillsMatch: Math.round(skillsMatch * 100),
        experienceMatch: Math.round(experienceMatch * 100),
        locationMatch: Math.round(locationMatch * 100),
        salaryMatch: Math.round(salaryMatch * 100),
        educationMatch: Math.round(educationMatch * 100)
      };
    } catch (error) {
      logger.error('Error calculating job match score:', error);
      return {
        totalScore: 0,
        skillsMatch: 0,
        experienceMatch: 0,
        locationMatch: 0,
        salaryMatch: 0,
        educationMatch: 0
      };
    }
  }

  calculateSkillsMatch(job, resumeKeywords) {
    try {
      if (!job.requirements.skills || job.requirements.skills.length === 0) {
        return 0.5; // Neutral score if no skills specified
      }

      const jobSkills = job.requirements.skills.map(skill => skill.name.toLowerCase());
      const jobKeywords = job.aiAnalysis.extractedKeywords.map(kw => kw.keyword.toLowerCase());
      const allJobKeywords = [...jobSkills, ...jobKeywords];

      let totalScore = 0;
      let totalWeight = 0;

      // Calculate weighted score based on skill importance
      for (const jobSkill of job.requirements.skills) {
        const skillName = jobSkill.name.toLowerCase();
        const weight = this.skillWeights[jobSkill.level] || 0.5;
        
        if (resumeKeywords.includes(skillName)) {
          totalScore += weight;
        }
        
        totalWeight += weight;
      }

      // Add bonus for keyword matches
      const keywordMatches = allJobKeywords.filter(keyword => 
        resumeKeywords.includes(keyword)
      ).length;

      const keywordBonus = Math.min(0.2, keywordMatches / allJobKeywords.length);

      return totalWeight > 0 ? (totalScore / totalWeight) + keywordBonus : 0;
    } catch (error) {
      logger.error('Error calculating skills match:', error);
      return 0;
    }
  }

  calculateExperienceMatch(job, resume) {
    try {
      const jobMinYears = job.requirements.experience.minYears || 0;
      const jobMaxYears = job.requirements.experience.maxYears;
      const resumeYears = resume.totalExperienceYears;

      if (jobMinYears === 0 && !jobMaxYears) {
        return 0.8; // Entry level or no experience requirement
      }

      if (resumeYears >= jobMinYears) {
        if (!jobMaxYears || resumeYears <= jobMaxYears) {
          return 1.0; // Perfect match
        } else {
          // Overqualified - still good but not perfect
          return Math.max(0.7, 1.0 - (resumeYears - jobMaxYears) * 0.1);
        }
      } else {
        // Underqualified
        return Math.max(0.1, 1.0 - (jobMinYears - resumeYears) * 0.2);
      }
    } catch (error) {
      logger.error('Error calculating experience match:', error);
      return 0.5;
    }
  }

  calculateLocationMatch(job, resume) {
    try {
      // If job is remote, it's a good match for everyone
      if (job.location.isRemote) {
        return 1.0;
      }

      // If resume has no location info, give neutral score
      if (!resume.personalInfo.address && !resume.userId.location) {
        return 0.5;
      }

      const resumeLocation = resume.userId.location || {};
      const jobLocation = job.location;

      // Exact city match
      if (resumeLocation.city && jobLocation.city &&
          resumeLocation.city.toLowerCase() === jobLocation.city.toLowerCase()) {
        return 1.0;
      }

      // Same state/country match
      if (resumeLocation.state && jobLocation.state &&
          resumeLocation.state.toLowerCase() === jobLocation.state.toLowerCase()) {
        return 0.8;
      }

      if (resumeLocation.country && jobLocation.country &&
          resumeLocation.country.toLowerCase() === jobLocation.country.toLowerCase()) {
        return 0.6;
      }

      return 0.2; // Different location
    } catch (error) {
      logger.error('Error calculating location match:', error);
      return 0.5;
    }
  }

  calculateSalaryMatch(job, resume) {
    try {
      // If no salary info, give neutral score
      if (!job.benefits.salary.min && !job.benefits.salary.max) {
        return 0.5;
      }

      // For now, return a neutral score as salary matching requires more complex logic
      // In a real implementation, you might want to consider:
      // - Current salary from resume
      // - Salary expectations
      // - Market rates for the position
      return 0.7;
    } catch (error) {
      logger.error('Error calculating salary match:', error);
      return 0.5;
    }
  }

  calculateEducationMatch(job, resume) {
    try {
      const jobMinDegree = job.requirements.education.minimumDegree;
      const resumeEducation = resume.education;

      if (!jobMinDegree || !resumeEducation || resumeEducation.length === 0) {
        return 0.7; // Neutral score
      }

      const degreeHierarchy = {
        'high_school': 1,
        'associate': 2,
        'bachelor': 3,
        'master': 4,
        'phd': 5
      };

      const jobLevel = degreeHierarchy[jobMinDegree] || 3;
      let highestResumeLevel = 0;

      for (const edu of resumeEducation) {
        if (edu.degree) {
          const degree = edu.degree.toLowerCase();
          if (degree.includes('phd') || degree.includes('doctorate')) {
            highestResumeLevel = Math.max(highestResumeLevel, 5);
          } else if (degree.includes('master')) {
            highestResumeLevel = Math.max(highestResumeLevel, 4);
          } else if (degree.includes('bachelor')) {
            highestResumeLevel = Math.max(highestResumeLevel, 3);
          } else if (degree.includes('associate')) {
            highestResumeLevel = Math.max(highestResumeLevel, 2);
          } else {
            highestResumeLevel = Math.max(highestResumeLevel, 1);
          }
        }
      }

      if (highestResumeLevel >= jobLevel) {
        return 1.0; // Meets or exceeds requirement
      } else {
        return Math.max(0.2, 1.0 - (jobLevel - highestResumeLevel) * 0.3);
      }
    } catch (error) {
      logger.error('Error calculating education match:', error);
      return 0.5;
    }
  }

  async cacheRecommendations(userId, resumeId, recommendations) {
    try {
      const redisClient = getRedisClient();
      const cacheKey = `job_recommendations:${userId}:${resumeId}`;
      const cacheData = {
        recommendations,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };

      await redisClient.setEx(cacheKey, 1800, JSON.stringify(cacheData)); // 30 minutes TTL
      logger.info(`Cached job recommendations for user: ${userId}`);
    } catch (error) {
      logger.error('Error caching recommendations:', error);
      // Don't throw error as caching is not critical
    }
  }

  async getCachedRecommendations(userId, resumeId) {
    try {
      const redisClient = getRedisClient();
      const cacheKey = `job_recommendations:${userId}:${resumeId}`;
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const expiresAt = new Date(parsed.expiresAt);
        
        if (expiresAt > new Date()) {
          logger.info(`Retrieved cached recommendations for user: ${userId}`);
          return parsed.recommendations;
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting cached recommendations:', error);
      return null;
    }
  }

  async getSimilarJobs(jobId, limit = 10) {
    try {
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const jobSkills = job.requirements.skills.map(skill => skill.name);
      const jobKeywords = job.aiAnalysis.extractedKeywords.map(kw => kw.keyword);

      // Find jobs with similar skills
      const similarJobs = await Job.find({
        _id: { $ne: jobId },
        status: 'active',
        'requirements.skills.name': { $in: jobSkills },
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      })
      .populate('employerId', 'firstName lastName company.name')
      .limit(limit * 2);

      // Calculate similarity scores
      const scoredJobs = similarJobs.map(similarJob => {
        const similarityScore = this.calculateJobSimilarity(job, similarJob);
        return {
          job: similarJob.toObject(),
          similarityScore
        };
      });

      // Sort by similarity and return top results
      return scoredJobs
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting similar jobs:', error);
      throw error;
    }
  }

  calculateJobSimilarity(job1, job2) {
    try {
      const skills1 = new Set(job1.requirements.skills.map(s => s.name.toLowerCase()));
      const skills2 = new Set(job2.requirements.skills.map(s => s.name.toLowerCase()));
      
      const intersection = new Set([...skills1].filter(x => skills2.has(x)));
      const union = new Set([...skills1, ...skills2]);
      
      const jaccardSimilarity = intersection.size / union.size;
      
      // Additional factors
      const titleSimilarity = job1.title.toLowerCase() === job2.title.toLowerCase() ? 1 : 0;
      const industrySimilarity = job1.aiAnalysis.industry === job2.aiAnalysis.industry ? 1 : 0;
      const levelSimilarity = job1.seniorityLevel === job2.seniorityLevel ? 1 : 0;
      
      const totalSimilarity = (
        jaccardSimilarity * 0.6 +
        titleSimilarity * 0.2 +
        industrySimilarity * 0.1 +
        levelSimilarity * 0.1
      );
      
      return Math.round(totalSimilarity * 100) / 100;
    } catch (error) {
      logger.error('Error calculating job similarity:', error);
      return 0;
    }
  }

  async getMarketInsights(skills, location = null) {
    try {
      const query = {
        status: 'active',
        'requirements.skills.name': { $in: skills },
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      };

      if (location) {
        query['location.city'] = new RegExp(location, 'i');
      }

      const jobs = await Job.find(query);
      
      const insights = {
        totalJobs: jobs.length,
        averageSalary: this.calculateAverageSalary(jobs),
        topCompanies: this.getTopCompanies(jobs),
        skillDemand: this.calculateSkillDemand(jobs, skills),
        remotePercentage: this.calculateRemotePercentage(jobs),
        experienceDistribution: this.calculateExperienceDistribution(jobs)
      };

      return insights;
    } catch (error) {
      logger.error('Error getting market insights:', error);
      throw error;
    }
  }

  calculateAverageSalary(jobs) {
    const jobsWithSalary = jobs.filter(job => 
      job.benefits.salary.min || job.benefits.salary.max
    );

    if (jobsWithSalary.length === 0) return null;

    const totalSalary = jobsWithSalary.reduce((sum, job) => {
      const min = job.benefits.salary.min || 0;
      const max = job.benefits.salary.max || min;
      return sum + ((min + max) / 2);
    }, 0);

    return Math.round(totalSalary / jobsWithSalary.length);
  }

  getTopCompanies(jobs) {
    const companyCount = {};
    
    jobs.forEach(job => {
      const companyName = job.company.name;
      companyCount[companyName] = (companyCount[companyName] || 0) + 1;
    });

    return Object.entries(companyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  calculateSkillDemand(jobs, skills) {
    const skillDemand = {};
    
    skills.forEach(skill => {
      skillDemand[skill] = jobs.filter(job => 
        job.requirements.skills.some(jobSkill => 
          jobSkill.name.toLowerCase() === skill.toLowerCase()
        )
      ).length;
    });

    return skillDemand;
  }

  calculateRemotePercentage(jobs) {
    const remoteJobs = jobs.filter(job => job.location.isRemote);
    return Math.round((remoteJobs.length / jobs.length) * 100);
  }

  calculateExperienceDistribution(jobs) {
    const distribution = {
      entry: 0,
      junior: 0,
      'mid-level': 0,
      senior: 0,
      lead: 0,
      manager: 0,
      director: 0,
      executive: 0
    };

    jobs.forEach(job => {
      if (distribution[job.seniorityLevel] !== undefined) {
        distribution[job.seniorityLevel]++;
      }
    });

    return distribution;
  }
}

module.exports = JobRecommender;
