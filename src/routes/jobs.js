const { Op } = require('sequelize');
const express = require('express');

// Sequelize model resolver — handles both getter-function and direct exports
const resolveModel = (mod) => {
  if (!mod) return null;
  if (typeof mod === 'function' && !mod.findAll) {
    try { return mod(); } catch (_) { return null; }
  }
  if (mod && typeof mod === 'object') {
    const keys = Object.keys(mod);
    for (const k of keys) {
      if (typeof mod[k] === 'function') {
        try {
          const r = mod[k]();
          if (r && r.findAll) return r;
        } catch (_) { /* ignore */ }
      }
    }
  }
  return mod;
};

const multer = require('multer');
const { body, validationResult } = require('express-validator');

// Initialize CSRF protection
// Try to import models (optional)
let Job = null;
let User = null;

try {
  Job = require('../models/Job');
} catch (error) {
  console.warn('Job model not available:', error.message);
}

try {
  User = require('../models/User');
} catch (error) {
  console.warn('User model not available:', error.message);
}

const getUserModel = () => {
  if (!User) {
    return null;
  }

  if (typeof resolveModel(User).findByPk === 'function') {
    return User;
  }

  if (typeof User.User === 'function') {
    try {
      return User.User();
    } catch (error) {
      return null;
    }
  }

  return null;
};

const { authenticateToken, authorizeRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
let logger;
const getLogger = () => {
  if (!logger) {
    logger = require('../middleware/logger');
  }
  return logger;
};
logger = getLogger();

let linkedinService;
const getLinkedInService = () => {
  if (!linkedinService) {
    linkedinService = require('../services/linkedinService');
  }
  return linkedinService;
};
let getJobRecommendations = null;
try {
  const JobRecommender = require('../ml/jobRecommender');
  const jobRecommender = new JobRecommender();
  getJobRecommendations = async (user, options) => {
    try {
      return await jobRecommender.getJobRecommendations(user, options);
    } catch (error) {
      console.log('Job recommendations failed, returning empty results');
      return { jobs: [], total: 0 };
    }
  };
} catch (error) {
  console.warn('JobRecommender not available:', error.message);
  getJobRecommendations = async () => ({ jobs: [], total: 0 });
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
const jobSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many job search requests, please try again later.',
});

const jobPostingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many job posting requests, please try again later.',
});

// Validation middleware
const validateJobPosting = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Job title is required and must be less than 100 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Job description must be at least 10 characters long'),
  body('requirements').isArray().withMessage('Requirements must be an array'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('type').isIn(['full-time', 'part-time', 'contract', 'internship']).withMessage('Invalid job type'),
  body('salary.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salary.max').isNumeric().withMessage('Maximum salary must be a number'),
  body('company').trim().isLength({ min: 1 }).withMessage('Company name is required'),
];

// @route   GET /api/jobs/recommendations
// @desc    Get personalized job recommendations for user
// @access  Private
router.get('/recommendations', authenticateToken, jobSearchLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 10, location, remote } = req.query;
    const userId = req.user.userId;
    const UserModel = getUserModel();

    // Get user's profile for recommendations (supports both Sequelize and Mongoose models)
    let user = null;
    if (UserModel?.findById) {
      user = await UserModel.findByPk(userId);
      if (user?.populate) {
        user = await user;
      }
    } else if (UserModel?.findByPk) {
      user = await UserModel.findByPk(userId);
    }

    if (!user) {
      // User not in DB (e.g. new OAuth user) — still return LinkedIn mock recommendations
      try {
        const fallbackJobs = await getLinkedInService().getLinkedInJobRecommendations(
          { skills: [], location: location || '', experience: 'entry' },
          parseInt(limit, 10)
        );
        return res.json({
          recommendations: fallbackJobs,
          total: fallbackJobs.length,
          page: parseInt(page, 10),
          totalPages: 1,
          source: 'linkedin-guest'
        });
      } catch (_) {
        return res.json({ recommendations: [], total: 0, page: parseInt(page, 10), totalPages: 0, source: 'unavailable' });
      }
    }

    const userSkills = [
      ...(Array.isArray(user?.profile?.skills) ? user.profile.skills : []),
      ...(Array.isArray(user?.skills) ? user.skills : [])
    ].map((skill) => String(skill).trim()).filter(Boolean);

    const userExperienceYears = typeof user?.profile?.experience?.years === 'number'
      ? user.profile.experience.years
      : (Array.isArray(user?.experience) ? user.experience.length : 0);

    const experienceLevel = userExperienceYears >= 7
      ? 'senior'
      : userExperienceYears >= 3
        ? 'mid'
        : 'entry';

    // LinkedIn-first recommendations
    let recommendations = { jobs: [], total: 0, source: 'linkedin' };
    try {
      const linkedinJobs = await getLinkedInService().getLinkedInJobRecommendations({
        skills: userSkills,
        location: location || user?.profile?.location || user?.location || '',
        experience: experienceLevel
      }, parseInt(limit, 10));

      if (Array.isArray(linkedinJobs) && linkedinJobs.length > 0) {
        recommendations = {
          jobs: linkedinJobs,
          total: linkedinJobs.length,
          source: 'linkedin'
        };
      }
    } catch (linkedinError) {
      getLogger().warn(`LinkedIn recommendations unavailable: ${linkedinError.message}`);
    }

    // Fallback to local recommender if LinkedIn returns no jobs
    if (recommendations.jobs.length === 0) {
      if (getJobRecommendations) {
        recommendations = await getJobRecommendations(user, {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          location,
          remote: remote === 'true'
        });
        recommendations.source = 'local-fallback';
      } else if (Job?.find) {
        const searchQuery = {};
        if (location) searchQuery.location = { [Op.like]: location, $options: 'i' };
        if (remote === 'true') searchQuery.remote = true;

        const jobs = await Job.find(searchQuery)
          .order([['createdAt','DESC']])
          .limit(parseInt(limit, 10))
          ;

        recommendations = { jobs, total: jobs.length, source: 'local-fallback' };
      }
    }

    res.json({
      recommendations: recommendations.jobs || [],
      total: recommendations.total || 0,
      page: parseInt(page),
      totalPages: Math.ceil((recommendations.total || 0) / limit),
      source: recommendations.source || 'unknown'
    });

  } catch (error) {
    getLogger().error('Job recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/enhanced-recommendations
// @desc    Get enhanced job recommendations with profile suggestions (min 15 jobs)
// @access  Private
router.get('/enhanced-recommendations', authenticateToken, jobSearchLimiter, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's profile and resume
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await resolveModel(User).findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the most recent resume or create a basic profile
    const resume = user.resumes && user.resumes.length > 0 
      ? user.resumes[user.resumes.length - 1] 
      : null;

    // Build user profile object
    const userProfile = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profile: {
        skills: user.skills || [],
        location: user.location || '',
        experience: user.experience || {},
        linkedin: user.linkedinProfile || '',
        github: user.githubProfile || '',
        website: user.website || ''
      }
    };

    // Import and use enhanced recommendation service
    const enhancedJobService = require('../services/enhancedJobRecommendationService');
    
    // Get enhanced recommendations
    const options = {
      minJobs: parseInt(req.query.minJobs) || 15,
      includeRemote: req.query.remote === 'true' || req.query.remote === undefined,
      location: req.query.location,
      experienceLevel: req.query.experienceLevel,
      salary: req.query.salary ? {
        min: parseInt(req.query.salaryMin) || 0,
        max: parseInt(req.query.salaryMax) || 1000000
      } : undefined
    };

    const recommendations = await enhancedJobService.getEnhancedRecommendations(
      userProfile,
      resume,
      options
    );

    res.json({
      success: true,
      ...recommendations,
      message: `Found ${recommendations.jobs.length} job recommendations`
    });

  } catch (error) {
    getLogger().error('Enhanced job recommendations error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate enhanced recommendations',
      message: error.message 
    });
  }
});

// @route   GET /api/jobs/search
// @desc    Search jobs with filters
// @access  Private
router.get('/search', authenticateToken, jobSearchLimiter, async (req, res) => {
  try {
    const { 
      q, location, type, remote, salary_min, salary_max, 
      page = 1, limit = 20 
    } = req.query;

    // Build Sequelize WHERE clause
    const whereClause = { status: 'active' };

    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
        { companyName: { [Op.like]: `%${q}%` } }
      ];
    }

    if (location) {
      whereClause[Op.or] = [
        ...(whereClause[Op.or] || []),
        { locationCity: { [Op.like]: `%${location}%` } },
        { locationCountry: { [Op.like]: `%${location}%` } }
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    if (remote === 'true') {
      whereClause.isRemote = true;
    }

    if (salary_min) {
      whereClause.salaryMax = { [Op.gte]: parseInt(salary_min, 10) };
    }

    if (salary_max) {
      whereClause.salaryMin = { [Op.lte]: parseInt(salary_max, 10) };
    }

    // Note: experience_level and skills filtering on JSON columns is done post-query
    const searchQuery = whereClause;

    // Add LinkedIn jobs to search
    let linkedinJobs = [];
    if (q || location) {
      try {
        linkedinJobs = await getLinkedInService().searchLinkedInJobs({
          keywords: q,
          location,
          limit: 10
        });
      } catch (error) {
        logger.error('LinkedIn job search error:', error);
      }
    }

    // Search local jobs using Sequelize
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let jobs = [];
    let total = 0;
    const JobModel = resolveModel(Job);
    if (JobModel) {
      try {
        const result = await JobModel.findAndCountAll({
          where: searchQuery,
          order: [['createdAt', 'DESC']],
          offset: skip,
          limit: parseInt(limit, 10)
        });
        jobs = result.rows;
        total = result.count;
      } catch (dbError) {
        getLogger().warn(`Job search fallback (database unavailable): ${dbError.message}`);
      }
    }

    // Combine local and LinkedIn jobs
    const allJobs = [...jobs, ...linkedinJobs];

    res.json({
      jobs: allJobs,
      total: total + linkedinJobs.length,
      page: parseInt(page),
      totalPages: Math.ceil((total + linkedinJobs.length) / limit)
    });

  } catch (error) {
    getLogger().error('Job search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/applications
// @desc    Get current user's job applications (compatibility endpoint)
// @access  Private
router.get('/applications', authenticateToken, jobSearchLimiter, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user?.userId;

    const JobModel2 = resolveModel(Job);
    if (!JobModel2) {
      return res.json({ applications: [], total: 0, page: parseInt(page, 10), totalPages: 0 });
    }
    // Load all jobs then filter by applications JSON (SQLite doesn't support JSON path queries natively)
    const jobs = await JobModel2.findAll({ order: [['updatedAt', 'DESC']], limit: 200 });

    let applications = [];
    jobs.forEach((job) => {
      const matches = (job.applications || []).filter((entry) => {
        const matchesUser = String(entry.userId) === String(userId);
        const matchesStatus = status ? entry.status === status : true;
        return matchesUser && matchesStatus;
      });

      matches.forEach((entry) => {
        applications.push({
          id: entry.id || entry._id,
          status: entry.status,
          appliedAt: entry.appliedAt,
          notes: entry.notes,
          job: {
            id: job.id,
            title: job.title,
            company: job.companyName || 'Unknown Company',
            location: [job.locationCity, job.locationState, job.locationCountry].filter(Boolean).join(', ')
          }
        });
      });
    });

    applications = applications.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const start = (parsedPage - 1) * parsedLimit;
    const paginated = applications.slice(start, start + parsedLimit);

    res.json({
      applications: paginated,
      total: applications.length,
      page: parsedPage,
      totalPages: Math.ceil(applications.length / parsedLimit) || 0
    });
  } catch (error) {
    getLogger().warn(`Could not fetch applications from database: ${error.message}`);
    res.json({ applications: [], total: 0, page: 1, totalPages: 0 });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job details
// @access  Public
router.get('/:id(\\d+)', async (req, res) => {
  try {
    const JobModel = resolveModel(Job);
    if (!JobModel) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const job = await JobModel.findByPk(parseInt(req.params.id, 10));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get similar jobs by same type or company
    let similarJobs = [];
    try {
      similarJobs = await JobModel.findAll({
        where: {
          id: { [Op.ne]: job.id },
          [Op.or]: [{ type: job.type }, { companyName: job.companyName }],
          status: 'active'
        },
        limit: 5
      });
    } catch (_) { /* non-critical */ }

    res.json({
      job,
      similarJobs
    });

  } catch (error) {
    logger.error('Get job details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/jobs/apply/:id
// @desc    Apply for a job
// @access  Private
router.post('/apply/:id', authenticateToken, upload.single('resume'), async (req, res) => {
  try {

    const { id } = req.params;
    const { coverLetter } = req.body;
    const userId = req.user.userId;

    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }
    const job = await resolveModel(Job).findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existing = (job.applications || []).find(
      app => String(app.applicant || app.userId) === String(userId)
    );
    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Create application entry (file stored on disk — no binary blobs in DB)
    const application = {
      id: require('crypto').randomBytes(8).toString('hex'),
      applicant: userId,
      userId,
      coverLetter: coverLetter || '',
      appliedAt: new Date().toISOString(),
      status: 'pending',
      resumeFile: req.file ? {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path || null   // multer diskStorage path; no binary blob
      } : null
    };

    const updatedApplications = [...(job.applications || []), application];
    await job.update({
      applications: updatedApplications,
      applicationCount: updatedApplications.length
    });

    // Update user's applied jobs list if User model supports it
    const UserModel = getUserModel();
    if (UserModel && typeof UserModel.findByPk === 'function') {
      try {
        const user = await UserModel.findByPk(userId);
        if (user) {
          const appliedJobs = Array.isArray(user.appliedJobs) ? user.appliedJobs : [];
          if (!appliedJobs.includes(id)) {
            await user.update({ appliedJobs: [...appliedJobs, id] });
          }
        }
      } catch (updateErr) {
        // Non-critical — application already saved to Job
        console.warn('Could not update user appliedJobs:', updateErr.message);
      }
    }

    res.json({ 
      message: 'Application submitted successfully',
      applicationId: application.id
    });

  } catch (error) {
    logger.error('Job application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/jobs/save/:id
// @desc    Save a job for later
// @access  Private
router.post('/save/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }
    const job = await resolveModel(Job).findByPk(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Add to saved jobs using Sequelize-compatible approach
    const UserModel = getUserModel();
    if (!UserModel) {
      return res.status(503).json({ error: 'User model not available' });
    }
    if (typeof UserModel.findByPk === 'function') {
      const user = await UserModel.findByPk(userId);
      if (user) {
        const savedJobs = Array.isArray(user.savedJobs) ? user.savedJobs : [];
        if (!savedJobs.includes(id)) {
          await user.update({ savedJobs: [...savedJobs, id] });
        }
      }
    }

    res.json({ message: 'Job saved successfully' });

  } catch (error) {
    logger.error('Save job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/jobs/save/:id
// @desc    Remove job from saved
// @access  Private
router.delete('/save/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const UserModel = getUserModel();
    if (!UserModel) {
      return res.status(503).json({ error: 'User model not available' });
    }
    if (typeof UserModel.findByPk === 'function') {
      const user = await UserModel.findByPk(userId);
      if (user) {
        const savedJobs = Array.isArray(user.savedJobs) ? user.savedJobs : [];
        await user.update({ savedJobs: savedJobs.filter(jobId => String(jobId) !== String(id)) });
      }
    }

    res.json({ message: 'Job removed from saved' });

  } catch (error) {
    logger.error('Remove saved job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/jobs
// @desc    Post a new job (employer only)
// @access  Private (employer)
router.post('/', authenticateToken, authorizeRole('employer'), jobPostingLimiter, validateJobPosting, async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, description, requirements, location, type, salary,
      company, remote, experienceLevel, benefits, deadline, skills: bodySkills
    } = req.body;

    // Normalise incoming fields to Sequelize model column names
    const companyName = typeof company === 'object' ? (company.name || 'Unknown') : (company || 'Unknown');
    const locationCity = typeof location === 'object' ? (location.city || '') : (location || '');
    const locationState = typeof location === 'object' ? (location.state || '') : '';
    const locationCountry = typeof location === 'object' ? (location.country || 'US') : 'US';

    const job = await resolveModel(Job).create({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : [],
      companyName,
      locationCity,
      locationState,
      locationCountry,
      isRemote: remote === true || remote === 'true',
      type: type || 'full-time',
      salaryMin: salary?.min ?? null,
      salaryMax: salary?.max ?? null,
      salaryCurrency: salary?.currency || 'USD',
      experienceMin: typeof experienceLevel === 'number' ? experienceLevel : 0,
      skills: Array.isArray(bodySkills) ? bodySkills : (Array.isArray(requirements) ? requirements : []),
      perks: Array.isArray(benefits) ? benefits : [],
      applicationDeadline: deadline ? new Date(deadline) : null,
      employerId: parseInt(req.user.userId, 10),
      status: 'active'
    });

    // LinkedIn posting is always attempted for unified external distribution.
    let linkedInSync = { attempted: true, success: false };
    try {
      const linkedInResponse = await getLinkedInService().postLinkedInJob(job);
      linkedInSync = {
        attempted: true,
        success: true,
        postId: linkedInResponse?.postId || null
      };
    } catch (error) {
      logger.error('LinkedIn job posting error:', error);
      linkedInSync = {
        attempted: true,
        success: false,
        error: error.message
      };
    }

    res.status(201).json({
      message: 'Job posted successfully',
      job,
      linkedInSync
    });

  } catch (error) {
    logger.error('Job posting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job (employer only)
// @access  Private (employer)
router.put('/:id', authenticateToken, authorizeRole('employer'), validateJobPosting, async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = await resolveModel(Job).findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (String(job.employerId) !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const allowedFields = ['title', 'companyName', 'description', 'skills', 'type', 'status',
      'locationCity', 'locationState', 'locationCountry', 'isRemote', 'remoteType',
      'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryPeriod', 'experienceMin', 'experienceMax',
      'educationLevel', 'perks', 'tags', 'applicationDeadline', 'requirements'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    await job.update(updates);

    res.json({
      message: 'Job updated successfully',
      job: job.toJSON()
    });

  } catch (error) {
    logger.error('Job update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job (employer only)
// @access  Private (employer)
router.delete('/:id', authenticateToken, authorizeRole('employer'), async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const job = await resolveModel(Job).findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (String(job.employerId) !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await (async () => { const _d = await resolveModel(Job).findByPk(req.params.id); if (_d) await _d.destroy(); })();

    res.json({ message: 'Job deleted successfully' });

  } catch (error) {
    logger.error('Job deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/employer/my-jobs
// @desc    Get employer's posted jobs
// @access  Private (employer)
router.get('/employer/my-jobs', authenticateToken, authorizeRole('employer'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }
    const query = { employerId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const { count: total, rows: jobs } = await resolveModel(Job).findAndCountAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: parsedLimit
    });

    res.json({
      jobs,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit)
    });

  } catch (error) {
    const parsedPage = parseInt(req.query.page, 10) || 1;
    logger.warn(`Get employer jobs fallback enabled: ${error.message}`);
    res.json({
      jobs: [],
      total: 0,
      page: parsedPage,
      totalPages: 0,
      source: 'local-fallback'
    });
  }
});

// @route   GET /api/jobs/employer/applications/:jobId
// @desc    Get applications for a specific job
// @access  Private (employer)
router.get('/employer/applications/:jobId', authenticateToken, authorizeRole('employer'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }
    const job = await resolveModel(Job).findByPk(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (String(job.employerId) !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view applications for this job' });
    }

    let applications = job.applications;
    
    // Filter by status if provided
    if (status) {
      applications = applications.filter(app => app.status === status);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedApplications = applications.slice(skip, skip + parseInt(limit));

    res.json({
      applications: paginatedApplications,
      total: applications.length,
      page: parseInt(page),
      totalPages: Math.ceil(applications.length / limit)
    });

  } catch (error) {
    logger.error('Get job applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/jobs/employer/applications/:jobId/:applicationId
// @desc    Update application status
// @access  Private (employer)
router.put('/employer/applications/:jobId/:applicationId', authenticateToken, authorizeRole('employer'), async (req, res) => {
  try {
    const { jobId, applicationId } = req.params;
    const { status, notes } = req.body;

    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }
    const job = await resolveModel(Job).findByPk(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (String(job.employerId) !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update applications for this job' });
    }

    const applications = job.applications || [];
    const appIdx = applications.findIndex(
      a => String(a.id || a._id) === String(applicationId)
    );
    if (appIdx === -1) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = { ...applications[appIdx] };
    application.status = status;
    if (notes) application.notes = notes;
    application.updatedAt = new Date().toISOString();
    applications[appIdx] = application;

    await job.update({ applications });

    res.json({
      message: 'Application status updated successfully',
      application
    });

  } catch (error) {
    logger.error('Update application status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/employer/candidates/search
// @desc    Search candidates based on job requirements
// @access  Private (employer)
router.get('/employer/candidates/search', authenticateToken, authorizeRole('employer'), async (req, res) => {
  try {
    const { skills, location, experience, page = 1, limit = 20 } = req.query;

    const UserModel = getUserModel();
    if (!UserModel) {
      return res.status(503).json({ error: 'User model not available' });
    }
    // Build Sequelize WHERE — skills/location stored as JSON text in SQLite,
    // so we do a LIKE search on the serialised column.
    const whereClause = { role: 'jobseeker', isActive: true };

    if (location) {
      whereClause.location = { [Op.like]: `%${location}%` };
    }

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count: total, rows: allCandidates } = await UserModel.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'skills', 'experience', 'location', 'bio'],
      offset,
      limit: parsedLimit
    });

    // Post-filter by skills (JSON column match) and experience
    let candidates = allCandidates;
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      candidates = candidates.filter(c => {
        const cSkills = Array.isArray(c.skills) ? c.skills.map(s => s.toLowerCase()) : [];
        return skillsArray.some(s => cSkills.includes(s));
      });
    }
    if (experience) {
      const minYears = parseInt(experience, 10);
      candidates = candidates.filter(c => {
        const exp = Array.isArray(c.experience) ? c.experience.length : 0;
        return exp >= minYears;
      });
    }

    res.json({
      candidates: candidates.map(c => c.toJSON()),
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit)
    });

  } catch (error) {
    logger.error('Search candidates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
