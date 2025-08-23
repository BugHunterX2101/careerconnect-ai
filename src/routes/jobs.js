const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');
const logger = require('../middleware/logger');
const { searchLinkedInJobs, postLinkedInJob } = require('../services/linkedinService');
const { getJobRecommendations } = require('../ml/jobRecommender');

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

    // Get user's resume and profile for recommendations
    const user = await User.findById(userId).populate('resumes');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recommendations from ML service
    const recommendations = await getJobRecommendations(user, {
      page: parseInt(page),
      limit: parseInt(limit),
      location,
      remote: remote === 'true'
    });

    res.json({
      recommendations: recommendations.jobs,
      total: recommendations.total,
      page: parseInt(page),
      totalPages: Math.ceil(recommendations.total / limit)
    });

  } catch (error) {
    logger.error('Job recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/search
// @desc    Search jobs with filters
// @access  Public
router.get('/search', jobSearchLimiter, async (req, res) => {
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
        linkedinJobs = await searchLinkedInJobs({
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
    const jobs = await Job.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('employer', 'firstName lastName company');

    const total = await Job.countDocuments(searchQuery);

    // Combine local and LinkedIn jobs
    const allJobs = [...jobs, ...linkedinJobs];

    res.json({
      jobs: allJobs,
      total: total + linkedinJobs.length,
      page: parseInt(page),
      totalPages: Math.ceil((total + linkedinJobs.length) / limit)
    });

  } catch (error) {
    logger.error('Job search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
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

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Add to saved jobs
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

    await User.findByIdAndUpdate(userId, {
      $pull: { savedJobs: id }
    });

    res.json({ message: 'Job removed from saved' });

  } catch (error) {
    logger.error('Remove saved job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Employer Routes

// @route   POST /api/jobs
// @desc    Post a new job (employer only)
// @access  Private (employer)
router.post('/', authenticateToken, authorizeRole('employer'), jobPostingLimiter, validateJobPosting, async (req, res) => {
  try {
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

    // Post to LinkedIn if enabled
    if (req.body.postToLinkedIn === 'true') {
      try {
        await postLinkedInJob(job);
        job.linkedinPosted = true;
        await job.save();
      } catch (error) {
        logger.error('LinkedIn job posting error:', error);
      }
    }

    res.status(201).json({
      message: 'Job posted successfully',
      job
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
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { employer: req.user.userId };
    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('Get employer jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/jobs/employer/applications/:jobId
// @desc    Get applications for a specific job
// @access  Private (employer)
router.get('/employer/applications/:jobId', authenticateToken, authorizeRole('employer'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

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
