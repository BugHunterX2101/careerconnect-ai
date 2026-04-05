const TensorFlowService = require('./tensorflowService');
const natural = require('natural');

class JobRecommender {
  constructor() {
    this.tfService = new TensorFlowService();
    this.tokenizer = null;
    this.isInitialized = false;
    this.jobDatabase = [];
  }

  async initialize() {
    try {
      // Initialize TensorFlow service
      await this.tfService.initialize();
      
      // Initialize tokenizer
      this.tokenizer = new natural.WordTokenizer();
      
      // Load job database
      await this.loadJobDatabase();
      
      this.isInitialized = true;
      console.log('JobRecommender initialized successfully');
    } catch (error) {
      console.error('Error initializing JobRecommender:', error);
      throw error;
    }
  }

  async loadJobDatabase() {
    try {
      let Job = null;
      try {
        Job = require('../models/Job');
      } catch (_) { /* ignore */ }

      if (Job && typeof Job.find === 'function') {
        const jobs = await Job.find({ status: 'active' })
          .limit(500)
          .select('_id title company location description requirements requiredSkills benefits employmentType')
          .lean();
        this.jobDatabase = (jobs || []).map(job => ({
          id: String(job._id),
          title: job.title,
          company: job.company?.name || job.company || '',
          location: job.location?.city
            ? `${job.location.city}${job.location.state ? ', ' + job.location.state : ''}`
            : '',
          description: job.description || '',
          requirements: [
            ...(Array.isArray(job.requirements?.skills) ? job.requirements.skills.map(s => s?.name || s) : []),
            ...(Array.isArray(job.requiredSkills) ? job.requiredSkills : [])
          ],
          salary: job.benefits?.salary || {},
          type: job.employmentType || 'full-time',
          remote: job.location?.isRemote || false
        }));
        console.log(`JobRecommender: loaded ${this.jobDatabase.length} jobs from DB`);
      } else if (Job && typeof Job.findAll === 'function') {
        const jobs = await Job.findAll({ where: { status: 'active' }, limit: 500 });
        this.jobDatabase = (jobs || []).map(job => ({
          id: String(job.id),
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          requirements: Array.isArray(job.requiredSkills) ? job.requiredSkills : [],
          salary: {},
          type: job.type || 'full-time',
          remote: false
        }));
        console.log(`JobRecommender: loaded ${this.jobDatabase.length} jobs from DB (Sequelize)`);
      } else {
        // No DB available — start empty; recommendations will return nothing
        this.jobDatabase = [];
        console.warn('JobRecommender: Job model not available, job database is empty');
      }
    } catch (error) {
      console.error('Error loading job database:', error);
      this.jobDatabase = [];
    }
  }

  async getJobRecommendations(user, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        page = 1,
        limit = 10,
        location,
        remote,
        salary_min,
        salary_max
      } = options;

      // Get user's resume and skills
      const userSkills = this.extractUserSkills(user);
      const userExperience = this.extractUserExperience(user);
      const userLocation = user.profile?.location || '';

      // Calculate job scores with async ML scoring
      const scoredJobs = await Promise.all(
        this.jobDatabase.map(async job => {
          const score = await this.calculateJobScore(job, userSkills, userExperience, userLocation, user);
          return { ...job, score };
        })
      );

      // Apply filters
      const filteredJobs = scoredJobs.filter(job => {
        // Location filter
        if (location && !job.location.toLowerCase().includes(location.toLowerCase())) {
          return false;
        }

        // Remote filter
        if (remote !== undefined && job.remote !== remote) {
          return false;
        }

        // Salary filter
        if (salary_min && job.salary.max < salary_min) {
          return false;
        }
        if (salary_max && job.salary.min > salary_max) {
          return false;
        }

        return true;
      });

      // Sort by score
      filteredJobs.sort((a, b) => b.score - a.score);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

      return {
        jobs: paginatedJobs,
        total: filteredJobs.length,
        page,
        totalPages: Math.ceil(filteredJobs.length / limit)
      };
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      throw error;
    }
  }

  extractUserSkills(user) {
    const skills = [];
    
    // Extract skills from resumes
    if (user.resumes && user.resumes.length > 0) {
      for (const resume of user.resumes) {
        if (resume.skills && Array.isArray(resume.skills)) {
          skills.push(...resume.skills.map(skill => skill.name.toLowerCase()));
        }
      }
    }

    // Extract skills from profile
    if (user.profile && user.profile.skills) {
      skills.push(...user.profile.skills.map(skill => skill.name.toLowerCase()));
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  extractUserExperience(user) {
    let totalExperience = 0;
    
    // Calculate experience from resumes
    if (user.resumes && user.resumes.length > 0) {
      for (const resume of user.resumes) {
        if (resume.experience && Array.isArray(resume.experience)) {
          for (const exp of resume.experience) {
            if (exp.duration) {
              const years = this.parseDuration(exp.duration);
              totalExperience += years;
            }
          }
        }
      }
    }

    return totalExperience;
  }

  parseDuration(duration) {
    // Parse duration strings like "2020-2022" or "2 years"
    const yearPattern = /\b\d{4}\s*[-–]\s*\d{4}\b/;
    const yearMatch = duration.match(yearPattern);
    
    if (yearMatch) {
      const years = yearMatch[0].split(/[-–]/);
      return parseInt(years[1]) - parseInt(years[0]);
    }

    const numberPattern = /\d+/;
    const numberMatch = duration.match(numberPattern);
    if (numberMatch) {
      return parseInt(numberMatch[0]);
    }

    return 0;
  }

  async calculateJobScore(job, userSkills, userExperience, userLocation, user = null) {
    let score = 0;

    // Use TensorFlow for ML-based scoring if user provided
    if (user && this.tfService.isInitialized) {
      try {
        const cacheKey = `${user.id}_${job.id}`;
        if (!this.mlScoreCache) this.mlScoreCache = new Map();
        
        let mlScore;
        if (this.mlScoreCache.has(cacheKey)) {
          mlScore = this.mlScoreCache.get(cacheKey);
        } else {
          const userFeatures = this.tfService.extractUserFeatures(user);
          const jobFeatures = this.tfService.extractJobFeatures(job);
          mlScore = await this.tfService.calculateJobScore(userFeatures, jobFeatures);
          this.mlScoreCache.set(cacheKey, mlScore);
        }
        score += mlScore * 30; // 30% weight for ML score
      } catch (error) {
        console.log('ML scoring failed, using traditional scoring');
      }
    }

    // Traditional scoring (70% weight or 100% if ML fails)
    const traditionalWeight = user && this.tfService.isInitialized ? 70 : 100;
    
    // Skills match
    const skillMatch = this.calculateSkillMatch(job.requirements, userSkills);
    score += (skillMatch * 40 * traditionalWeight) / 100;

    // Experience match
    const experienceMatch = this.calculateExperienceMatch(job, userExperience);
    score += (experienceMatch * 25 * traditionalWeight) / 100;

    // Location match
    const locationMatch = this.calculateLocationMatch(job.location, userLocation);
    score += (locationMatch * 20 * traditionalWeight) / 100;

    // Salary match
    const salaryMatch = this.calculateSalaryMatch(job.salary, userExperience);
    score += (salaryMatch * 15 * traditionalWeight) / 100;

    return Math.round(score);
  }

  calculateSkillMatch(jobRequirements, userSkills) {
    if (!jobRequirements || jobRequirements.length === 0) return 0;
    if (!userSkills || userSkills.length === 0) return 0;

    const matchedSkills = jobRequirements.filter(req => 
      userSkills.some(skill => skill.includes(req.toLowerCase()) || req.toLowerCase().includes(skill))
    );

    return (matchedSkills.length / jobRequirements.length) * 100;
  }

  calculateExperienceMatch(job, userExperience) {
    // Simple experience matching - could be improved
    if (userExperience >= 5) return 100;
    if (userExperience >= 3) return 80;
    if (userExperience >= 1) return 60;
    return 40;
  }

  calculateLocationMatch(jobLocation, userLocation) {
    if (!userLocation) return 50; // Neutral score if no user location

    const jobLocationLower = jobLocation.toLowerCase();
    const userLocationLower = userLocation.toLowerCase();

    // Exact match
    if (jobLocationLower.includes(userLocationLower) || userLocationLower.includes(jobLocationLower)) {
      return 100;
    }

    // Partial match (same city or state)
    const jobParts = jobLocationLower.split(',').map(part => part.trim());
    const userParts = userLocationLower.split(',').map(part => part.trim());

    for (const jobPart of jobParts) {
      for (const userPart of userParts) {
        if (jobPart === userPart && jobPart.length > 2) {
          return 80;
        }
      }
    }

    return 30; // Low score for no match
  }

  calculateSalaryMatch(jobSalary, userExperience) {
    if (!jobSalary) return 50;

    const avgSalary = (jobSalary.min + jobSalary.max) / 2;
    
    // Simple salary matching based on experience
    const expectedSalary = userExperience * 15000 + 50000; // Rough estimate
    
    const difference = Math.abs(avgSalary - expectedSalary);
    const percentageDiff = (difference / expectedSalary) * 100;
    
    if (percentageDiff <= 10) return 100;
    if (percentageDiff <= 20) return 80;
    if (percentageDiff <= 30) return 60;
    return 40;
  }

  async searchJobs(query, filters = {}) {
    try {
      const {
        location,
        remote,
        salary_min,
        salary_max,
        job_type,
        page = 1,
        limit = 20
      } = filters;

      // Filter jobs based on query and filters
      const filteredJobs = this.jobDatabase.filter(job => {
        // Text search
        const searchText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
        if (query && !searchText.includes(query.toLowerCase())) {
          return false;
        }

        // Location filter
        if (location && !job.location.toLowerCase().includes(location.toLowerCase())) {
          return false;
        }

        // Remote filter
        if (remote !== undefined && job.remote !== remote) {
          return false;
        }

        // Salary filter
        if (salary_min && job.salary.max < salary_min) {
          return false;
        }
        if (salary_max && job.salary.min > salary_max) {
          return false;
        }

        // Job type filter
        if (job_type && job.type !== job_type) {
          return false;
        }

        return true;
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

      return {
        jobs: paginatedJobs,
        total: filteredJobs.length,
        page,
        totalPages: Math.ceil(filteredJobs.length / limit)
      };
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }

  async getSimilarJobs(jobId) {
    try {
      const targetJob = this.jobDatabase.find(job => job.id === jobId);
      if (!targetJob) {
        throw new Error('Job not found');
      }

      // Find similar jobs based on requirements and title
      const similarJobs = this.jobDatabase
        .filter(job => job.id !== jobId)
        .map(job => {
          const similarity = this.calculateJobSimilarity(targetJob, job);
          return { ...job, similarity };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return similarJobs;
    } catch (error) {
      console.error('Error getting similar jobs:', error);
      throw error;
    }
  }

  calculateJobSimilarity(job1, job2) {
    let similarity = 0;

    // Title similarity
    const titleSimilarity = this.calculateTextSimilarity(job1.title, job2.title);
    similarity += titleSimilarity * 0.3;

    // Requirements similarity
    const reqSimilarity = this.calculateArraySimilarity(job1.requirements, job2.requirements);
    similarity += reqSimilarity * 0.4;

    // Company similarity
    const companySimilarity = this.calculateTextSimilarity(job1.company, job2.company);
    similarity += companySimilarity * 0.2;

    // Location similarity
    const locationSimilarity = this.calculateTextSimilarity(job1.location, job2.location);
    similarity += locationSimilarity * 0.1;

    return Math.round(similarity * 100);
  }

  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(' '));
    const words2 = new Set(text2.toLowerCase().split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  calculateArraySimilarity(arr1, arr2) {
    if (!arr1 || !arr2) return 0;
    
    const set1 = new Set(arr1.map(item => item.toLowerCase()));
    const set2 = new Set(arr2.map(item => item.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  async trainRecommendationModel(trainingData) {
    try {
      if (!this.isInitialized) await this.initialize();
      await this.tfService.trainModel(trainingData);
      console.log('Recommendation model trained successfully');
    } catch (error) {
      console.error('Error training model:', error);
    }
  }

  async saveModel(path) {
    try {
      await this.tfService.saveModel(path);
    } catch (error) {
      console.error('Error saving model:', error);
    }
  }

  async loadModel(path) {
    try {
      await this.tfService.loadModel(path);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  dispose() {
    if (this.tfService) {
      this.tfService.dispose();
    }
  }
}

module.exports = JobRecommender;
