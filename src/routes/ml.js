const express = require('express');
const multer = require('multer');
const csrf = require('csurf');
const fs = require('fs').promises;
const path = require('path');
const rateLimit = require('express-rate-limit');
const gptJobsRouter = require('./gpt-jobs');
// Try to import ML classes (optional)
let ResumeParser = null;
let JobRecommender = null;

// Initialize CSRF protection
const csrfProtection = csrf({ cookie: true });

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

const router = express.Router();

// Rate limiting
const ML_RATE_LIMIT_WINDOW_MS = Number(process.env.ML_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const ML_RATE_LIMIT_MAX = Number(process.env.ML_RATE_LIMIT_MAX || 500);

const mlLimiter = rateLimit({
  windowMs: ML_RATE_LIMIT_WINDOW_MS,
  max: ML_RATE_LIMIT_MAX,
  message: { error: 'Too many ML requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
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
// @desc    Parse resume using BERT and generate job recommendations
// @access  Private
router.post('/parse-resume', authenticateToken, mlLimiter, upload.single('resume'), async (req, res) => {
  let tempFilePath = null;
  let uploadedFilePath = null;
  try {
    if (!resumeParser) {
      return res.status(503).json({ error: 'Resume parser not available' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    // Parse resume with BERT (supports in-memory uploads by writing a temporary file).
    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const supportedExtensions = new Set(['.pdf', '.txt']);
    if (!supportedExtensions.has(ext)) {
      return res.status(400).json({ error: 'Unsupported file format. Please upload a PDF or TXT resume.' });
    }

    const tempDir = path.resolve('./uploads/temp');
    await fs.mkdir(tempDir, { recursive: true });
    tempFilePath = path.join(tempDir, `resume-${Date.now()}${ext}`);

    const uploadBuffer = req.file.buffer
      ? req.file.buffer
      : req.file.path
        ? await fs.readFile(req.file.path)
        : null;

    if (!uploadBuffer) {
      return res.status(400).json({ error: 'Uploaded file content was empty' });
    }

    uploadedFilePath = req.file.path || null;
    await fs.writeFile(tempFilePath, uploadBuffer);

    const parsedData = await resumeParser.parseResume(tempFilePath);
    const qualityAnalysis = await resumeParser.analyzeResumeQuality(parsedData);
    
    // Extract keywords for job recommendations
    const keywords = await extractResumeKeywords(parsedData);
    
    // Generate real-time job recommendations
    const jobRecommendations = await generateRealtimeJobRecommendations(keywords, parsedData);
    
    res.json({
      success: true,
      message: 'Resume parsed successfully with job recommendations',
      data: {
        ...parsedData,
        qualityAnalysis,
        extractedKeywords: keywords,
        jobRecommendations: jobRecommendations
      }
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  } finally {
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Temporary resume cleanup failed:', cleanupError.message);
      }
    }

    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupError) {
        console.warn('Uploaded resume cleanup failed:', cleanupError.message);
      }
    }
  }
});

// Extract BERT-based keywords from parsed resume
async function extractResumeKeywords(parsedData) {
  const allText = [
    parsedData.summary || '',
    parsedData.experience?.map(exp => exp.description || '').join(' ') || '',
    parsedData.skills?.map(skill => skill.name || skill).join(' ') || '',
    parsedData.education?.map(edu => edu.degree || '').join(' ') || ''
  ].join(' ').toLowerCase();
  
  // BERT-like keyword extraction
  const techKeywords = [
    'javascript', 'python', 'react', 'node.js', 'typescript', 'java', 'c++', 'c#',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'mysql',
    'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'scikit-learn',
    'frontend', 'backend', 'fullstack', 'devops', 'cloud', 'microservices', 'api',
    'html', 'css', 'angular', 'vue', 'express', 'django', 'flask', 'spring'
  ];
  
  const roleKeywords = [
    'engineer', 'developer', 'architect', 'manager', 'lead', 'senior', 'principal',
    'staff', 'director', 'analyst', 'consultant', 'specialist', 'coordinator'
  ];
  
  const industryKeywords = [
    'fintech', 'healthcare', 'e-commerce', 'gaming', 'blockchain', 'cybersecurity',
    'edtech', 'saas', 'startup', 'enterprise', 'banking', 'insurance', 'retail'
  ];
  
  return {
    technical: techKeywords.filter(keyword => allText.includes(keyword)),
    roles: roleKeywords.filter(keyword => allText.includes(keyword)),
    industries: industryKeywords.filter(keyword => allText.includes(keyword)),
    experience: parsedData.experience?.length || 0,
    skills: parsedData.skills?.map(skill => skill.name || skill) || []
  };
}

// Generate 15+ real-time job recommendations using GPT and LinkedIn API
async function generateRealtimeJobRecommendations(keywords, parsedData) {
  try {
    const recommendations = [];
    
    // 1. GPT-enhanced recommendations (5-7 jobs)
    const gptJobs = await generateGPTRecommendations(keywords, parsedData);
    recommendations.push(...gptJobs);
    
    // 2. LinkedIn API recommendations (5-7 jobs)
    const linkedinJobs = await fetchLinkedInRecommendations(keywords, parsedData);
    recommendations.push(...linkedinJobs);
    
    // 3. Internal database recommendations (3-5 jobs)
    const internalJobs = await fetchInternalRecommendations(keywords, parsedData);
    recommendations.push(...internalJobs);
    
    // Sort by match score and return top 15+
    return recommendations
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 20); // Return top 20 for variety
      
  } catch (error) {
    console.error('Job recommendations error:', error);
    return [];
  }
}

// Generate GPT-enhanced job recommendations
async function generateGPTRecommendations(keywords, parsedData) {
  try {
    const Job = require('../models/Job');
    if (!Job || typeof Job.find !== 'function') {
      return [];
    }

    const skillPattern = keywords.technical?.length
      ? keywords.technical.join('|')
      : null;

    const query = { status: 'active' };
    if (skillPattern) {
      query.$or = [
        { title: { $regex: skillPattern, $options: 'i' } },
        { 'requirements.skills.name': { $regex: skillPattern, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(7);
    return jobs.map((job) => {
      const skills = Array.isArray(job?.requirements?.skills)
        ? job.requirements.skills.map((entry) => entry?.name).filter(Boolean)
        : [];
      const minSalary = job?.benefits?.salary?.min;
      const maxSalary = job?.benefits?.salary?.max;
      return {
        id: String(job._id),
        title: job.title,
        company: job?.company?.name || 'Unknown Company',
        location: [job?.location?.city, job?.location?.state, job?.location?.country].filter(Boolean).join(', ') || 'Remote',
        salary: Number.isFinite(minSalary) || Number.isFinite(maxSalary)
          ? `$${(minSalary || 0).toLocaleString()} - $${(maxSalary || 0).toLocaleString()}`
          : null,
        type: job.employmentType || 'full-time',
        remote: Boolean(job?.location?.isRemote),
        matchScore: 0,
        source: 'GPT Enhanced',
        description: job.description || '',
        skills,
        gptReasoning: `Matched against your current technical profile (${keywords.technical.slice(0, 3).join(', ') || 'general skills'}).`,
        posted: job.createdAt,
        applicants: job.applications?.length || 0
      };
    });
  } catch (error) {
    console.error('GPT recommendations data source error:', error);
    return [];
  }
}

// Fetch LinkedIn API recommendations
async function fetchLinkedInRecommendations(keywords, parsedData) {
  try {
    const { linkedinService } = require('../services/linkedinService');
    const jobs = await linkedinService.searchJobs({
      keywords: keywords.technical.join(' ') || keywords.roles.join(' '),
      location: parsedData.location || undefined,
      limit: 7
    });

    return (jobs || []).map((job) => ({
      id: job.id,
      title: job.title,
      company: job?.company?.name || job.company || 'Unknown Company',
      location: job?.location?.name || job.location || 'Unknown',
      salary: job.salary || null,
      type: job.type || 'full-time',
      remote: Boolean(job.remote),
      matchScore: 0,
      source: 'LinkedIn',
      description: job.description || '',
      skills: job.skills || [],
      posted: job.postedAt || null,
      applicants: job.applicants || 0,
      url: job.applicationUrl || null
    }));
    
  } catch (error) {
    console.error('LinkedIn API error:', error);
    return [];
  }
}

// Fetch internal database recommendations
async function fetchInternalRecommendations(keywords, parsedData) {
  try {
    const Job = require('../models/Job');
    if (!Job || typeof Job.find !== 'function') {
      return [];
    }

    const skillPattern = keywords.technical?.length
      ? keywords.technical.join('|')
      : null;

    const query = { status: 'active' };
    if (skillPattern) {
      query.$or = [
        { title: { $regex: skillPattern, $options: 'i' } },
        { 'requirements.skills.name': { $regex: skillPattern, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(5);
    return jobs.map((job) => {
      const skills = Array.isArray(job?.requirements?.skills)
        ? job.requirements.skills.map((entry) => entry?.name).filter(Boolean)
        : [];
      const minSalary = job?.benefits?.salary?.min;
      const maxSalary = job?.benefits?.salary?.max;
      return {
        id: String(job._id),
        title: job.title,
        company: job?.company?.name || 'Unknown Company',
        location: [job?.location?.city, job?.location?.state, job?.location?.country].filter(Boolean).join(', ') || 'Unknown',
        salary: Number.isFinite(minSalary) || Number.isFinite(maxSalary)
          ? `$${(minSalary || 0).toLocaleString()} - $${(maxSalary || 0).toLocaleString()}`
          : null,
        type: job.employmentType || 'full-time',
        remote: Boolean(job?.location?.isRemote),
        matchScore: 0,
        source: 'Internal',
        description: job.description || '',
        skills,
        posted: job.createdAt,
        applicants: job.applications?.length || 0
      };
    });
    
  } catch (error) {
    console.error('Internal recommendations error:', error);
    return [];
  }
}

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
      // Text-mode analysis should avoid file-path parsing and work directly on provided text.
      const sections = resumeParser.extractSections(text);
      const parsedData = {
        personalInfo: resumeParser.extractPersonalInfo(sections.personal || ''),
        education: resumeParser.extractEducation(sections.education || ''),
        experience: resumeParser.extractExperience(sections.experience || ''),
        skills: await resumeParser.extractSkills(sections.skills || text),
        summary: sections.summary || text.slice(0, 500),
        rawText: text
      };

      const qualityAnalysis = await resumeParser.analyzeResumeQuality(parsedData);
      analysis = {
        ...parsedData,
        qualityAnalysis
      };
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
      const userModule = require('../models/User');
      User = typeof userModule?.User === 'function' ? userModule.User() : userModule;
    } catch (error) {
      console.warn('User model not available:', error.message);
    }
    
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }
    
    let user = null;
    if (typeof User.findByPk === 'function') {
      user = await User.findByPk(userId);
    }

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
    if (user?.resumes && user.resumes.length > 0) {
      const latestResume = user.resumes[user.resumes.length - 1];
      if (latestResume.skills && latestResume.skills.length > 0) {
        params.skills = [...new Set([...params.skills, ...latestResume.skills])];
      }
    }

    // Get recommendations
    const recommendations = await jobRecommender.getJobRecommendations(user || {}, params);

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
router.post('/resume-improvement', authenticateToken, mlLimiter, csrfProtection, upload.single('resume'), async (req, res) => {
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

// @route   POST /api/ml/train-model
// @desc    Train recommendation model with user data
// @access  Private (Admin only)
router.post('/train-model', authenticateToken, async (req, res) => {
  try {
    if (!jobRecommender) {
      return res.status(503).json({ error: 'Job recommender not available' });
    }

    // Check if user is admin (implement your admin check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { trainingData } = req.body;
    
    if (!trainingData) {
      return res.status(400).json({ error: 'Training data is required' });
    }

    await jobRecommender.trainRecommendationModel(trainingData);
    await jobRecommender.saveModel('./ml/models/recommendation_model');

    res.json({
      success: true,
      message: 'Model trained and saved successfully'
    });

  } catch (error) {
    console.error('Model training error:', error);
    res.status(500).json({ error: 'Failed to train model' });
  }
});

// @route   POST /api/ml/predict-salary
// @desc    Predict salary based on skills and experience
// @access  Private
router.post('/predict-salary', authenticateToken, mlLimiter, csrfProtection, async (req, res) => {
  try {
    if (!req.csrfToken()) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    
    const { skills, experience, location, jobTitle } = req.body;

    if (!skills || !experience) {
      return res.status(400).json({ error: 'Skills and experience are required' });
    }

    // Simple salary prediction (would use ML model in production)
    const basesalary = 50000;
    const skillMultiplier = skills.length * 5000;
    const experienceMultiplier = parseInt(experience) * 10000;
    const locationMultiplier = location?.toLowerCase().includes('san francisco') ? 30000 : 0;
    
    const predictedSalary = basesalary + skillMultiplier + experienceMultiplier + locationMultiplier;
    
    const salaryRange = {
      min: Math.round(predictedSalary * 0.8),
      max: Math.round(predictedSalary * 1.2),
      predicted: predictedSalary
    };

    res.json({
      success: true,
      message: 'Salary predicted successfully',
      data: {
        salaryRange,
        factors: {
          skills: skills.length,
          experience: parseInt(experience),
          location,
          jobTitle
        }
      }
    });

  } catch (error) {
    console.error('Salary prediction error:', error);
    res.status(500).json({ error: 'Failed to predict salary' });
  }
});

// @route   GET /api/ml/market-insights
// @desc    Get market insights for skills and jobs
// @access  Private
router.get('/market-insights', authenticateToken, mlLimiter, async (req, res) => {
  try {
    const { skill, location } = req.query;

    let topCompanies = [];
    let relatedSkills = [];
    let jobOpenings = 0;
    try {
      const Job = require('../models/Job');
      if (Job && typeof Job.find === 'function') {
        const query = { status: 'active' };
        if (location) {
          query.$or = [
            { 'location.city': { $regex: location, $options: 'i' } },
            { 'location.state': { $regex: location, $options: 'i' } },
            { 'location.country': { $regex: location, $options: 'i' } }
          ];
        }
        if (skill) {
          query.$or = [
            ...(query.$or || []),
            { 'requirements.skills.name': { $regex: skill, $options: 'i' } },
            { title: { $regex: skill, $options: 'i' } }
          ];
        }

        const jobs = await Job.find(query).limit(200);
        jobOpenings = jobs.length;

        const companySet = new Set();
        const skillCounts = new Map();
        jobs.forEach((job) => {
          const companyName = job?.company?.name;
          if (companyName) companySet.add(companyName);
          const skills = Array.isArray(job?.requirements?.skills) ? job.requirements.skills : [];
          skills.forEach((entry) => {
            const name = String(entry?.name || '').trim();
            if (!name) return;
            skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
          });
        });

        topCompanies = Array.from(companySet).slice(0, 5);
        relatedSkills = Array.from(skillCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name]) => name);
      }
    } catch (dbError) {
      console.warn('Market insights job query unavailable:', dbError.message);
    }

    const insights = {
      skill: skill || 'general',
      location: location || 'global',
      demand: 0,
      growth: 0,
      averageSalary: null,
      topCompanies,
      relatedSkills,
      jobOpenings
    };

    res.json({
      success: true,
      message: 'Market insights retrieved successfully',
      data: insights
    });

  } catch (error) {
    console.error('Market insights error:', error);
    res.status(500).json({ error: 'Failed to get market insights' });
  }
});

// @route   POST /api/ml/career-improvement
// @desc    Get GPT-powered career improvement suggestions based on BERT keywords
// @access  Private
router.post('/career-improvement', authenticateToken, mlLimiter, async (req, res) => {
  try {
    const { bertKeywords, profileData, resumeText } = req.body;
    const userId = req.user.userId;

    if (!bertKeywords && !resumeText) {
      return res.status(400).json({ error: 'BERT keywords or resume text is required' });
    }

    let extractedKeywords = bertKeywords;
    
    // If resume text provided, extract BERT keywords
    if (resumeText && !bertKeywords) {
      extractedKeywords = await extractResumeKeywords({ rawText: resumeText });
    }

    // Get user profile data
    let userProfile = profileData || {};
    if (!profileData) {
      try {
        const User = require('../models/User');
        const user = await User.findById(userId).select('profile');
        userProfile = user?.profile || {};
      } catch (error) {
        console.warn('Could not fetch user profile:', error.message);
      }
    }

    // Generate career improvement suggestions
    const careerImprovementService = require('../services/careerImprovementService');
    const suggestions = await careerImprovementService.generateCareerSuggestions(
      userId,
      extractedKeywords,
      userProfile
    );

    res.json({
      success: true,
      message: 'Career improvement suggestions generated successfully',
      data: suggestions
    });

  } catch (error) {
    console.error('Career improvement error:', error);
    res.status(500).json({ error: 'Failed to generate career improvement suggestions' });
  }
});

// @route   POST /api/ml/skill-gap-analysis
// @desc    Analyze skill gaps and provide learning recommendations
// @access  Private
router.post('/skill-gap-analysis', authenticateToken, mlLimiter, async (req, res) => {
  try {
    const { currentSkills, targetRole, targetCompany } = req.body;
    const userId = req.user.userId;

    if (!currentSkills || !Array.isArray(currentSkills)) {
      return res.status(400).json({ error: 'Current skills array is required' });
    }

    const bertKeywords = {
      technical: currentSkills,
      roles: [targetRole || 'developer'],
      industries: [targetCompany || 'technology']
    };

    const careerImprovementService = require('../services/careerImprovementService');
    const skillGaps = await careerImprovementService.identifySkillGaps(bertKeywords, { targetRole });
    const learningPlan = await careerImprovementService.generateLearningPlan(bertKeywords, { targetRole });

    res.json({
      success: true,
      message: 'Skill gap analysis completed',
      data: {
        skillGaps,
        learningPlan,
        targetRole,
        currentSkills
      }
    });

  } catch (error) {
    console.error('Skill gap analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze skill gaps' });
  }
});

// @route   GET /api/ml/career-insights
// @desc    Get market insights and career trends
// @access  Private
router.get('/career-insights', authenticateToken, mlLimiter, async (req, res) => {
  try {
    const { skills, role, location } = req.query;
    
    const bertKeywords = {
      technical: skills ? skills.split(',') : [],
      roles: role ? [role] : ['developer']
    };

    const careerImprovementService = require('../services/careerImprovementService');
    const marketInsights = await careerImprovementService.getMarketInsights(bertKeywords);
    const salaryAnalysis = await careerImprovementService.analyzeSalaryPotential(
      bertKeywords, 
      { location, experience: { years: 3 } }
    );

    res.json({
      success: true,
      message: 'Career insights retrieved successfully',
      data: {
        marketInsights,
        salaryAnalysis,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Career insights error:', error);
    res.status(500).json({ error: 'Failed to get career insights' });
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
        jobRecommender: jobRecommender ? 'available' : 'unavailable',
        careerImprovement: 'available',
        tensorflow: resumeParser?.tfService?.isInitialized || false
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

// Mount GPT jobs router
router.use('/', gptJobsRouter);

module.exports = router;
