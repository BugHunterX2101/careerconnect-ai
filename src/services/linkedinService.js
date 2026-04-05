const axios = require('axios');
const logger = require('../middleware/logger');

class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
    this.accessToken = process.env.LINKEDIN_MEMBER_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN;
    this.runtimeAccessToken = null;
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.organizationId = process.env.LINKEDIN_ORGANIZATION_ID;
  }

  setAccessToken(token) {
    this.runtimeAccessToken = token ? String(token).trim() : null;
  }

  getLinkedInErrorMessage(error, fallbackMessage) {
    const responseData = error?.response?.data;
    if (!responseData) {
      return fallbackMessage;
    }

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (typeof responseData?.message === 'string' && responseData.message.trim()) {
      return responseData.message;
    }

    if (typeof responseData?.error_description === 'string' && responseData.error_description.trim()) {
      return responseData.error_description;
    }

    if (typeof responseData?.error === 'string' && responseData.error.trim()) {
      return responseData.error;
    }

    return fallbackMessage;
  }

  // LinkedIn restricted endpoints require a member OAuth token.
  async getAccessToken() {
    try {
      if (this.runtimeAccessToken) {
        return this.runtimeAccessToken;
      }

      const envToken = process.env.LINKEDIN_MEMBER_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN;
      if (envToken) {
        this.accessToken = envToken;
      }

      if (this.accessToken) {
        return this.accessToken;
      }

      throw new Error('LinkedIn member access token not configured');
    } catch (error) {
      logger.error('LinkedIn access token error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Search jobs on LinkedIn using Job Search API
  async searchJobs({ keywords, location, limit = 10, start = 0 }) {
    try {
      const token = await this.getAccessToken();
      const params = {
        count: limit,
        start
      };

      if (keywords) {
        params.keywords = keywords;
      }

      if (location) {
        params.location = location;
      }

      const response = await axios.get(`${this.baseURL}/jobSearch`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        params
      });

      const elements = response?.data?.elements || [];
      return this.formatJobResults(elements);
    } catch (error) {
      logger.error('LinkedIn job search error:', this.getLinkedInErrorMessage(error, error.message));
      return [];
    }
  }

  // Post a job to LinkedIn
  async postJob(jobData) {
    try {
      const token = await this.getAccessToken();
      
      const jobPost = {
        author: `urn:li:organization:${this.organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: jobData.description
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(`${this.baseURL}/ugcPosts`, jobPost, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        postId: response.data.id,
        message: 'Job posted to LinkedIn successfully'
      };
    } catch (error) {
      const detail = this.getLinkedInErrorMessage(error, error.message || 'Unknown LinkedIn posting error');
      logger.error('LinkedIn job posting error:', detail);
      throw new Error(`Failed to post job to LinkedIn: ${detail}`);
    }
  }

  // Get job details from LinkedIn
  async getJobDetails(jobId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return this.formatJobDetails(response.data);
    } catch (error) {
      logger.error('LinkedIn job details error:', error);
      throw new Error('Failed to get job details from LinkedIn');
    }
  }

  // Get company jobs
  async getCompanyJobs(companyId, limit = 10) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/organizations/${companyId}/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        params: {
          count: limit
        }
      });

      return this.formatJobResults(response.data.elements);
    } catch (error) {
      logger.error('LinkedIn company jobs error:', error);
      return [];
    }
  }

  // Format job search results
  formatJobResults(jobs) {
    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company?.name || 'Unknown Company',
      location: job.location?.name || 'Unknown Location',
      description: job.description || '',
      requirements: job.requirements || [],
      salary: {
        min: job.salary?.min || null,
        max: job.salary?.max || null,
        currency: job.salary?.currency || 'USD'
      },
      type: job.employmentStatus || 'full-time',
      postedAt: job.postedAt,
      applicationUrl: job.applicationUrl,
      source: 'linkedin',
      remote: job.remote || false,
      experienceLevel: job.experienceLevel || 'entry',
      skills: job.skills || []
    }));
  }

  // Format job details
  formatJobDetails(job) {
    return {
      id: job.id,
      title: job.title,
      company: job.company?.name || 'Unknown Company',
      location: job.location?.name || 'Unknown Location',
      description: job.description || '',
      requirements: job.requirements || [],
      responsibilities: job.responsibilities || [],
      benefits: job.benefits || [],
      salary: {
        min: job.salary?.min || null,
        max: job.salary?.max || null,
        currency: job.salary?.currency || 'USD'
      },
      type: job.employmentStatus || 'full-time',
      postedAt: job.postedAt,
      applicationUrl: job.applicationUrl,
      source: 'linkedin',
      remote: job.remote || false,
      experienceLevel: job.experienceLevel || 'entry',
      skills: job.skills || [],
      companyInfo: {
        name: job.company?.name,
        description: job.company?.description,
        website: job.company?.website,
        industry: job.company?.industry,
        size: job.company?.size
      }
    };
  }

  // Get job recommendations based on user profile
  async getJobRecommendations(userProfile, limit = 10) {
    try {
      const skills = userProfile.skills || [];
      const location = userProfile.location || '';
      const experience = userProfile.experience || 'entry';

      // Search for jobs matching user's skills and experience
      const keywords = skills.join(' ');
      const jobs = await this.searchJobs({
        keywords,
        location,
        limit
      });

      // Filter and rank jobs based on user profile
      const rankedJobs = jobs
        .filter(job => {
          // Filter by experience level
          if (experience === 'entry' && job.experienceLevel === 'senior') return false;
          if (experience === 'senior' && job.experienceLevel === 'entry') return false;
          return true;
        })
        .map(job => {
          // Calculate match score based on skills overlap
          const userSkills = new Set(skills.map(s => s.toLowerCase()));
          const jobSkills = new Set(job.skills.map(s => s.toLowerCase()));
          const skillMatch = [...userSkills].filter(skill => jobSkills.has(skill)).length;
          const matchScore = skillMatch / Math.max(userSkills.size, jobSkills.size);

          return {
            ...job,
            matchScore: Math.round(matchScore * 100)
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return rankedJobs.slice(0, limit);
    } catch (error) {
      logger.error('LinkedIn job recommendations error:', error);
      return [];
    }
  }

  // Get trending jobs in a location
  async getTrendingJobs(location, limit = 10) {
    try {
      const response = await this.searchJobs({
        keywords: 'trending jobs',
        location,
        limit
      });

      return response;
    } catch (error) {
      logger.error('LinkedIn trending jobs error:', error);
      return [];
    }
  }

  // Get salary insights for a job title
  async getSalaryInsights(jobTitle, location) {
    try {
      return null;
    } catch (error) {
      logger.error('LinkedIn salary insights error:', error);
      return null;
    }
  }
}

// Export singleton instance
const linkedinService = new LinkedInService();

// Export individual functions for easier testing
const searchLinkedInJobs = (params) => linkedinService.searchJobs(params);
const postLinkedInJob = (jobData) => linkedinService.postJob(jobData);
const getLinkedInJobDetails = (jobId) => linkedinService.getJobDetails(jobId);
const getLinkedInJobRecommendations = (userProfile, limit) => linkedinService.getJobRecommendations(userProfile, limit);

module.exports = {
  linkedinService,
  searchLinkedInJobs,
  postLinkedInJob,
  getLinkedInJobDetails,
  getLinkedInJobRecommendations
};
