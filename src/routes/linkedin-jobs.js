const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { linkedinService } = require('../services/linkedinService');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for LinkedIn API requests
const linkedinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many LinkedIn requests, please try again later.',
});

// @route   POST /api/linkedin-jobs/search
// @desc    Search jobs on LinkedIn
// @access  Private
router.post('/search', authenticateToken, linkedinLimiter, async (req, res) => {
  try {
    const { keywords, location, jobType, remote, experienceLevel, limit = 25 } = req.body;

    const searchParams = {
      keywords,
      location,
      jobType,
      remote,
      experienceLevel,
      limit: parseInt(limit)
    };

    const jobs = await linkedinService.searchJobs(searchParams);

    // Enhance jobs with additional metadata
    const enhancedJobs = jobs.map(job => ({
      ...job,
      source: 'LinkedIn',
      isExternal: true,
      platform: 'linkedin',
      searchRelevance: calculateRelevance(job, searchParams),
      applicationUrl: job.applicationUrl || `https://www.linkedin.com/jobs/view/${job.id}/`
    }));

    res.json({
      success: true,
      jobs: enhancedJobs,
      total: enhancedJobs.length,
      searchParams,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LinkedIn job search error:', error);
    
    // Fallback to mock LinkedIn-style jobs
    const mockJobs = generateLinkedInMockJobs(req.body);
    
    res.json({
      success: true,
      jobs: mockJobs,
      total: mockJobs.length,
      searchParams: req.body,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// @route   GET /api/linkedin-jobs/trending
// @desc    Get trending jobs from LinkedIn
// @access  Private
router.get('/trending', authenticateToken, linkedinLimiter, async (req, res) => {
  try {
    const { location = 'United States', limit = 10 } = req.query;

    const trendingJobs = await linkedinService.getTrendingJobs(location, parseInt(limit));

    res.json({
      success: true,
      jobs: trendingJobs,
      location,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LinkedIn trending jobs error:', error);
    
    const mockTrendingJobs = generateTrendingMockJobs();
    
    res.json({
      success: true,
      jobs: mockTrendingJobs,
      location: req.query.location || 'United States',
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// @route   GET /api/linkedin-jobs/company/:companyId
// @desc    Get jobs from specific company on LinkedIn
// @access  Private
router.get('/company/:companyId', authenticateToken, linkedinLimiter, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 10 } = req.query;

    const companyJobs = await linkedinService.getCompanyJobs(companyId, parseInt(limit));

    res.json({
      success: true,
      jobs: companyJobs,
      companyId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LinkedIn company jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch company jobs from LinkedIn' });
  }
});

// @route   GET /api/linkedin-jobs/salary-insights
// @desc    Get salary insights for job titles
// @access  Private
router.get('/salary-insights', authenticateToken, linkedinLimiter, async (req, res) => {
  try {
    const { jobTitle, location } = req.query;

    if (!jobTitle) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const salaryInsights = await linkedinService.getSalaryInsights(jobTitle, location);

    res.json({
      success: true,
      insights: salaryInsights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('LinkedIn salary insights error:', error);
    
    // Fallback to mock salary data
    const mockSalaryInsights = generateMockSalaryInsights(req.query.jobTitle, req.query.location);
    
    res.json({
      success: true,
      insights: mockSalaryInsights,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// @route   POST /api/linkedin-jobs/recommendations
// @desc    Get personalized job recommendations from LinkedIn
// @access  Private
router.post('/recommendations', authenticateToken, linkedinLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.body;

    // Get user profile
    let User = null;
    try {
      User = require('../models/User');
      const user = await User.findById(userId);
      
      const userProfile = {
        skills: user.skills || [],
        experience: user.experience || 'entry',
        location: user.location || '',
        currentRole: user.currentRole || ''
      };

      const recommendations = await linkedinService.getJobRecommendations(userProfile, parseInt(limit));

      res.json({
        success: true,
        recommendations,
        userProfile,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('User model error:', error);
      
      // Fallback without user data
      const mockRecommendations = generateMockRecommendations();
      
      res.json({
        success: true,
        recommendations: mockRecommendations,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

  } catch (error) {
    console.error('LinkedIn recommendations error:', error);
    res.status(500).json({ error: 'Failed to get LinkedIn job recommendations' });
  }
});

// Helper functions
function calculateRelevance(job, searchParams) {
  let relevanceScore = 0;
  
  // Check keyword matches in title and description
  if (searchParams.keywords) {
    const keywords = searchParams.keywords.toLowerCase().split(' ');
    const jobText = (job.title + ' ' + job.description).toLowerCase();
    
    keywords.forEach(keyword => {
      if (jobText.includes(keyword)) {
        relevanceScore += 20;
      }
    });
  }
  
  // Location match
  if (searchParams.location && job.location) {
    if (job.location.toLowerCase().includes(searchParams.location.toLowerCase())) {
      relevanceScore += 15;
    }
  }
  
  // Remote preference
  if (searchParams.remote && job.remote) {
    relevanceScore += 10;
  }
  
  // Experience level match
  if (searchParams.experienceLevel && job.experienceLevel === searchParams.experienceLevel) {
    relevanceScore += 15;
  }
  
  return Math.min(relevanceScore, 100);
}

function generateLinkedInMockJobs(searchParams) {
  const companies = ['LinkedIn', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Spotify'];
  const jobTitles = [
    'Senior Software Engineer',
    'Full Stack Developer',
    'Frontend Engineer',
    'Backend Developer',
    'DevOps Engineer',
    'Product Manager',
    'Data Scientist',
    'UX Designer'
  ];

  return Array.from({ length: Math.min(parseInt(searchParams.limit) || 20, 50) }, (_, index) => {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    
    return {
      id: `li_mock_${Date.now()}_${index}`,
      title: searchParams.keywords ? `${title} (${searchParams.keywords})` : title,
      company: { name: company },
      location: { name: searchParams.location || 'San Francisco, CA' },
      description: `Join ${company} as a ${title}. We're looking for talented individuals to help us build the future.`,
      requirements: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      salary: {
        min: 100000 + Math.floor(Math.random() * 50000),
        max: 150000 + Math.floor(Math.random() * 50000),
        currency: 'USD'
      },
      employmentStatus: 'full-time',
      postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      applicationUrl: `https://www.linkedin.com/jobs/view/${Math.floor(Math.random() * 1000000000)}/`,
      remote: searchParams.remote !== undefined ? searchParams.remote : Math.random() > 0.5,
      experienceLevel: searchParams.experienceLevel || ['entry', 'mid', 'senior'][Math.floor(Math.random() * 3)],
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
      source: 'LinkedIn',
      isExternal: true,
      matchScore: Math.floor(Math.random() * 30) + 70,
      applicants: Math.floor(Math.random() * 200) + 50,
      companyLogo: `https://logo.clearbit.com/${company.toLowerCase().replace(' ', '')}.com`
    };
  });
}

function generateTrendingMockJobs() {
  const trendingCompanies = ['OpenAI', 'Anthropic', 'Stripe', 'Figma', 'Notion', 'Discord'];
  const trendingRoles = [
    'AI Engineer',
    'Machine Learning Engineer',
    'Blockchain Developer',
    'Cloud Architect',
    'DevSecOps Engineer',
    'Product Designer'
  ];

  return trendingRoles.map((role, index) => ({
    id: `trending_${index}`,
    title: role,
    company: { name: trendingCompanies[index] },
    location: { name: 'Remote' },
    description: `Trending opportunity in ${role} at ${trendingCompanies[index]}`,
    salary: {
      min: 120000 + Math.floor(Math.random() * 30000),
      max: 180000 + Math.floor(Math.random() * 50000),
      currency: 'USD'
    },
    remote: true,
    trending: true,
    trendingReason: 'High growth sector',
    applicants: Math.floor(Math.random() * 100) + 200,
    postedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
  }));
}

function generateMockSalaryInsights(jobTitle, location) {
  const basesalary = 85000;
  const locationMultiplier = location?.toLowerCase().includes('san francisco') ? 1.4 : 
                           location?.toLowerCase().includes('new york') ? 1.3 :
                           location?.toLowerCase().includes('seattle') ? 1.2 : 1.0;
  
  const averageSalary = Math.floor(basesalary * locationMultiplier);
  
  return {
    jobTitle,
    location: location || 'United States',
    averageSalary,
    salaryRange: {
      min: Math.floor(averageSalary * 0.7),
      max: Math.floor(averageSalary * 1.4)
    },
    currency: 'USD',
    dataPoints: Math.floor(Math.random() * 500) + 100,
    lastUpdated: new Date().toISOString(),
    percentiles: {
      p25: Math.floor(averageSalary * 0.8),
      p50: averageSalary,
      p75: Math.floor(averageSalary * 1.2),
      p90: Math.floor(averageSalary * 1.35)
    }
  };
}

function generateMockRecommendations() {
  return [
    {
      id: 'rec_1',
      title: 'Senior React Developer',
      company: 'TechCorp',
      location: 'Remote',
      matchScore: 92,
      reason: 'Strong match for your React and JavaScript skills',
      salary: '$110,000 - $140,000',
      remote: true
    },
    {
      id: 'rec_2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'San Francisco, CA',
      matchScore: 88,
      reason: 'Perfect fit for your full-stack experience',
      salary: '$120,000 - $160,000',
      remote: false
    }
  ];
}

module.exports = router;