const axios = require('axios');
const logger = require('../middleware/logger');

class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.organizationId = process.env.LINKEDIN_ORGANIZATION_ID;
  }

  // Get access token using client credentials
  async getAccessToken() {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);

      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data.access_token;
    } catch (error) {
      logger.error('LinkedIn access token error:', error.response?.data || error.message);
      throw new Error('Failed to get LinkedIn access token');
    }
  }

  // Search jobs on LinkedIn using Job Search API
  async searchJobs({ keywords, location, limit = 10, start = 0 }) {
    try {
      // LinkedIn Job Search API requires different authentication
      // For now, return realistic mock data based on LinkedIn job patterns
      return this.generateLinkedInStyleJobs({ keywords, location, limit });
    } catch (error) {
      logger.error('LinkedIn job search error:', error);
      return [];
    }
  }

  // Generate LinkedIn-style job data
  generateLinkedInStyleJobs({ keywords, location, limit }) {
    const linkedInCompanies = [
      'Microsoft', 'Google', 'Amazon', 'Meta', 'Apple', 'Netflix',
      'Uber', 'Airbnb', 'Spotify', 'Tesla', 'Salesforce', 'Adobe'
    ];

    const jobs = [];
    for (let i = 0; i < limit; i++) {
      const company = linkedInCompanies[Math.floor(Math.random() * linkedInCompanies.length)];
      jobs.push({
        id: `li_${Date.now()}_${i}`,
        title: this.generateJobTitle(keywords),
        company: { name: company },
        location: { name: location || 'Remote' },
        description: `Join ${company} and work on innovative projects. ${keywords ? `Experience with ${keywords} required.` : ''}`,
        requirements: keywords ? keywords.split(' ').slice(0, 3) : ['JavaScript', 'React'],
        salary: {
          min: Math.floor(Math.random() * 50000) + 80000,
          max: Math.floor(Math.random() * 50000) + 130000,
          currency: 'USD'
        },
        employmentStatus: 'full-time',
        postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        applicationUrl: `https://www.linkedin.com/jobs/view/${Math.floor(Math.random() * 1000000000)}/`,
        remote: location === 'Remote' || Math.random() > 0.6,
        experienceLevel: ['entry', 'mid', 'senior'][Math.floor(Math.random() * 3)],
        skills: keywords ? keywords.split(' ').slice(0, 4) : ['JavaScript', 'React', 'Node.js']
      });
    }
    return this.formatJobResults(jobs);
  }

  generateJobTitle(keywords) {
    const titles = [
      'Software Engineer', 'Senior Developer', 'Full Stack Developer',
      'Frontend Engineer', 'Backend Developer', 'DevOps Engineer'
    ];
    
    if (keywords) {
      if (keywords.toLowerCase().includes('react')) return 'React Developer';
      if (keywords.toLowerCase().includes('python')) return 'Python Developer';
      if (keywords.toLowerCase().includes('java')) return 'Java Developer';
    }
    
    return titles[Math.floor(Math.random() * titles.length)];
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
      logger.error('LinkedIn job posting error:', error);
      throw new Error('Failed to post job to LinkedIn');
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
      // This would require LinkedIn's Salary Insights API
      // For now, return mock data
      return {
        jobTitle,
        location,
        averageSalary: 75000,
        salaryRange: {
          min: 50000,
          max: 100000
        },
        currency: 'USD',
        dataPoints: 150,
        lastUpdated: new Date().toISOString()
      };
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
