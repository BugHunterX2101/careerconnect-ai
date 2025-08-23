const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { parseResume } = require('../ml/resumeParser');
const { getJobRecommendations, analyzeSkills } = require('../ml/jobRecommender');
const { authenticateToken } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');
const logger = require('../middleware/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'), false);
    }
  }
});

// Rate limiting
const mlProcessingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many ML processing requests, please try again later.',
});

// Validation middleware
const validateResumeUpload = [
  body('title').optional().trim().isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

// @route   POST /api/ml/parse-resume
// @desc    Parse resume using AI
// @access  Private
router.post('/parse-resume', authenticateToken, mlProcessingLimiter, upload.single('resume'), validateResumeUpload, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const { title, description } = req.body;
    const userId = req.user.userId;

    // Parse resume using AI
    const parsedData = await parseResume(req.file.buffer, req.file.originalname);

    // Add metadata
    const resumeData = {
      ...parsedData,
      title: title || parsedData.title || 'Untitled Resume',
      description: description || '',
      uploadedBy: userId,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    // Emit progress update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('resume:processing', {
        status: 'completed',
        data: resumeData
      });
    }

    res.json({
      message: 'Resume parsed successfully',
      data: resumeData
    });

  } catch (error) {
    logger.error('Resume parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// @route   POST /api/ml/analyze-text
// @desc    Analyze text content for skills and keywords
// @access  Private
router.post('/analyze-text', authenticateToken, mlProcessingLimiter, async (req, res) => {
  try {
    const { text, type = 'general' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    // Analyze text based on type
    let analysis;
    switch (type) {
      case 'resume':
        analysis = await parseResume(Buffer.from(text), 'text-resume.txt');
        break;
      case 'job_description':
        analysis = await analyzeSkills(text, 'job_description');
        break;
      case 'cover_letter':
        analysis = await analyzeSkills(text, 'cover_letter');
        break;
      default:
        analysis = await analyzeSkills(text, 'general');
    }

    res.json({
      message: 'Text analyzed successfully',
      analysis
    });

  } catch (error) {
    logger.error('Text analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// @route   GET /api/ml/job-recommendations
// @desc    Get AI-powered job recommendations
// @access  Private
router.get('/job-recommendations', authenticateToken, async (req, res) => {
  try {
    const { 
      skills, experience, location, remote, 
      industry, salary_min, salary_max, limit = 10 
    } = req.query;

    const userId = req.user.userId;

    // Get user profile for better recommendations
    const User = require('../models/User');
    const user = await User.findById(userId).populate('resumes');

    // Prepare recommendation parameters
    const params = {
      skills: skills ? skills.split(',') : [],
      experience: experience || 'entry',
      location: location || '',
      remote: remote === 'true',
      industry: industry || '',
      salaryRange: {
        min: salary_min ? parseInt(salary_min) : null,
        max: salary_max ? parseInt(salary_max) : null
      },
      limit: parseInt(limit)
    };

    // If user has resumes, use their skills
    if (user.resumes && user.resumes.length > 0) {
      const latestResume = user.resumes[user.resumes.length - 1];
      if (latestResume.skills && latestResume.skills.length > 0) {
        params.skills = [...new Set([...params.skills, ...latestResume.skills])];
      }
    }

    // Get recommendations
    const recommendations = await getJobRecommendations(user, params);

    res.json({
      recommendations: recommendations.jobs,
      total: recommendations.total,
      userProfile: {
        skills: params.skills,
        experience: params.experience,
        location: params.location
      }
    });

  } catch (error) {
    logger.error('Job recommendations error:', error);
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
});

// @route   POST /api/ml/skill-analysis
// @desc    Analyze skills and provide insights
// @access  Private
router.post('/skill-analysis', authenticateToken, async (req, res) => {
  try {
    const { skills, targetRole, targetIndustry } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    // Analyze skills
    const analysis = await analyzeSkills(skills, {
      targetRole,
      targetIndustry,
      includeMarketData: true
    });

    res.json({
      message: 'Skills analyzed successfully',
      analysis
    });

  } catch (error) {
    logger.error('Skill analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze skills' });
  }
});

// @route   POST /api/ml/resume-improvement
// @desc    Get AI suggestions for resume improvement
// @access  Private
router.post('/resume-improvement', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const { targetJob, targetCompany } = req.body;

    // Parse current resume
    const currentResume = await parseResume(req.file.buffer, req.file.originalname);

    // Generate improvement suggestions
    const improvements = await generateResumeImprovements(currentResume, {
      targetJob,
      targetCompany
    });

    res.json({
      message: 'Resume improvement suggestions generated',
      currentResume,
      improvements
    });

  } catch (error) {
    logger.error('Resume improvement error:', error);
    res.status(500).json({ error: 'Failed to generate improvement suggestions' });
  }
});

// @route   POST /api/ml/salary-prediction
// @desc    Predict salary based on skills and experience
// @access  Private
router.post('/salary-prediction', authenticateToken, async (req, res) => {
  try {
    const { 
      skills, experience, location, industry, 
      education, certifications, companySize 
    } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    // Predict salary
    const prediction = await predictSalary({
      skills,
      experience: experience || 'entry',
      location: location || 'remote',
      industry: industry || 'technology',
      education: education || 'bachelor',
      certifications: certifications || [],
      companySize: companySize || 'medium'
    });

    res.json({
      message: 'Salary prediction generated',
      prediction
    });

  } catch (error) {
    logger.error('Salary prediction error:', error);
    res.status(500).json({ error: 'Failed to predict salary' });
  }
});

// @route   GET /api/ml/market-insights
// @desc    Get market insights for skills and roles
// @access  Private
router.get('/market-insights', authenticateToken, async (req, res) => {
  try {
    const { skills, location, industry } = req.query;

    const skillsArray = skills ? skills.split(',') : [];
    const locationParam = location || 'global';
    const industryParam = industry || 'technology';

    // Get market insights
    const insights = await getMarketInsights({
      skills: skillsArray,
      location: locationParam,
      industry: industryParam
    });

    res.json({
      message: 'Market insights retrieved',
      insights
    });

  } catch (error) {
    logger.error('Market insights error:', error);
    res.status(500).json({ error: 'Failed to get market insights' });
  }
});

// @route   POST /api/ml/career-path-suggestions
// @desc    Get AI-powered career path suggestions
// @access  Private
router.post('/career-path-suggestions', authenticateToken, async (req, res) => {
  try {
    const { 
      currentRole, currentSkills, experience, 
      interests, goals, timeline 
    } = req.body;

    if (!currentRole || !currentSkills || !Array.isArray(currentSkills)) {
      return res.status(400).json({ error: 'Current role and skills are required' });
    }

    // Generate career path suggestions
    const suggestions = await generateCareerPathSuggestions({
      currentRole,
      currentSkills,
      experience: experience || 'entry',
      interests: interests || [],
      goals: goals || 'advancement',
      timeline: timeline || '2-5 years'
    });

    res.json({
      message: 'Career path suggestions generated',
      suggestions
    });

  } catch (error) {
    logger.error('Career path suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate career path suggestions' });
  }
});

// Helper functions (these would be implemented in the ML modules)
async function generateResumeImprovements(resume, options) {
  // This would use the ML model to generate improvement suggestions
  return {
    suggestions: [
      {
        type: 'skill_addition',
        priority: 'high',
        description: 'Add more technical skills relevant to the target role',
        examples: ['Python', 'Machine Learning', 'Data Analysis']
      },
      {
        type: 'experience_enhancement',
        priority: 'medium',
        description: 'Quantify achievements with specific metrics',
        examples: ['Increased efficiency by 25%', 'Managed team of 10 developers']
      },
      {
        type: 'formatting',
        priority: 'low',
        description: 'Improve readability with better formatting',
        examples: ['Use bullet points', 'Add section headers']
      }
    ],
    score: {
      current: 75,
      potential: 90,
      improvements: ['skills', 'quantification', 'formatting']
    }
  };
}

async function predictSalary(params) {
  // This would use ML model to predict salary
  const baseSalary = 75000;
  const skillMultiplier = params.skills.length * 0.05;
  const experienceMultiplier = {
    'entry': 1.0,
    'mid': 1.3,
    'senior': 1.6,
    'lead': 2.0
  }[params.experience] || 1.0;

  const predictedSalary = baseSalary * (1 + skillMultiplier) * experienceMultiplier;

  return {
    predicted: Math.round(predictedSalary),
    range: {
      min: Math.round(predictedSalary * 0.8),
      max: Math.round(predictedSalary * 1.2)
    },
    factors: {
      skills: params.skills.length,
      experience: params.experience,
      location: params.location,
      industry: params.industry
    },
    confidence: 0.85
  };
}

async function getMarketInsights(params) {
  // This would fetch market data and analyze trends
  return {
    demand: {
      overall: 'high',
      trend: 'increasing',
      growthRate: 15
    },
    skills: params.skills.map(skill => ({
      name: skill,
      demand: 'high',
      salary: 85000,
      growth: 12
    })),
    location: {
      name: params.location,
      averageSalary: 82000,
      jobCount: 1500,
      growth: 8
    },
    industry: {
      name: params.industry,
      trend: 'growing',
      opportunities: 'abundant'
    }
  };
}

async function generateCareerPathSuggestions(params) {
  // This would use ML to suggest career paths
  return {
    paths: [
      {
        title: 'Technical Leadership',
        description: 'Progress to technical lead or engineering manager',
        timeline: '3-5 years',
        skills: ['Leadership', 'System Design', 'Project Management'],
        probability: 0.8
      },
      {
        title: 'Specialization',
        description: 'Deep dive into specific technology area',
        timeline: '2-3 years',
        skills: ['Deep Learning', 'Cloud Architecture', 'DevOps'],
        probability: 0.9
      },
      {
        title: 'Product Management',
        description: 'Transition to product management role',
        timeline: '4-6 years',
        skills: ['Product Strategy', 'User Research', 'Business Analysis'],
        probability: 0.6
      }
    ],
    recommendations: [
      'Focus on leadership skills',
      'Build domain expertise',
      'Network with industry professionals'
    ]
  };
}

module.exports = router;
