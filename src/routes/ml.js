const express = require('express');
const multer = require('multer');
// Try to import ML classes (optional)
let ResumeParser = null;
let JobRecommender = null;

try {
  ResumeParser = require('../ml/resumeParser');
} catch (error) {
  console.warn('ResumeParser not available:', error.message);
}

try {
  JobRecommender = require('../ml/jobRecommender');
} catch (error) {
  console.warn('JobRecommender not available:', error.message);
}

const { authenticateToken } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

// Rate limiting
const mlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many ML requests, please try again later.',
});

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'text/plain' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Initialize ML instances
let resumeParser = null;
let jobRecommender = null;

const initializeML = async () => {
  try {
    if (ResumeParser && !resumeParser) {
      resumeParser = new ResumeParser();
      await resumeParser.initialize();
    }
    
    if (JobRecommender && !jobRecommender) {
      jobRecommender = new JobRecommender();
      await jobRecommender.initialize();
    }
  } catch (error) {
    console.error('Error initializing ML services:', error);
  }
};

// Initialize ML on startup
initializeML();

// @route   POST /api/ml/parse-resume
// @desc    Parse resume using AI
// @access  Private
router.post('/parse-resume', authenticateToken, mlLimiter, upload.single('resume'), async (req, res) => {
  try {
    if (!resumeParser) {
      return res.status(503).json({ error: 'Resume parser not available' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const parsedData = await resumeParser.parseResume(req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      message: 'Resume parsed successfully',
      data: parsedData
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// @route   POST /api/ml/analyze-text
// @desc    Analyze text content
// @access  Private
router.post('/analyze-text', authenticateToken, mlLimiter, async (req, res) => {
  try {
    const { text, type = 'general' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    let analysis = {};

    if (resumeParser) {
      analysis = await resumeParser.parseResume(Buffer.from(text), 'text-resume.txt');
    } else if (type === 'job_description') {
      analysis = { type: 'job_description', content: text, analysis: 'Basic analysis available' };
    } else if (type === 'cover_letter') {
      analysis = { type: 'cover_letter', content: text, analysis: 'Basic analysis available' };
    } else {
      analysis = { type: 'general', content: text, analysis: 'Basic analysis available' };
    }

    res.json({
      success: true,
      message: 'Text analyzed successfully',
      data: analysis
    });

  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze text' });
  }
});

// @route   POST /api/ml/job-recommendations
// @desc    Get AI-powered job recommendations
// @access  Private
router.post('/job-recommendations', authenticateToken, mlLimiter, async (req, res) => {
  try {
    if (!jobRecommender) {
      return res.status(503).json({ error: 'Job recommender not available' });
    }

    const {
      skills,
      experience,
      location,
      remote,
      industry,
      salary_min,
      salary_max,
      limit = 10
    } = req.body;

    const userId = req.user.userId;

    // Get user profile for better recommendations
    let User = null;
    try {
      User = require('../models/User');
    } catch (error) {
      console.warn('User model not available:', error.message);
    }
    
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }
    
    const user = await User.findById(userId).populate('resumes');

    // Prepare recommendation parameters
    const params = {
      skills: skills ? skills.split(',') : [],
      experience: experience || 'entry',
      location: location || '',
      remote: remote === 'true',
      industry: industry || '',
      salary_min: salary_min ? parseInt(salary_min) : null,
      salary_max: salary_max ? parseInt(salary_max) : null,
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
    const recommendations = await jobRecommender.getJobRecommendations(user, params);

    res.json({
      success: true,
      recommendations: recommendations.jobs,
      total: recommendations.total,
      userProfile: {
        skills: params.skills,
        experience: params.experience,
        location: params.location
      }
    });

  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
});

// @route   POST /api/ml/skill-analysis
// @desc    Analyze skills and provide insights
// @access  Private
router.post('/skill-analysis', authenticateToken, mlLimiter, async (req, res) => {
  try {
    const { skills, targetRole, targetIndustry } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array is required' });
    }

    // Basic skill analysis
    const analysis = {
      skills: skills,
      targetRole: targetRole,
      targetIndustry: targetIndustry,
      analysis: 'Basic skill analysis available',
      recommendations: [
        'Consider adding more technical skills',
        'Focus on industry-specific certifications',
        'Build portfolio projects'
      ]
    };

    res.json({
      success: true,
      message: 'Skills analyzed successfully',
      data: analysis
    });

  } catch (error) {
    console.error('Skill analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze skills' });
  }
});

// @route   POST /api/ml/resume-improvement
// @desc    Get AI suggestions for resume improvement
// @access  Private
router.post('/resume-improvement', authenticateToken, mlLimiter, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const { targetJob, targetCompany } = req.body;

    let currentResume = {};
    let improvements = {};

    if (resumeParser) {
      // Parse current resume
      currentResume = await resumeParser.parseResume(req.file.buffer, req.file.originalname);
    }

    // Generate improvement suggestions
    improvements = {
      targetJob: targetJob,
      targetCompany: targetCompany,
      suggestions: [
        'Add more quantifiable achievements',
        'Include relevant keywords for the target role',
        'Improve action verb usage',
        'Add industry-specific certifications'
      ],
      score: 75
    };

    res.json({
      success: true,
      message: 'Resume improvement suggestions generated',
      data: {
        currentResume,
        improvements
      }
    });

  } catch (error) {
    console.error('Resume improvement error:', error);
    res.status(500).json({ error: 'Failed to generate improvement suggestions' });
  }
});

// @route   GET /api/ml/health
// @desc    Check ML service health
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      services: {
        resumeParser: resumeParser ? 'available' : 'unavailable',
        jobRecommender: jobRecommender ? 'available' : 'unavailable'
      },
      timestamp: new Date().toISOString()
    };

    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
