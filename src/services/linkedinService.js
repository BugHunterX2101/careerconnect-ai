const axios = require('axios');
const logger = require('../middleware/logger');

// ---------------------------------------------------------------------------
// Curated mock jobs used when LinkedIn API credentials are absent or the API
// returns no results.  Covers a wide range of roles / locations so that the
// recommendations feature always returns something useful in dev/staging.
// ---------------------------------------------------------------------------
const MOCK_JOBS = [
  { id: 'mock-1', title: 'Senior React Developer', company: 'TechCorp', location: 'Remote', description: 'Build modern web apps with React and TypeScript.', skills: ['react', 'typescript', 'node.js', 'graphql'], salary: { min: 90000, max: 130000, currency: 'USD' }, type: 'full-time', experienceLevel: 'senior', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-2', title: 'Python Data Scientist', company: 'DataInc', location: 'New York, NY', description: 'Machine learning and statistical modelling at scale.', skills: ['python', 'machine learning', 'tensorflow', 'sql'], salary: { min: 95000, max: 140000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: false, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-3', title: 'DevOps Engineer', company: 'CloudSystems', location: 'San Francisco, CA', description: 'CI/CD pipelines, Kubernetes, AWS infrastructure.', skills: ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform'], salary: { min: 100000, max: 150000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-4', title: 'Full Stack Engineer', company: 'StartupXYZ', location: 'Austin, TX', description: 'Node.js / React full-stack product development.', skills: ['javascript', 'react', 'node.js', 'mongodb', 'rest api'], salary: { min: 85000, max: 120000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: false, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-5', title: 'Machine Learning Engineer', company: 'AI Labs', location: 'Remote', description: 'Research and deploy ML models in production.', skills: ['python', 'pytorch', 'machine learning', 'data science', 'aws'], salary: { min: 120000, max: 180000, currency: 'USD' }, type: 'full-time', experienceLevel: 'senior', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-6', title: 'Backend Java Developer', company: 'FinancePro', location: 'Chicago, IL', description: 'Build high-throughput financial systems in Java / Spring Boot.', skills: ['java', 'spring', 'sql', 'microservices', 'rest api'], salary: { min: 95000, max: 135000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: false, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-7', title: 'Cloud Solutions Architect', company: 'EnterpriseCloud', location: 'Seattle, WA', description: 'Design AWS / Azure cloud architectures for enterprise clients.', skills: ['aws', 'azure', 'cloud', 'kubernetes', 'terraform'], salary: { min: 140000, max: 200000, currency: 'USD' }, type: 'full-time', experienceLevel: 'senior', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-8', title: 'iOS Developer', company: 'MobileFirst', location: 'Los Angeles, CA', description: 'SwiftUI apps with a strong focus on UX.', skills: ['swift', 'ios', 'swiftui', 'xcode', 'rest api'], salary: { min: 85000, max: 125000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: false, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-9', title: 'Cybersecurity Analyst', company: 'SecureNet', location: 'Washington, DC', description: 'Threat detection, incident response, and vulnerability management.', skills: ['cybersecurity', 'networking', 'python', 'siem', 'cloud'], salary: { min: 90000, max: 130000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-10', title: 'Frontend Engineer (Vue.js)', company: 'UXStudio', location: 'Remote', description: 'Build beautiful, accessible UIs with Vue 3 and Tailwind.', skills: ['vue', 'javascript', 'html', 'css', 'rest api'], salary: { min: 75000, max: 110000, currency: 'USD' }, type: 'full-time', experienceLevel: 'entry', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-11', title: 'Database Administrator', company: 'DataVault', location: 'Dallas, TX', description: 'PostgreSQL / MySQL DBA for mission-critical systems.', skills: ['sql', 'postgresql', 'mysql', 'mongodb', 'aws'], salary: { min: 85000, max: 120000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: false, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-12', title: 'Site Reliability Engineer', company: 'ScaleCo', location: 'Remote', description: 'Keep large-scale distributed systems healthy and fast.', skills: ['kubernetes', 'docker', 'python', 'aws', 'monitoring'], salary: { min: 115000, max: 160000, currency: 'USD' }, type: 'full-time', experienceLevel: 'senior', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-13', title: 'QA Engineer (Automation)', company: 'QualityFirst', location: 'Boston, MA', description: 'Selenium / Cypress test automation frameworks.', skills: ['javascript', 'selenium', 'cypress', 'agile', 'ci/cd'], salary: { min: 70000, max: 100000, currency: 'USD' }, type: 'full-time', experienceLevel: 'entry', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-14', title: 'Technical Product Manager', company: 'ProductHouse', location: 'San Francisco, CA', description: 'Lead cross-functional engineering teams to ship great products.', skills: ['agile', 'rest api', 'data science', 'sql', 'cloud'], salary: { min: 120000, max: 170000, currency: 'USD' }, type: 'full-time', experienceLevel: 'senior', remote: false, source: 'linkedin-mock', postedAt: new Date().toISOString() },
  { id: 'mock-15', title: 'Blockchain Developer', company: 'ChainTech', location: 'Remote', description: 'Solidity smart contracts and Web3 dApp development.', skills: ['javascript', 'solidity', 'ethereum', 'react', 'node.js'], salary: { min: 100000, max: 160000, currency: 'USD' }, type: 'full-time', experienceLevel: 'mid', remote: true, source: 'linkedin-mock', postedAt: new Date().toISOString() },
];

class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || null;
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.organizationId = process.env.LINKEDIN_ORGANIZATION_ID;
  }

  /** Allow the OAuth callback to inject a fresh member token at runtime */
  setAccessToken(token) {
    this.accessToken = token;
  }

  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }

  // Exchange client credentials for an application access token
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;
    if (!this.isConfigured()) throw new Error('LinkedIn credentials not configured');

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    this.accessToken = response.data.access_token;
    return this.accessToken;
  }

  /**
   * Search jobs via LinkedIn Job Search API.
   * Falls back to filtered mock data when the API is unavailable / unconfigured.
   */
  async searchJobs({ keywords = '', location = '', limit = 10, start = 0 }) {
    // Attempt real API call if credentials are present
    if (this.isConfigured()) {
      try {
        const token = await this.getAccessToken();
        const params = {
          keywords: encodeURIComponent(keywords),
          location: encodeURIComponent(location),
          count: Math.min(limit, 25),
          start
        };

        const response = await axios.get(`${this.baseURL}/jobSearch`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Restli-Protocol-Version': '2.0.0'
          },
          params,
          timeout: 8000
        });

        const elements = response.data?.elements || [];
        if (elements.length > 0) {
          return this.formatJobResults(elements);
        }
        // API returned empty — fall through to mock
      } catch (apiError) {
        logger.warn(`LinkedIn Job Search API failed (${apiError.response?.status || apiError.message}), using mock data`);
      }
    }

    // --- Fallback: filter mock jobs by keyword / location ---
    return this._getMockJobs({ keywords, location, limit });
  }

  /** Filter the mock job pool by keyword / location relevance */
  _getMockJobs({ keywords = '', location = '', limit = 10 }) {
    const kw = keywords.toLowerCase().split(/\s+/).filter(Boolean);
    const loc = location.toLowerCase();

    const scored = MOCK_JOBS.map(job => {
      let score = 0;
      const haystack = [job.title, job.description, ...job.skills].join(' ').toLowerCase();
      kw.forEach(k => { if (haystack.includes(k)) score += 2; });
      if (loc && job.location.toLowerCase().includes(loc)) score += 3;
      if (loc && job.remote) score += 1; // remote jobs match any location
      return { ...job, matchScore: score };
    });

    return scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore, ...job }) => ({ ...job, matchScore }));
  }

  // Post a job to LinkedIn (requires org-level permissions)
  async postJob(jobData) {
    if (!this.isConfigured()) throw new Error('LinkedIn credentials not configured');
    const token = await this.getAccessToken();

    const jobPost = {
      author: `urn:li:organization:${this.organizationId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: jobData.description },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    };

    const response = await axios.post(`${this.baseURL}/ugcPosts`, jobPost, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      }
    });

    return { success: true, postId: response.data.id, message: 'Job posted to LinkedIn successfully' };
  }

  // Get job recommendations for a user profile
  async getLinkedInJobRecommendations(userProfile, limit = 15) {
    const skills = Array.isArray(userProfile.skills) ? userProfile.skills : [];
    const location = userProfile.location || '';
    const experience = userProfile.experience || 'entry';

    const jobs = await this.searchJobs({ keywords: skills.join(' '), location, limit: limit * 2 });

    const userSkillSet = new Set(skills.map(s => s.toLowerCase()));

    return jobs
      .filter(job => {
        if (experience === 'entry' && job.experienceLevel === 'senior') return false;
        if (experience === 'senior' && job.experienceLevel === 'entry') return false;
        return true;
      })
      .map(job => {
        const jobSkillSet = new Set((job.skills || []).map(s => s.toLowerCase()));
        const intersection = [...userSkillSet].filter(s => jobSkillSet.has(s)).length;
        const union = new Set([...userSkillSet, ...jobSkillSet]).size;
        const matchScore = union > 0 ? Math.round((intersection / union) * 100) : 0;
        return { ...job, matchScore };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  formatJobResults(jobs) {
    return jobs.map(job => ({
      id: job.id,
      title: job.title || 'Untitled',
      company: job.company?.name || 'Unknown Company',
      location: job.location?.name || 'Unknown Location',
      description: job.description || '',
      skills: job.skills || [],
      salary: { min: job.salary?.min || null, max: job.salary?.max || null, currency: job.salary?.currency || 'USD' },
      type: job.employmentStatus || 'full-time',
      postedAt: job.postedAt,
      applicationUrl: job.applicationUrl,
      source: 'linkedin',
      remote: job.remote || false,
      experienceLevel: job.experienceLevel || 'entry'
    }));
  }
}

const linkedinService = new LinkedInService();

module.exports = {
  linkedinService,
  searchLinkedInJobs: (params) => linkedinService.searchJobs(params),
  postLinkedInJob: (jobData) => linkedinService.postJob(jobData),
  getLinkedInJobRecommendations: (profile, limit) => linkedinService.getLinkedInJobRecommendations(profile, limit)
};
