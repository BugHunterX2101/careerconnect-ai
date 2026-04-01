const express = require('express');
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

  if (typeof User.findByPk === 'function' || typeof User.findById === 'function') {
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
      user = await UserModel.findById(userId);
      if (user?.populate) {
        user = await user.populate('resumes');
      }
    } else if (UserModel?.findByPk) {
      user = await UserModel.findByPk(userId);
    }

    if (!user) {
      return res.json({
        recommendations: [],
        total: 0,
        page: parseInt(page, 10),
        totalPages: 0,
        source: 'unavailable'
      });
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
        if (location) searchQuery.location = { $regex: location, $options: 'i' };
        if (remote === 'true') searchQuery.remote = true;

        const jobs = await Job.find(searchQuery)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit, 10))
          .populate('employer', 'firstName lastName company');

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

    const user = await User.findById(userId).populate('resumes');
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
      experience_level, skills, page = 1, limit = 20 
    } = req.query;

    // Build search query
    const searchQuery = {};
    
    if (q) {
      searchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } }
      ];
    }

    if (location) {
      searchQuery.location = { $regex: location, $options: 'i' };
    }

    if (type) {
      searchQuery.type = type;
    }

    if (remote === 'true') {
      searchQuery.remote = true;
    }

    if (salary_min || salary_max) {
      searchQuery['salary.max'] = {};
      if (salary_min) searchQuery['salary.max'].$gte = parseInt(salary_min);
      if (salary_max) searchQuery['salary.min'].$lte = parseInt(salary_max);
    }

    if (experience_level) {
      searchQuery.experienceLevel = experience_level;
    }

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      searchQuery.requiredSkills = { $in: skillsArray };
    }

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

    // Search local jobs
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let jobs = [];
    let total = 0;
    if (Job && typeof Job.find === 'function') {
      try {
        jobs = await Job.find(searchQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('employer', 'firstName lastName company');

        total = await Job.countDocuments(searchQuery);
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

    if (!Job || typeof Job.find !== 'function') {
      return res.json({ applications: [], total: 0, page: parseInt(page, 10), totalPages: 0 });
    }

    const query = { 'applications.userId': userId };
    const jobs = await Job.find(query).sort({ updatedAt: -1 }).limit(200);

    let applications = [];
    jobs.forEach((job) => {
      const matches = (job.applications || []).filter((entry) => {
        const matchesUser = String(entry.userId) === String(userId);
        const matchesStatus = status ? entry.status === status : true;
        return matchesUser && matchesStatus;
      });

      matches.forEach((entry) => {
        applications.push({
          _id: entry._id,
          status: entry.status,
          appliedAt: entry.appliedAt,
          notes: entry.notes,
          job: {
            _id: job._id,
            title: job.title,
            company: job?.company?.name || 'Unknown Company',
            location: [job?.location?.city, job?.location?.state, job?.location?.country].filter(Boolean).join(', ')
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
router.get('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const job = await Job.findById(req.params.id)
      .populate('employer', 'firstName lastName company profile');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get similar jobs
    const similarJobs = await Job.find({
      _id: { $ne: job._id },
      $or: [
        { requiredSkills: { $in: job.requiredSkills } },
        { type: job.type },
        { location: job.location }
      ]
    })
    .limit(5)
    .populate('employer', 'firstName lastName company');

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
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = job.applications.find(
      app => app.applicant.toString() === userId
    );

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Create application
    const application = {
      applicant: userId,
      coverLetter,
      appliedAt: new Date(),
      status: 'pending'
    };

    if (req.file) {
      application.resumeFile = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      };
    }

    job.applications.push(application);
    await job.save();

    // Update user's applied jobs
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }
    await User.findByIdAndUpdate(userId, {
      $addToSet: { appliedJobs: id }
    });

    res.json({ 
      message: 'Application submitted successfully',
      applicationId: application._id
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
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Add to saved jobs
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }
    await User.findByIdAndUpdate(userId, {
      $addToSet: { savedJobs: id }
    });

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

    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }
    await User.findByIdAndUpdate(userId, {
      $pull: { savedJobs: id }
    });

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
      company, remote, experienceLevel, benefits, deadline
    } = req.body;

    const job = new Job({
      title,
      description,
      requirements,
      location,
      type,
      salary,
      company,
      remote: remote === 'true',
      experienceLevel,
      benefits,
      deadline: deadline ? new Date(deadline) : undefined,
      employer: req.user.userId,
      requiredSkills: requirements
    });

    await job.save();

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

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Job updated successfully',
      job: updatedJob
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

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);

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
    const query = { employer: req.user.userId };
    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await Job.countDocuments(query);

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
    const job = await Job.findById(jobId).populate({
      path: 'applications.applicant',
      select: 'firstName lastName email profile'
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user.userId) {
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
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user owns this job
    if (job.employer.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update applications for this job' });
    }

    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = status;
    if (notes) {
      application.notes = notes;
    }
    application.updatedAt = new Date();

    await job.save();

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

    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }
    const searchQuery = { role: 'jobseeker' };

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      searchQuery['profile.skills'] = { $in: skillsArray };
    }

    if (location) {
      searchQuery['profile.location'] = { $regex: location, $options: 'i' };
    }

    if (experience) {
      searchQuery['profile.experience.years'] = { $gte: parseInt(experience) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const candidates = await User.find(searchQuery)
      .select('firstName lastName email profile')
      .populate('resumes')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    res.json({
      candidates,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('Search candidates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
