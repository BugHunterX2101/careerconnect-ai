/**
 * Enhanced job recommendation service — 100% real-time data via Apify.
 * No hardcoded companies, no fake listings, no mock salary data.
 */
const { searchLinkedInJobsViaApify, getLinkedInRecommendations } = require('./apifyService');
const logger = require('../middleware/logger');

class EnhancedJobRecommendationService {
  constructor() {
    this.targetJobCount = 20;
  }

  /**
   * Get comprehensive job recommendations with profile improvement suggestions.
   * @param {Object} userProfile
   * @param {Object} resume - Parsed resume data
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async getEnhancedRecommendations(userProfile, resume, options = {}) {
    try {
      const userSkills = this.extractSkills(userProfile, resume);
      const userExperience = this.extractExperience(userProfile, resume);
      const userLocation = typeof userProfile.location === 'object'
        ? [userProfile.location.city, userProfile.location.state, userProfile.location.country].filter(Boolean).join(', ')
        : (userProfile.location || options.location || '');

      // Fetch real-time LinkedIn jobs via Apify
      const jobs = await getLinkedInRecommendations(
        {
          skills: userSkills,
          location: userLocation,
          currentRole: userProfile.title || '',
          experienceLevel: this.mapExperienceLevel(userExperience.totalYears)
        },
        Math.max(this.targetJobCount, options.limit || this.targetJobCount)
      );

      const scoredJobs = this.scoreAndRankJobs(jobs, userProfile, resume);
      const profileSuggestions = this.generateProfileSuggestions(userProfile, resume, scoredJobs);

      return {
        success: true,
        count: scoredJobs.length,
        jobs: scoredJobs,
        profileSuggestions,
        userStats: {
          totalSkills: userSkills.length,
          yearsOfExperience: userExperience.totalYears,
          profileCompleteness: this.calculateProfileCompleteness(userProfile, resume)
        },
        source: 'LinkedIn (Real-time via Apify)',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Enhanced job recommendation error:', error);
      throw error;
    }
  }

  /**
   * Search jobs with specific filters via Apify.
   */
  async searchJobs(query, filters = {}) {
    const jobs = await searchLinkedInJobsViaApify({
      query,
      location: filters.location || '',
      limit: filters.limit || 25,
      experienceLevel: filters.experienceLevel || '',
      jobType: filters.jobType || '',
      datePosted: filters.datePosted || 'past_month'
    });
    return jobs;
  }

  // ─── Scoring ─────────────────────────────────────────────────────────────

  scoreAndRankJobs(jobs, userProfile, resume) {
    const userSkills = this.extractSkills(userProfile, resume).map(s => s.toLowerCase());

    return jobs
      .map(job => {
        const breakdown = {};
        let totalScore = 0;

        // Skills match (40%)
        const skillsMatch = this.calculateSkillsMatch(job, userSkills);
        breakdown.skills = skillsMatch.score;
        totalScore += skillsMatch.score * 0.4;

        // Location match (20%)
        const locationMatch = this.calculateLocationMatch(job.location, userProfile);
        breakdown.location = locationMatch.score;
        totalScore += locationMatch.score * 0.2;

        // Title relevance (25%)
        const titleScore = this.calculateTitleRelevance(job.title, userProfile);
        breakdown.title = titleScore;
        totalScore += titleScore * 0.25;

        // Recency (15%)
        const recencyScore = this.calculateRecencyScore(job.postedAt);
        breakdown.recency = recencyScore;
        totalScore += recencyScore * 0.15;

        return {
          ...job,
          matchScore: Math.round(Math.min(totalScore, 100)),
          matchBreakdown: breakdown,
          matchReasons: skillsMatch.matchedSkills.length > 0
            ? [`Matches your skills: ${skillsMatch.matchedSkills.slice(0, 3).join(', ')}`]
            : []
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  calculateSkillsMatch(job, userSkillsLower) {
    if (!userSkillsLower.length) return { score: 50, matchedSkills: [] };
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const matchedSkills = userSkillsLower.filter(s => jobText.includes(s));
    const score = Math.round((matchedSkills.length / userSkillsLower.length) * 100);
    return { score: Math.min(score, 100), matchedSkills };
  }

  calculateLocationMatch(jobLocation, userProfile) {
    const userLoc = typeof userProfile.location === 'object'
      ? userProfile.location.city || ''
      : (userProfile.location || '');

    if (!userLoc) return { score: 60, message: 'Location not specified' };

    const jobLocLower = (jobLocation || '').toLowerCase();
    const userLocLower = userLoc.toLowerCase();

    if (jobLocLower.includes('remote')) return { score: 90, message: 'Remote position' };
    if (jobLocLower.includes(userLocLower) || userLocLower.includes(jobLocLower)) {
      return { score: 100, message: 'Location match' };
    }
    return { score: 40, message: 'Different location' };
  }

  calculateTitleRelevance(jobTitle, userProfile) {
    const userTitle = (userProfile.title || userProfile.currentRole || '').toLowerCase();
    const jobTitleLower = (jobTitle || '').toLowerCase();
    if (!userTitle) return 50;
    if (jobTitleLower.includes(userTitle) || userTitle.includes(jobTitleLower)) return 100;
    const userWords = userTitle.split(/\s+/);
    const matches = userWords.filter(w => w.length > 3 && jobTitleLower.includes(w));
    return Math.round((matches.length / Math.max(userWords.length, 1)) * 100);
  }

  calculateRecencyScore(postedAt) {
    if (!postedAt) return 50;
    const daysAgo = (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 1) return 100;
    if (daysAgo <= 7) return 85;
    if (daysAgo <= 14) return 70;
    if (daysAgo <= 30) return 55;
    return 30;
  }

  // ─── Profile analysis ────────────────────────────────────────────────────

  extractSkills(userProfile, resume) {
    const skills = new Set();
    if (Array.isArray(userProfile.skills)) {
      userProfile.skills.forEach(s => skills.add(typeof s === 'object' ? s.name : s));
    }
    if (resume && Array.isArray(resume.skills)) {
      resume.skills.forEach(s => skills.add(s.name || s));
    }
    return [...skills].filter(Boolean);
  }

  extractExperience(userProfile, resume) {
    let totalYears = 0;
    if (Array.isArray(userProfile.experience)) {
      totalYears = userProfile.experience.length * 1.5;
    }
    if (resume && Array.isArray(resume.experience)) {
      totalYears = Math.max(totalYears, resume.experience.length * 1.5);
    }
    return { totalYears: Math.round(totalYears) };
  }

  mapExperienceLevel(years) {
    if (years >= 8) return 'director';
    if (years >= 5) return 'mid_senior_level';
    if (years >= 2) return 'associate';
    return 'entry_level';
  }

  calculateProfileCompleteness(userProfile, resume) {
    const checks = [
      !!userProfile.firstName,
      !!userProfile.lastName,
      !!userProfile.email,
      !!userProfile.location,
      !!(userProfile.skills && userProfile.skills.length > 0),
      !!userProfile.bio,
      !!(resume && resume.experience && resume.experience.length > 0),
      !!(resume && resume.education && resume.education.length > 0)
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  generateProfileSuggestions(userProfile, resume, jobs) {
    const suggestions = [];
    const missing = [];

    if (!userProfile.bio) missing.push('Professional summary');
    if (!userProfile.location) missing.push('Location');
    if (!userProfile.skills || userProfile.skills.length < 5) missing.push('More skills (at least 5)');
    if (!resume || !resume.experience || resume.experience.length === 0) missing.push('Work experience');
    if (!resume || !resume.education || resume.education.length === 0) missing.push('Education');

    if (missing.length > 0) {
      suggestions.push({
        type: 'profile_completion',
        priority: 'high',
        title: 'Complete your profile',
        description: `Add missing sections: ${missing.join(', ')}`,
        action: 'Edit your profile to increase match scores'
      });
    }

    // Identify skills appearing frequently in matched jobs but missing from profile
    if (jobs.length > 0) {
      const profileSkills = new Set(
        (userProfile.skills || []).map(s => (typeof s === 'object' ? s.name : s).toLowerCase())
      );
      const jobSkillFreq = {};
      jobs.forEach(job => {
        (job.skills || []).forEach(skill => {
          const s = skill.toLowerCase();
          if (!profileSkills.has(s)) {
            jobSkillFreq[s] = (jobSkillFreq[s] || 0) + 1;
          }
        });
      });

      const trendingSkills = Object.entries(jobSkillFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill]) => skill);

      if (trendingSkills.length > 0) {
        suggestions.push({
          type: 'skill_gap',
          priority: 'medium',
          title: 'High-demand skills in your target roles',
          description: `These skills appear frequently in your recommended jobs: ${trendingSkills.join(', ')}`,
          action: 'Add these skills to your profile to improve match scores'
        });
      }
    }

    return suggestions;
  }
}

module.exports = new EnhancedJobRecommendationService();
