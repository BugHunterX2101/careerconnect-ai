const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

// Try to import models (optional)
let Job = null;
let User = null;
let Interview = null;

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

try {
  Interview = require('../models/Interview');
} catch (error) {
  console.warn('Interview model not available:', error.message);
}

const { authenticateToken, authorizeRole } = require('../middleware/auth');
let logger;
const getLogger = () => {
  if (!logger) {
    logger = require('../middleware/logger');
  }
  return logger;
};

const router = express.Router();

// Rate limiting
const employerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
// Apply rate limiting, authentication, and CSRF protection to all employer routes
router.use(employerLimiter);
router.use(authenticateToken);
router.use(authorizeRole('employer'));
router.use(csrf({ cookie: true }));
router.use(authorizeRole('employer'));

// @route   GET /api/employer/dashboard/stats
// @desc    Get employer dashboard statistics
// @access  Private (employer)
router.get('/dashboard/stats', async (req, res) => {
  try {
    if (!Job || !User || !Interview) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const employerId = req.user.userId;
    
    // Get job statistics
    const jobs = await Job.find({ employer: employerId });
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalJobs = jobs.length;
    
    // Get application statistics
    const totalApplications = jobs.reduce((total, job) => total + (job.applications?.length || 0), 0);
    const newApplications = jobs.reduce((total, job) => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newApps = job.applications?.filter(app => new Date(app.appliedAt) > weekAgo) || [];
      return total + newApps.length;
    }, 0);
    
    // Get interview statistics
    const interviews = await Interview.find({ interviewer: employerId });
    const scheduledInterviews = interviews.filter(interview => 
      ['scheduled', 'confirmed'].includes(interview.status)
    ).length;
    const upcomingInterviews = interviews.filter(interview => 
      new Date(interview.scheduledAt) > new Date() && 
      ['scheduled', 'confirmed'].includes(interview.status)
    ).length;
    
    // Get hiring statistics
    const totalHired = jobs.reduce((total, job) => {
      const hired = job.applications?.filter(app => app.status === 'hired') || [];
      return total + hired.length;
    }, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const hiredThisMonth = jobs.reduce((total, job) => {
      const hired = job.applications?.filter(app => 
        app.status === 'hired' && new Date(app.updatedAt) >= thisMonth
      ) || [];
      return total + hired.length;
    }, 0);
    
    // Calculate metrics
    const avgApplicationsPerJob = totalJobs > 0 ? Math.round(totalApplications / totalJobs) : 0;
    const responseRate = totalApplications > 0 ? Math.round((totalApplications - jobs.reduce((total, job) => {
      const pending = job.applications?.filter(app => app.status === 'pending') || [];
      return total + pending.length;
    }, 0)) / totalApplications * 100) : 0;
    const hireRate = totalApplications > 0 ? Math.round(totalHired / totalApplications * 100) : 0;

    res.json({
      activeJobs,
      totalJobs,
      totalApplications,
      newApplications,
      scheduledInterviews,
      upcomingInterviews,
      totalHired,
      hiredThisMonth,
      avgApplicationsPerJob,
      responseRate,
      hireRate,
      notifications: [] // Placeholder for notifications
    });

  } catch (error) {
    getLogger().error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/jobs
// @desc    Get employer's jobs
// @access  Private (employer)
router.get('/jobs', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const employerId = req.user.userId;
    
    const query = { employer: employerId };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
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
    getLogger().error('Get employer jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/jobs/:id
// @desc    Get specific job details
// @access  Private (employer)
router.get('/jobs/:id', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const job = await Job.findOne({
      _id: req.params.id,
      employer: req.user.userId
    }).populate('applications.applicant', 'firstName lastName email profile');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({ job });

  } catch (error) {
    getLogger().error('Get job details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/employer/jobs
// @desc    Create a new job and get matching candidates
// @access  Private (employer)
router.post('/jobs', [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Job title is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Job description must be at least 10 characters'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('type').isIn(['full-time', 'part-time', 'contract', 'internship', 'temporary']).withMessage('Invalid job type'),
  body('salary.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salary.max').isNumeric().withMessage('Maximum salary must be a number')
], async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const jobData = {
      ...req.body,
      employer: req.user.userId,
      requiredSkills: req.body.skills || req.body.requirements || []
    };

    const job = new Job(jobData);
    await job.save();

    // Get matching candidates immediately
    let matchingCandidates = [];
    try {
      const candidateMatchingService = require('../services/candidateMatchingService');
      const matchResults = await candidateMatchingService.getMatchingCandidates(job._id, {
        limit: 15,
        minScore: 30
      });
      matchingCandidates = matchResults.candidates;
    } catch (error) {
      getLogger().error('Candidate matching error:', error);
    }

    res.status(201).json({
      message: 'Job created successfully',
      job,
      matchingCandidates,
      totalMatches: matchingCandidates.length
    });

  } catch (error) {
    getLogger().error('Create job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/employer/jobs/:id
// @desc    Update a job
// @access  Private (employer)
router.put('/jobs/:id', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employer: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      message: 'Job updated successfully',
      job
    });

  } catch (error) {
    getLogger().error('Update job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/employer/jobs/:id
// @desc    Delete a job
// @access  Private (employer)
router.delete('/jobs/:id', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      employer: req.user.userId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });

  } catch (error) {
    getLogger().error('Delete job error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/employer/jobs/:id/status
// @desc    Toggle job status
// @access  Private (employer)
router.patch('/jobs/:id/status', [
  body('status').isIn(['active', 'inactive', 'draft', 'archived']).withMessage('Invalid status value')
], async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { status } = req.body;
    
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employer: req.user.userId },
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      message: 'Job status updated successfully',
      job
    });

  } catch (error) {
    getLogger().error('Update job status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/jobs/:id/applicants
// @desc    Get applicants for a job
// @access  Private (employer)
router.get('/jobs/:id/applicants', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { page = 1, limit = 20, status } = req.query;
    
    const job = await Job.findOne({
      _id: req.params.id,
      employer: req.user.userId
    }).populate({
      path: 'applications.applicant',
      select: 'firstName lastName email profile'
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let applications = job.applications || [];
    
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
    getLogger().error('Get job applicants error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/employer/jobs/:jobId/applicants/:applicationId
// @desc    Update application status
// @access  Private (employer)
router.patch('/jobs/:jobId/applicants/:applicationId', async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.body._csrf) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }

    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { status, notes } = req.body;
    
    const job = await Job.findOne({
      _id: req.params.jobId,
      employer: req.user.userId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const application = job.applications.id(req.params.applicationId);
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
    getLogger().error('Update application status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/employer/jobs/:jobId/applicants/bulk
// @desc    Bulk update application status
// @access  Private (employer)
router.patch('/jobs/:jobId/applicants/bulk', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { applicantIds, status } = req.body;
    
    const job = await Job.findOne({
      _id: req.params.jobId,
      employer: req.user.userId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let updatedCount = 0;
    applicantIds.forEach(applicantId => {
      const application = job.applications.id(applicantId);
      if (application) {
        application.status = status;
        application.updatedAt = new Date();
        updatedCount++;
      }
    });

    await job.save();

    res.json({
      message: `${updatedCount} applications updated successfully`,
      updatedCount
    });

  } catch (error) {
    getLogger().error('Bulk update applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/jobs/:jobId/applicants/:applicationId/resume
// @desc    Download applicant resume
// @access  Private (employer)
router.get('/jobs/:jobId/applicants/:applicationId/resume', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const job = await Job.findOne({
      _id: req.params.jobId,
      employer: req.user.userId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const application = job.applications.id(req.params.applicationId);
    if (!application || !application.resumeFile) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.set({
      'Content-Type': application.resumeFile.mimetype,
      'Content-Disposition': `attachment; filename="${application.resumeFile.filename}"`,
      'Content-Length': application.resumeFile.size
    });

    res.send(application.resumeFile.data);

  } catch (error) {
    getLogger().error('Download resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/candidates/search
// @desc    Search candidates with AI matching
// @access  Private (employer)
router.get('/candidates/search', async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const { skills, location, experience, keywords, page = 1, limit = 15 } = req.query;
    
    try {
      const candidateMatchingService = require('../services/candidateMatchingService');
      
      // Use AI-powered search
      const searchCriteria = {
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
        location,
        experience: experience ? {
          min: parseInt(experience.split('-')[0]) || 0,
          max: experience.includes('+') ? undefined : parseInt(experience.split('-')[1])
        } : undefined,
        keywords,
        limit: parseInt(limit)
      };
      
      const results = await candidateMatchingService.searchCandidatesRealTime(searchCriteria);
      
      res.json({
        candidates: results.candidates,
        total: results.total,
        page: parseInt(page),
        totalPages: Math.ceil(results.total / limit),
        searchCriteria: results.searchCriteria
      });
      
    } catch (matchingError) {
      // Fallback to basic search
      getLogger().warn('AI matching failed, using basic search:', matchingError);
      
      const searchQuery = { role: 'jobseeker' };
      
      if (skills) {
        const skillsArray = skills.split(',').map(skill => skill.trim());
        searchQuery['profile.skills'] = { $in: skillsArray };
      }
      
      if (location) {
        searchQuery['profile.location'] = { $regex: location, $options: 'i' };
      }
      
      if (experience) {
        const [min, max] = experience.split('-');
        if (max === '+') {
          searchQuery['profile.experience.years'] = { $gte: parseInt(min) };
        } else {
          searchQuery['profile.experience.years'] = { 
            $gte: parseInt(min), 
            $lte: parseInt(max) 
          };
        }
      }
      
      if (keywords) {
        searchQuery.$or = [
          { 'profile.title': { $regex: keywords, $options: 'i' } },
          { 'profile.summary': { $regex: keywords, $options: 'i' } },
          { 'profile.skills': { $in: [new RegExp(keywords, 'i')] } }
        ];
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const candidates = await User.find(searchQuery)
        .select('firstName lastName email profile')
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await User.countDocuments(searchQuery);
      
      res.json({
        candidates,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    }

  } catch (error) {
    getLogger().error('Search candidates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/candidates/:id
// @desc    Get candidate details
// @access  Private (employer)
router.get('/candidates/:id', async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const candidate = await User.findOne({
      _id: req.params.id,
      role: 'jobseeker'
    }).select('firstName lastName email profile').populate('resumes');

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ candidate });

  } catch (error) {
    getLogger().error('Get candidate details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/employer/candidates/:id/rating
// @desc    Get comprehensive candidate rating for a job posting
// @access  Private (employer)
router.post('/candidates/:id/rating', async (req, res) => {
  try {
    if (!User || !Job) {
      return res.status(503).json({ error: 'Required models not available' });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Get candidate profile and resume
    const candidate = await User.findOne({
      _id: req.params.id,
      role: 'jobseeker'
    }).select('firstName lastName email profile').populate('resumes');

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Get job posting (verify it belongs to employer)
    const job = await Job.findOne({
      _id: jobId,
      employer: req.user.userId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }

    // Build candidate object with resume data
    const candidateData = {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      profile: candidate.profile || {},
      resume: candidate.resumes && candidate.resumes.length > 0
        ? candidate.resumes[candidate.resumes.length - 1]
        : {}
    };

    // Import and use candidate rating service
    const candidateRatingService = require('../services/candidateRatingService');
    const rating = candidateRatingService.calculateCandidateRating(candidateData, job);

    res.json({
      success: true,
      candidate: {
        id: candidate._id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email
      },
      job: {
        id: job._id,
        title: job.title,
        company: job.company
      },
      rating: {
        overall: rating.overall,
        tier: rating.tier,
        categoryScores: rating.category,
        strengths: rating.strengths,
        concerns: rating.concerns,
        recommendation: rating.recommendation,
        breakdown: rating.breakdown
      }
    });

  } catch (error) {
    getLogger().error('Candidate rating error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate candidate rating',
      message: error.message 
    });
  }
});

// @route   GET /api/employer/jobs/:jobId/matching-candidates
// @desc    Get matching candidates for a specific job
// @access  Private (employer)
router.get('/jobs/:jobId/matching-candidates', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { jobId } = req.params;
    const { limit = 15, minScore = 30 } = req.query;

    // Verify job belongs to employer
    const job = await Job.findOne({
      _id: jobId,
      employer: req.user.userId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    try {
      const candidateMatchingService = require('../services/candidateMatchingService');
      const results = await candidateMatchingService.getMatchingCandidates(jobId, {
        limit: parseInt(limit),
        minScore: parseInt(minScore)
      });

      res.json({
        candidates: results.candidates,
        total: results.total,
        job: results.job,
        matchingCriteria: {
          minScore: parseInt(minScore),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      getLogger().error('Candidate matching error:', error);
      res.status(500).json({ error: 'Failed to find matching candidates' });
    }

  } catch (error) {
    getLogger().error('Get matching candidates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/employer/candidates/:id/invite
// @desc    Invite candidate to apply for job
// @access  Private (employer)
router.post('/candidates/:id/invite', async (req, res) => {
  try {
    const { jobId, message } = req.body;
    
    // Here you would typically send an email invitation
    // For now, we'll just return success
    
    res.json({
      message: 'Invitation sent successfully'
    });

  } catch (error) {
    getLogger().error('Invite candidate error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/interviews
// @desc    Get employer's interviews
// @access  Private (employer)
router.get('/interviews', async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { page = 1, limit = 20, status } = req.query;
    
    const query = { interviewer: req.user.userId };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const interviews = await Interview.find(query)
      .populate('job', 'title company')
      .populate('candidate', 'firstName lastName email')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Interview.countDocuments(query);
    
    res.json({
      interviews,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    getLogger().error('Get interviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/employer/interviews
// @desc    Schedule an interview
// @access  Private (employer)
router.post('/interviews', [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('candidateId').isMongoId().withMessage('Valid candidate ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('type').isIn(['phone', 'video', 'onsite']).withMessage('Invalid interview type')
], async (req, res) => {
  try {
    if (!Interview || !Job) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify job belongs to employer
    const job = await Job.findOne({
      _id: req.body.jobId,
      employer: req.user.userId
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const interviewData = {
      ...req.body,
      interviewer: req.user.userId,
      status: 'scheduled'
    };

    const interview = new Interview(interviewData);
    await interview.save();

    await interview.populate([
      { path: 'job', select: 'title company' },
      { path: 'candidate', select: 'firstName lastName email' }
    ]).execPopulate();

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview
    });

  } catch (error) {
    getLogger().error('Schedule interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/employer/interviews/:id
// @desc    Update interview
// @access  Private (employer)
router.put('/interviews/:id', async (req, res) => {
  try {
    // Validate CSRF token
    if (!req.body._csrf) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }

    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, interviewer: req.user.userId },
      req.body,
      { new: true }
    ).populate([
      { path: 'job', select: 'title company' },
      { path: 'candidate', select: 'firstName lastName email' }
    ]);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({
      message: 'Interview updated successfully',
      interview
    });

  } catch (error) {
    getLogger().error('Update interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/employer/interviews/:id/cancel
// @desc    Cancel interview
// @access  Private (employer)
router.patch('/interviews/:id/cancel', async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { reason } = req.body;
    
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, interviewer: req.user.userId },
      { 
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date()
      },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({
      message: 'Interview cancelled successfully',
      interview
    });

  } catch (error) {
    getLogger().error('Cancel interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;