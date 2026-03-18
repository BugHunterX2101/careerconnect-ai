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

    res.json({
      success: true,
      jobs: [],
      total: 0,
      searchParams: req.body,
      timestamp: new Date().toISOString(),
      fallback: false
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

    res.json({
      success: true,
      jobs: [],
      location: req.query.location || 'United States',
      timestamp: new Date().toISOString(),
      fallback: false
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

    res.json({
      success: true,
      insights: {
        jobTitle: req.query.jobTitle,
        location: req.query.location || 'unknown',
        averageSalary: null,
        salaryRange: { min: null, max: null },
        demandLevel: null,
        topCompanies: [],
        dataPoints: 0,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      fallback: false
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

      res.json({
        success: true,
        recommendations: [],
        timestamp: new Date().toISOString(),
        fallback: false
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

module.exports = router;