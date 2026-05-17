const { searchLinkedInJobsViaApify } = require('../services/apifyService');
const TensorFlowService = require('./tensorflowService');
const logger = require('../middleware/logger');

class JobRecommender {
  constructor() {
    this.tfService = new TensorFlowService();
    this.isInitialized = false;
    this.mlScoreCache = new Map();
  }

  async initialize() {
    try {
      await this.tfService.initialize();
      logger.info('JobRecommender initialized with TensorFlow scoring');
    } catch (error) {
      logger.warn('TensorFlow unavailable, using traditional scoring only:', error.message);
    }
    this.isInitialized = true;
  }

  async getJobRecommendations(user, options = {}) {
    if (!this.isInitialized) await this.initialize();

    const {
      page = 1,
      limit = 10,
      location,
      remote
    } = options;

    const userSkills = this.extractUserSkills(user);
    const userExperience = this.extractUserExperience(user);
    const userLocation = location || user.profile?.location || user.location || '';
    const expLevel = this.mapExperienceLevel(userExperience);
    const query = userSkills.slice(0, 5).join(' ') || 'software engineer';

    try {
      const jobs = await searchLinkedInJobsViaApify({
        query,
        location: userLocation || 'United States',
        limit: Math.min((page * limit) + 20, 100),
        experienceLevel: expLevel,
        datePosted: 'past_month'
      });

      const filtered = jobs.filter(job => {
        if (remote !== undefined && job.remote !== remote) return false;
        return true;
      });

      const scored = await Promise.all(
        filtered.map(async job => ({
          ...job,
          score: await this.calculateJobScore(job, userSkills, userExperience, userLocation, user)
        }))
      );

      scored.sort((a, b) => b.score - a.score);

      const startIndex = (page - 1) * limit;
      const paginated = scored.slice(startIndex, startIndex + limit);

      return {
        jobs: paginated,
        total: scored.length,
        page,
        totalPages: Math.ceil(scored.length / limit)
      };
    } catch (error) {
      logger.error('JobRecommender.getJobRecommendations error:', error.message);
      return { jobs: [], total: 0, page, totalPages: 0 };
    }
  }

  async searchJobs(query, filters = {}) {
    if (!this.isInitialized) await this.initialize();

    const { location, remote, job_type, page = 1, limit = 20 } = filters;

    try {
      const jobs = await searchLinkedInJobsViaApify({
        query: query || 'software engineer',
        location: location || 'United States',
        limit: Math.min((page * limit) + 20, 100),
        jobType: job_type || '',
        datePosted: 'past_month'
      });

      const filtered = jobs.filter(job => {
        if (remote !== undefined && job.remote !== remote) return false;
        return true;
      });

      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      return {
        jobs: paginated,
        total: filtered.length,
        page,
        totalPages: Math.ceil(filtered.length / limit)
      };
    } catch (error) {
      logger.error('JobRecommender.searchJobs error:', error.message);
      return { jobs: [], total: 0, page, totalPages: 0 };
    }
  }

  async getSimilarJobs(jobId, baseQuery = '') {
    if (!this.isInitialized) await this.initialize();

    try {
      const jobs = await searchLinkedInJobsViaApify({
        query: baseQuery || 'software engineer',
        location: 'United States',
        limit: 10,
        datePosted: 'past_month'
      });
      return jobs.filter(j => j.id !== jobId).slice(0, 5);
    } catch (error) {
      logger.error('JobRecommender.getSimilarJobs error:', error.message);
      return [];
    }
  }

  // ─── Scoring ─────────────────────────────────────────────────────────────

  async calculateJobScore(job, userSkills, userExperience, userLocation, user = null) {
    let score = 0;

    // TensorFlow ML scoring — 30% weight when available
    if (user && this.tfService.isInitialized) {
      try {
        const cacheKey = `${user.id || user.userId}_${job.id}`;
        let mlScore;
        if (this.mlScoreCache.has(cacheKey)) {
          mlScore = this.mlScoreCache.get(cacheKey);
        } else {
          const userFeatures = this.tfService.extractUserFeatures(user);
          const jobFeatures = this.tfService.extractJobFeatures(job);
          mlScore = await this.tfService.calculateJobScore(userFeatures, jobFeatures);
          this.mlScoreCache.set(cacheKey, mlScore);
        }
        score += mlScore * 60;
      } catch (error) {
        logger.warn('ML scoring failed, using traditional scoring only');
      }
    }

    // Traditional scoring — 40% when TF active, 100% when TF unavailable
    const tWeight = (user && this.tfService.isInitialized) ? 40 : 100;

    const skillMatch = this.calculateSkillMatch(job, userSkills);
    score += (skillMatch * 40 * tWeight) / 100;

    const expMatch = this.calculateExperienceMatch(userExperience);
    score += (expMatch * 25 * tWeight) / 100;

    const locMatch = this.calculateLocationMatch(job.location, userLocation);
    score += (locMatch * 20 * tWeight) / 100;

    const salMatch = this.calculateSalaryMatch(job.salary, userExperience);
    score += (salMatch * 15 * tWeight) / 100;

    return Math.min(Math.round(score), 100);
  }

  calculateSkillMatch(job, userSkills) {
    if (!userSkills || userSkills.length === 0) return 0;
    const jobText = `${job.title} ${job.description} ${(job.skills || []).join(' ')}`.toLowerCase();
    const matched = userSkills.filter(s => jobText.includes(s.toLowerCase()));
    return (matched.length / userSkills.length) * 100;
  }

  calculateExperienceMatch(userExperience) {
    if (userExperience >= 5) return 100;
    if (userExperience >= 3) return 80;
    if (userExperience >= 1) return 60;
    return 40;
  }

  calculateLocationMatch(jobLocation, userLocation) {
    if (!userLocation) return 50;
    const jobLoc = (jobLocation || '').toLowerCase();
    const uLoc = userLocation.toLowerCase();
    if (jobLoc.includes('remote')) return 90;
    if (jobLoc.includes(uLoc) || uLoc.includes(jobLoc)) return 100;
    const jobParts = jobLoc.split(',').map(p => p.trim());
    const uParts = uLoc.split(',').map(p => p.trim());
    for (const jp of jobParts) {
      for (const up of uParts) {
        if (jp === up && jp.length > 2) return 80;
      }
    }
    return 30;
  }

  calculateSalaryMatch(jobSalary, userExperience) {
    if (!jobSalary) return 50;
    const salaryStr = String(jobSalary);
    const nums = salaryStr.match(/\d[\d,]*/g);
    if (!nums || nums.length < 1) return 50;
    const values = nums.map(n => parseInt(n.replace(/,/g, '')));
    const avg = values.length >= 2
      ? (values[0] + values[values.length - 1]) / 2
      : values[0];
    const expected = userExperience * 15000 + 50000;
    const pctDiff = Math.abs(avg - expected) / expected * 100;
    if (pctDiff <= 10) return 100;
    if (pctDiff <= 20) return 80;
    if (pctDiff <= 30) return 60;
    return 40;
  }

  // ─── User profile extraction ──────────────────────────────────────────────

  extractUserSkills(user) {
    const skills = new Set();
    if (user.resumes) {
      for (const resume of user.resumes) {
        if (Array.isArray(resume.skills)) {
          resume.skills.forEach(s => skills.add((s.name || s).toLowerCase()));
        }
      }
    }
    if (user.profile?.skills) {
      user.profile.skills.forEach(s => skills.add((s.name || s).toLowerCase()));
    }
    if (Array.isArray(user.skills)) {
      user.skills.forEach(s => skills.add((typeof s === 'object' ? s.name : s).toLowerCase()));
    }
    return [...skills].filter(Boolean);
  }

  extractUserExperience(user) {
    let total = 0;
    if (user.resumes) {
      for (const resume of user.resumes) {
        if (Array.isArray(resume.experience)) {
          for (const exp of resume.experience) {
            if (exp.duration) total += this.parseDuration(exp.duration);
          }
        }
      }
    }
    if (Array.isArray(user.experience)) {
      total = Math.max(total, user.experience.length * 1.5);
    }
    return Math.round(total);
  }

  parseDuration(duration) {
    const rangeMatch = String(duration).match(/\b(\d{4})\s*[-–]\s*(\d{4})\b/);
    if (rangeMatch) return parseInt(rangeMatch[2]) - parseInt(rangeMatch[1]);
    const numMatch = String(duration).match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1]) : 0;
  }

  mapExperienceLevel(years) {
    if (years >= 8) return 'director';
    if (years >= 5) return 'mid_senior_level';
    if (years >= 2) return 'associate';
    return 'entry_level';
  }

  // ─── Model lifecycle (delegates to TensorFlow service) ───────────────────

  async trainRecommendationModel(trainingData) {
    if (!this.isInitialized) await this.initialize();
    await this.tfService.trainModel(trainingData);
    logger.info('Recommendation model trained');
  }

  async saveModel(modelPath) {
    await this.tfService.saveModel(modelPath);
  }

  async loadModel(modelPath) {
    await this.tfService.loadModel(modelPath);
  }

  dispose() {
    this.tfService.dispose();
    this.mlScoreCache.clear();
  }
}

module.exports = JobRecommender;
