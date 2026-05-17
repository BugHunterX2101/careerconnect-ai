/**
 * LinkedIn job service — backed by Apify real-time scraping.
 * All methods return live data; no mock or hardcoded fallback data.
 */
const {
  searchLinkedInJobsViaApify,
  getLinkedInRecommendations,
  getTrendingJobs
} = require('./apifyService');
const logger = require('../middleware/logger');

class LinkedInService {
  /**
   * Search LinkedIn jobs.
   * @param {Object} params
   * @param {string} params.keywords
   * @param {string} [params.location]
   * @param {number} [params.limit=25]
   * @param {string} [params.experienceLevel]
   * @param {string} [params.jobType]
   * @param {string} [params.datePosted]
   */
  async searchJobs(params = {}) {
    return searchLinkedInJobsViaApify({
      query: params.keywords || params.query || '',
      location: params.location || '',
      limit: params.limit || 25,
      experienceLevel: params.experienceLevel || '',
      jobType: params.jobType || '',
      datePosted: params.datePosted || 'past_month'
    });
  }

  /**
   * Get personalized job recommendations for a user profile.
   */
  async getJobRecommendations(userProfile, limit = 20) {
    return getLinkedInRecommendations(userProfile, limit);
  }

  /**
   * Get trending jobs in a location.
   */
  async getTrendingJobs(location = 'United States', limit = 20) {
    return getTrendingJobs(location, limit);
  }

  /**
   * Get jobs for a specific company by searching its name.
   */
  async getCompanyJobs(companyName, limit = 10) {
    try {
      return searchLinkedInJobsViaApify({
        query: companyName,
        limit,
        datePosted: 'past_month'
      });
    } catch (error) {
      logger.error('LinkedIn company jobs error:', error.message);
      return [];
    }
  }

  /**
   * Store the OAuth access token for runtime use (called by auth route after LinkedIn OAuth).
   * The token is kept in the environment so apifyService can use it if needed.
   */
  setAccessToken(token) {
    if (token) {
      process.env.LINKEDIN_MEMBER_ACCESS_TOKEN = token;
    }
  }

  /**
   * Salary insights — not supported by scraping; returns null intentionally.
   */
  getSalaryInsights(_jobTitle, _location) {
    return null;
  }
}

const linkedinService = new LinkedInService();

module.exports = {
  linkedinService,
  searchLinkedInJobs: (params) => linkedinService.searchJobs(params),
  getLinkedInJobRecommendations: (profile, limit) => linkedinService.getJobRecommendations(profile, limit),
  getTrendingLinkedInJobs: (location, limit) => linkedinService.getTrendingJobs(location, limit)
};
