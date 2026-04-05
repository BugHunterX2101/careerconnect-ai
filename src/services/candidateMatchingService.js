const logger = require('../middleware/logger');

class CandidateMatchingService {
  constructor() {
    this.User = null;
    this.Job = null;
    this.initializeModels();
  }

  initializeModels() {
    try {
      const userModule = require('../models/User');
      if (typeof userModule?.User === 'function') {
        this.User = userModule.User();
      } else {
        this.User = userModule;
      }
      this.Job = require('../models/Job');
    } catch (error) {
      console.warn('Models not available for candidate matching:', error.message);
    }
  }

  getCandidateSkills(candidate) {
    const profileSkills = Array.isArray(candidate?.profile?.skills) ? candidate.profile.skills : [];
    const rootSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];
    return [...profileSkills, ...rootSkills]
      .map((skill) => String(skill).trim())
      .filter(Boolean);
  }

  getCandidateLocation(candidate) {
    if (typeof candidate?.profile?.location === 'string' && candidate.profile.location.trim()) {
      return candidate.profile.location;
    }
    if (typeof candidate?.location === 'string' && candidate.location.trim()) {
      return candidate.location;
    }
    return '';
  }

  getCandidateExperienceYears(candidate) {
    const profileYears = candidate?.profile?.experience?.years;
    if (typeof profileYears === 'number') {
      return profileYears;
    }

    if (Array.isArray(candidate?.experience) && candidate.experience.length > 0) {
      return candidate.experience.length;
    }

    return 0;
  }

  getJobSkills(job) {
    const requiredSkills = Array.isArray(job?.requiredSkills) ? job.requiredSkills : [];
    if (requiredSkills.length > 0) {
      return requiredSkills.map((skill) => String(skill).trim()).filter(Boolean);
    }

    const schemaSkills = Array.isArray(job?.requirements?.skills)
      ? job.requirements.skills.map((skillEntry) => skillEntry?.name)
      : [];
    if (schemaSkills.length > 0) {
      return schemaSkills.map((skill) => String(skill).trim()).filter(Boolean);
    }

    if (Array.isArray(job?.requirements)) {
      return job.requirements.map((skill) => String(skill).trim()).filter(Boolean);
    }

    return [];
  }

  getRequiredExperienceYears(job) {
    const jobExpMap = { entry: 0, junior: 1, mid: 3, senior: 7, lead: 10 };
    if (typeof job?.experienceLevel === 'string') {
      return jobExpMap[job.experienceLevel] || 0;
    }

    return 0;
  }

  // Calculate match score between job requirements and candidate profile
  calculateMatchScore(job, candidate) {
    let score = 0;
    let maxScore = 0;
    const candidateSkillsRaw = this.getCandidateSkills(candidate);
    const candidateSkills = candidateSkillsRaw.map((skill) => skill.toLowerCase());
    const jobSkillsRaw = this.getJobSkills(job);
    const jobSkills = jobSkillsRaw.map((skill) => skill.toLowerCase());

    // Skills matching (40% weight)
    const skillsWeight = 40;
    if (jobSkills.length > 0 && candidateSkills.length > 0) {
      const matchingSkills = jobSkills.filter(skill => 
        candidateSkills.some(cSkill => cSkill.includes(skill) || skill.includes(cSkill))
      );
      const skillsScore = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * skillsWeight : 0;
      score += skillsScore;
    }
    maxScore += skillsWeight;

    // Experience matching (25% weight)
    const experienceWeight = 25;
    if (job.experienceLevel) {
      const requiredExp = this.getRequiredExperienceYears(job);
      const candidateExp = this.getCandidateExperienceYears(candidate);
      
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
    const candidateLocationRaw = this.getCandidateLocation(candidate);
    if (job.location && candidateLocationRaw) {
      const jobLocation = String(job.location).toLowerCase();
      const candidateLocation = candidateLocationRaw.toLowerCase();
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

      let candidates = [];
      if (typeof this.User.find === 'function') {
        const searchQuery = {
          role: 'jobseeker',
          'profile.isActive': { $ne: false }
        };

        const requiredSkills = this.getJobSkills(job);
        if (requiredSkills.length > 0) {
          searchQuery.$or = [
            { 'profile.skills': { $in: requiredSkills.map((skill) => new RegExp(skill, 'i')) } },
            { skills: { $in: requiredSkills.map((skill) => new RegExp(skill, 'i')) } }
          ];
        }

        candidates = await this.User.find(searchQuery)
          .select('firstName lastName email profile resumes skills experience location role')
          .populate('resumes', 'filename skills experience')
          .limit(limit * 3);
      } else if (typeof this.User.findAll === 'function') {
        candidates = await this.User.findAll({
          where: { role: 'jobseeker', isActive: true },
          limit: limit * 5
        });
      }

      const normalizedCandidates = candidates.map((candidate) => {
        if (typeof candidate?.toObject === 'function') {
          return candidate.toObject();
        }
        if (typeof candidate?.toJSON === 'function') {
          return candidate.toJSON();
        }
        return candidate;
      });

      // Calculate match scores and sort
      const candidatesWithScores = normalizedCandidates.map(candidate => {
        const matchScore = this.calculateMatchScore(job, candidate);
        return {
          ...candidate,
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
    const jobSkills = this.getJobSkills(job);
    const candidateSkills = this.getCandidateSkills(candidate);

    // Skills match
    if (jobSkills.length > 0 && candidateSkills.length > 0) {
      const normalizedJobSkills = jobSkills.map((s) => s.toLowerCase());
      const normalizedCandidateSkills = candidateSkills.map((s) => s.toLowerCase());
      const matchingSkills = normalizedJobSkills.filter(skill => 
        normalizedCandidateSkills.some(cSkill => cSkill.includes(skill) || skill.includes(cSkill))
      );
      
      if (matchingSkills.length > 0) {
        reasons.push({
          type: 'skills',
          message: `Matches ${matchingSkills.length}/${normalizedJobSkills.length} required skills`,
          details: matchingSkills
        });
      }
    }

    // Experience match
    if (job.experienceLevel) {
      const requiredExp = this.getRequiredExperienceYears(job);
      const candidateExp = this.getCandidateExperienceYears(candidate);
      
      if (candidateExp >= requiredExp) {
        reasons.push({
          type: 'experience',
          message: `${candidateExp} years experience (${job.experienceLevel} level required)`,
          details: { required: requiredExp, candidate: candidateExp }
        });
      }
    }

    // Location match
    const candidateLocation = this.getCandidateLocation(candidate);
    if (job.location && candidateLocation) {
      const jobLocation = String(job.location).toLowerCase();
      const normalizedCandidateLocation = candidateLocation.toLowerCase();
      if (normalizedCandidateLocation.includes(jobLocation) || jobLocation.includes(normalizedCandidateLocation)) {
        reasons.push({
          type: 'location',
          message: `Located in ${candidateLocation}`,
          details: { job: job.location, candidate: candidateLocation }
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