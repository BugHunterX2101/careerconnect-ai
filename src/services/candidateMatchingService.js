const logger = require('../middleware/logger');

class CandidateMatchingService {
  constructor() {
    this.User = null;
    this.Job = null;
    this.initializeModels();
  }

  initializeModels() {
    try {
      this.User = require('../models/User');
      this.Job = require('../models/Job');
    } catch (error) {
      console.warn('Models not available for candidate matching:', error.message);
    }
  }

  // Calculate match score between job requirements and candidate profile
  calculateMatchScore(job, candidate) {
    let score = 0;
    let maxScore = 0;

    // Skills matching (40% weight)
    const skillsWeight = 40;
    if (job.requiredSkills && candidate.profile?.skills) {
      const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
      const candidateSkills = candidate.profile.skills.map(s => s.toLowerCase());
      const matchingSkills = jobSkills.filter(skill => 
        candidateSkills.some(cSkill => cSkill.includes(skill) || skill.includes(cSkill))
      );
      const skillsScore = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * skillsWeight : 0;
      score += skillsScore;
    }
    maxScore += skillsWeight;

    // Experience matching (25% weight)
    const experienceWeight = 25;
    if (job.experienceLevel && candidate.profile?.experience?.years !== undefined) {
      const jobExpMap = { 'entry': 0, 'mid': 3, 'senior': 7, 'lead': 10 };
      const requiredExp = jobExpMap[job.experienceLevel] || 0;
      const candidateExp = candidate.profile.experience.years;
      
      if (candidateExp >= requiredExp) {
        score += experienceWeight;
      } else if (candidateExp >= requiredExp * 0.7) {
        score += experienceWeight * 0.7;
      } else if (candidateExp >= requiredExp * 0.5) {
        score += experienceWeight * 0.5;
      }
    }
    maxScore += experienceWeight;

    // Location matching (15% weight)
    const locationWeight = 15;
    if (job.location && candidate.profile?.location) {
      const jobLocation = job.location.toLowerCase();
      const candidateLocation = candidate.profile.location.toLowerCase();
      if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
        score += locationWeight;
      } else if (job.remote) {
        score += locationWeight * 0.8; // Remote work bonus
      }
    } else if (job.remote) {
      score += locationWeight;
    }
    maxScore += locationWeight;

    // Education matching (10% weight)
    const educationWeight = 10;
    if (job.education && candidate.profile?.education) {
      const jobEdu = job.education.toLowerCase();
      const candidateEdu = candidate.profile.education.degree?.toLowerCase() || '';
      if (candidateEdu.includes(jobEdu) || jobEdu.includes(candidateEdu)) {
        score += educationWeight;
      }
    }
    maxScore += educationWeight;

    // Salary expectations matching (10% weight)
    const salaryWeight = 10;
    if (job.salary && candidate.profile?.salaryExpectation) {
      const jobMax = job.salary.max || job.salary.min;
      const candidateExpected = candidate.profile.salaryExpectation;
      if (candidateExpected <= jobMax) {
        score += salaryWeight;
      } else if (candidateExpected <= jobMax * 1.2) {
        score += salaryWeight * 0.7;
      }
    }
    maxScore += salaryWeight;

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  // Get matching candidates for a job
  async getMatchingCandidates(jobId, options = {}) {
    try {
      if (!this.Job || !this.User) {
        throw new Error('Models not available');
      }

      const { limit = 15, minScore = 30 } = options;

      // Get job details
      const job = await this.Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Build candidate search query
      const searchQuery = { 
        role: 'jobseeker',
        'profile.isActive': { $ne: false }
      };

      // Add skill-based filtering for better performance
      if (job.requiredSkills && job.requiredSkills.length > 0) {
        searchQuery['profile.skills'] = { 
          $in: job.requiredSkills.map(skill => new RegExp(skill, 'i'))
        };
      }

      // Get candidates
      const candidates = await this.User.find(searchQuery)
        .select('firstName lastName email profile resumes')
        .populate('resumes', 'filename skills experience')
        .limit(limit * 3); // Get more candidates to filter by score

      // Calculate match scores and sort
      const candidatesWithScores = candidates.map(candidate => {
        const matchScore = this.calculateMatchScore(job, candidate);
        return {
          ...candidate.toObject(),
          matchScore,
          matchReasons: this.getMatchReasons(job, candidate)
        };
      });

      // Filter by minimum score and sort by score
      const matchedCandidates = candidatesWithScores
        .filter(candidate => candidate.matchScore >= minScore)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      return {
        candidates: matchedCandidates,
        total: matchedCandidates.length,
        job: {
          id: job._id,
          title: job.title,
          company: job.company,
          requiredSkills: job.requiredSkills
        }
      };

    } catch (error) {
      logger.error('Get matching candidates error:', error);
      throw error;
    }
  }

  // Get detailed match reasons
  getMatchReasons(job, candidate) {
    const reasons = [];

    // Skills match
    if (job.requiredSkills && candidate.profile?.skills) {
      const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
      const candidateSkills = candidate.profile.skills.map(s => s.toLowerCase());
      const matchingSkills = jobSkills.filter(skill => 
        candidateSkills.some(cSkill => cSkill.includes(skill) || skill.includes(cSkill))
      );
      
      if (matchingSkills.length > 0) {
        reasons.push({
          type: 'skills',
          message: `Matches ${matchingSkills.length}/${jobSkills.length} required skills`,
          details: matchingSkills
        });
      }
    }

    // Experience match
    if (job.experienceLevel && candidate.profile?.experience?.years !== undefined) {
      const jobExpMap = { 'entry': 0, 'mid': 3, 'senior': 7, 'lead': 10 };
      const requiredExp = jobExpMap[job.experienceLevel] || 0;
      const candidateExp = candidate.profile.experience.years;
      
      if (candidateExp >= requiredExp) {
        reasons.push({
          type: 'experience',
          message: `${candidateExp} years experience (${job.experienceLevel} level required)`,
          details: { required: requiredExp, candidate: candidateExp }
        });
      }
    }

    // Location match
    if (job.location && candidate.profile?.location) {
      const jobLocation = job.location.toLowerCase();
      const candidateLocation = candidate.profile.location.toLowerCase();
      if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
        reasons.push({
          type: 'location',
          message: `Located in ${candidate.profile.location}`,
          details: { job: job.location, candidate: candidate.profile.location }
        });
      }
    }

    // Remote work compatibility
    if (job.remote) {
      reasons.push({
        type: 'remote',
        message: 'Open to remote work',
        details: { remote: true }
      });
    }

    return reasons;
  }

  // Real-time candidate search with advanced filtering
  async searchCandidatesRealTime(searchCriteria) {
    try {
      if (!this.User) {
        throw new Error('User model not available');
      }

      const {
        skills = [],
        location,
        experience,
        education,
        salaryRange,
        availability,
        keywords,
        limit = 15
      } = searchCriteria;

      const searchQuery = { 
        role: 'jobseeker',
        'profile.isActive': { $ne: false }
      };

      // Skills filtering
      if (skills.length > 0) {
        searchQuery['profile.skills'] = { 
          $in: skills.map(skill => new RegExp(skill, 'i'))
        };
      }

      // Location filtering
      if (location) {
        searchQuery['profile.location'] = { $regex: location, $options: 'i' };
      }

      // Experience filtering
      if (experience) {
        if (experience.min !== undefined) {
          searchQuery['profile.experience.years'] = { $gte: experience.min };
        }
        if (experience.max !== undefined) {
          searchQuery['profile.experience.years'] = { 
            ...searchQuery['profile.experience.years'],
            $lte: experience.max 
          };
        }
      }

      // Education filtering
      if (education) {
        searchQuery['profile.education.degree'] = { $regex: education, $options: 'i' };
      }

      // Salary filtering
      if (salaryRange) {
        if (salaryRange.max) {
          searchQuery['profile.salaryExpectation'] = { $lte: salaryRange.max };
        }
      }

      // Availability filtering
      if (availability) {
        searchQuery['profile.availability'] = availability;
      }

      // Keywords search
      if (keywords) {
        searchQuery.$or = [
          { 'profile.title': { $regex: keywords, $options: 'i' } },
          { 'profile.summary': { $regex: keywords, $options: 'i' } },
          { 'profile.skills': { $in: [new RegExp(keywords, 'i')] } }
        ];
      }

      const candidates = await this.User.find(searchQuery)
        .select('firstName lastName email profile resumes')
        .populate('resumes', 'filename skills experience')
        .sort({ 'profile.lastActive': -1, createdAt: -1 })
        .limit(limit);

      return {
        candidates: candidates.map(candidate => ({
          ...candidate.toObject(),
          relevanceScore: this.calculateRelevanceScore(candidate, searchCriteria)
        })),
        total: candidates.length,
        searchCriteria
      };

    } catch (error) {
      logger.error('Real-time candidate search error:', error);
      throw error;
    }
  }

  // Calculate relevance score for search results
  calculateRelevanceScore(candidate, searchCriteria) {
    let score = 0;
    let factors = 0;

    // Skills relevance
    if (searchCriteria.skills && candidate.profile?.skills) {
      const matchingSkills = searchCriteria.skills.filter(skill =>
        candidate.profile.skills.some(cSkill => 
          cSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      score += (matchingSkills.length / searchCriteria.skills.length) * 30;
      factors += 30;
    }

    // Experience relevance
    if (searchCriteria.experience && candidate.profile?.experience?.years) {
      const expScore = Math.min(candidate.profile.experience.years / (searchCriteria.experience.max || 10), 1) * 25;
      score += expScore;
      factors += 25;
    }

    // Location relevance
    if (searchCriteria.location && candidate.profile?.location) {
      if (candidate.profile.location.toLowerCase().includes(searchCriteria.location.toLowerCase())) {
        score += 20;
      }
      factors += 20;
    }

    // Profile completeness bonus
    const completeness = this.calculateProfileCompleteness(candidate);
    score += completeness * 0.25;
    factors += 25;

    return factors > 0 ? Math.round(score / factors * 100) : 50;
  }

  // Calculate profile completeness
  calculateProfileCompleteness(candidate) {
    const profile = candidate.profile || {};
    let completeness = 0;
    const fields = ['title', 'summary', 'skills', 'experience', 'education', 'location'];
    
    fields.forEach(field => {
      if (profile[field] && 
          (Array.isArray(profile[field]) ? profile[field].length > 0 : profile[field])) {
        completeness += 1;
      }
    });

    return (completeness / fields.length) * 100;
  }

  // Get candidate recommendations for multiple jobs
  async getBulkCandidateMatches(jobIds, options = {}) {
    try {
      const results = {};
      
      for (const jobId of jobIds) {
        try {
          results[jobId] = await this.getMatchingCandidates(jobId, options);
        } catch (error) {
          logger.error(`Error matching candidates for job ${jobId}:`, error);
          results[jobId] = { candidates: [], total: 0, error: error.message };
        }
      }

      return results;
    } catch (error) {
      logger.error('Bulk candidate matching error:', error);
      throw error;
    }
  }
}

module.exports = new CandidateMatchingService();