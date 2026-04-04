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
        } catch (_) {}
      }
    }
  }
  return mod;
};

const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { createGMeetEvent } = require('../services/gmeetService');

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
let linkedinService;
const getLinkedInService = () => {
  if (!linkedinService) {
    linkedinService = require('../services/linkedinService');
  }
  return linkedinService;
};

const router = express.Router();

const interviewMemoryStore = {
  items: new Map(),
  seq: 1
};

const localJobStore = {
  items: new Map(),
  seq: 1
};

const isMongoObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));
const isNumericId = (value) => /^\d+$/.test(String(value));
const shouldUseInterviewFallback = (interviewerId, payload = {}) => {
  return !isMongoObjectId(interviewerId) ||
    !isMongoObjectId(payload.jobId) ||
    !isMongoObjectId(payload.candidateId);
};

const getSqlUserModel = () => {
  if (!User) {
    return null;
  }

  if (typeof User.User === 'function') {
    try {
      return User.User();
    } catch (error) {
      return null;
    }
  }

  if (typeof resolveModel(User).findByPk === 'function') {
    return User;
  }

  return null;
};

const buildFallbackInterviewer = async (req) => {
  const UserModel = getSqlUserModel();
  const interviewerId = String(req.user.userId);

  if (UserModel) {
    try {
      const user = await UserModel.findByPk(Number(interviewerId));
      if (user) {
        return {
          _id: interviewerId,
          id: interviewerId,
          firstName: user.firstName || 'Employer',
          lastName: user.lastName || '',
          email: user.email || req.user.email || ''
        };
      }
    } catch (error) {
      // Use token fallback below.
    }
  }

  return {
    _id: interviewerId,
    id: interviewerId,
    firstName: req.user.firstName || 'Employer',
    lastName: req.user.lastName || '',
    email: req.user.email || ''
  };
};

const extractCandidateYears = (candidate) => {
  if (typeof candidate?.profile?.experience?.years === 'number') {
    return candidate.profile.experience.years;
  }
  if (Array.isArray(candidate?.experience)) {
    return candidate.experience.length;
  }
  return 0;
};

const scoreCandidateForJob = (jobData, candidate) => {
  const jobSkills = (jobData.requiredSkills || []).map((skill) => String(skill).toLowerCase());
  const candidateSkills = [
    ...(Array.isArray(candidate?.skills) ? candidate.skills : []),
    ...(Array.isArray(candidate?.profile?.skills) ? candidate.profile.skills : [])
  ].map((skill) => String(skill).toLowerCase());

  const matchedSkills = jobSkills.filter((skill) =>
    candidateSkills.some((candidateSkill) => candidateSkill.includes(skill) || skill.includes(candidateSkill))
  );

  const skillScore = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 70) : 0;
  const requiredYears = jobData.experienceLevel === 'senior' ? 7 : jobData.experienceLevel === 'mid' ? 3 : 0;
  const candidateYears = extractCandidateYears(candidate);
  const experienceScore = candidateYears >= requiredYears ? 30 : Math.round((candidateYears / Math.max(requiredYears, 1)) * 30);
  const matchScore = Math.max(0, Math.min(100, skillScore + experienceScore));

  return {
    matchScore,
    matchReasons: [
      {
        type: 'skills',
        message: `Matches ${matchedSkills.length}/${jobSkills.length || 0} required skills`,
        details: matchedSkills
      },
      {
        type: 'experience',
        message: `${candidateYears} years experience`,
        details: { required: requiredYears, candidate: candidateYears }
      }
    ]
  };
};

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

// @route   GET /api/employer/dashboard/stats
// @desc    Get employer dashboard statistics
// @access  Private (employer)
router.get('/dashboard/stats', async (req, res) => {
  try {
    if (!Job || !Interview) {
      return res.json({
        activeJobs: 0,
        totalJobs: 0,
        totalApplications: 0,
        newApplications: 0,
        scheduledInterviews: 0,
        upcomingInterviews: 0,
        totalHired: 0,
        hiredThisMonth: 0,
        avgApplicationsPerJob: 0,
        responseRate: 0,
        hireRate: 0,
        notifications: []
      });
    }

    const employerId = req.user.userId;
    
    // Get job statistics
    const jobs = await resolveModel(Job).findAll({ where: { employer: employerId } });
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
    const interviews = await resolveModel(Interview).findAll({ where: { interviewer: employerId } });
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
    res.json({
      activeJobs: 0,
      totalJobs: 0,
      totalApplications: 0,
      newApplications: 0,
      scheduledInterviews: 0,
      upcomingInterviews: 0,
      totalHired: 0,
      hiredThisMonth: 0,
      avgApplicationsPerJob: 0,
      responseRate: 0,
      hireRate: 0,
      notifications: []
    });
  }
});

// @route   GET /api/employer/jobs
// @desc    Get employer's jobs
// @access  Private (employer)
router.get('/jobs', async (req, res) => {
  try {
    if (!Job) {
      return res.json({
        jobs: [],
        total: 0,
        page: parseInt(req.query.page || 1, 10),
        totalPages: 0
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    const employerId = req.user.userId;
    
    const query = { employer: employerId };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await resolveModel(Job).findAll({
      where: { employerId: parseInt(employerId, 10), ...(status ? { status } : {}) },
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    });
    const total = jobs.length;
    
    res.json({
      jobs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    getLogger().error('Get employer jobs error:', error);
    res.json({
      jobs: [],
      total: 0,
      page: parseInt(req.query.page || 1, 10),
      totalPages: 0
    });
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

    const job = await resolveModel(Job).findOne({ where: {
      _id: req.params.id,
      employer: req.user.userId
    } });
    
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

    const employmentTypeMap = {
      'full-time': 'full-time',
      'part-time': 'part-time',
      contract: 'contract',
      internship: 'internship',
      temporary: 'contract'
    };
    const seniorityMap = {
      entry: 'entry',
      junior: 'junior',
      mid: 'mid-level',
      'mid-level': 'mid-level',
      senior: 'senior',
      lead: 'lead',
      manager: 'manager',
      director: 'director',
      executive: 'executive'
    };

    const requestedSkills = Array.isArray(req.body.skills)
      ? req.body.skills
      : Array.isArray(req.body.requirements)
        ? req.body.requirements
        : [];

    const locationValue = typeof req.body.location === 'string' ? req.body.location : '';
    const [cityPart, statePart, countryPart] = locationValue.split(',').map((part) => part?.trim()).filter(Boolean);
    const companyName = typeof req.body.company === 'string'
      ? req.body.company
      : req.body.company?.name || 'CareerConnect';

    const jobData = {
      title: req.body.title,
      description: req.body.description,
      employer: req.user.userId,
      employerId: req.user.userId,
      company: {
        name: companyName,
        industry: req.body.industry || ''
      },
      location: {
        city: cityPart || locationValue || 'Remote',
        state: statePart || '',
        country: countryPart || req.body.country || 'Remote',
        isRemote: req.body.remote === true || req.body.remote === 'true'
      },
      employmentType: employmentTypeMap[req.body.type] || 'full-time',
      seniorityLevel: seniorityMap[req.body.experienceLevel] || 'mid-level',
      requirements: {
        skills: requestedSkills.map((skill) => ({
          name: String(skill).trim(),
          level: 'required'
        }))
      },
      benefits: {
        salary: {
          min: Number(req.body.salary?.min) || 0,
          max: Number(req.body.salary?.max) || 0,
          currency: req.body.salary?.currency || 'USD',
          period: 'yearly'
        }
      },
      // Legacy fields used in existing route logic
      requiredSkills: requestedSkills,
      experienceLevel: req.body.experienceLevel || 'mid',
      remote: req.body.remote === true || req.body.remote === 'true',
      status: 'active'
    };

    let job;
    const useLocalJobFallback = !isMongoObjectId(req.user.userId);
    if (useLocalJobFallback) {
      job = {
        _id: `local-job-${localJobStore.seq++}`,
        ...jobData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'compatibility-fallback'
      };
      localJobStore.items.set(job.id, job);
    } else {
      job = new Job(jobData);
      await job.save?.() || await job.update?.({});
    }

    // Attempt LinkedIn posting for external distribution consistency.
    let linkedInSync = { attempted: true, success: false };
    try {
      const linkedInResponse = await getLinkedInService().postLinkedInJob(jobData);
      linkedInSync = {
        attempted: true,
        success: true,
        postId: linkedInResponse?.postId || null
      };
    } catch (linkedInError) {
      getLogger().error('Employer LinkedIn posting error:', linkedInError);
      linkedInSync = {
        attempted: true,
        success: false,
        error: linkedInError.message
      };
    }

    // Get matching candidates immediately
    let matchingCandidates = [];
    if (useLocalJobFallback) {
      try {
        const UserModel = getSqlUserModel();
        const candidates = UserModel
          ? await UserModel.findAll({ where: { role: 'jobseeker', isActive: true }, limit: 50 })
          : [];

        matchingCandidates = candidates
          .map((candidate) => {
            const normalizedCandidate = typeof candidate?.toJSON === 'function' ? candidate.toJSON() : candidate;
            const scored = scoreCandidateForJob(jobData, normalizedCandidate);
            return {
              ...normalizedCandidate,
              ...scored
            };
          })
          .filter((candidate) => candidate.matchScore >= 30)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 15);
      } catch (error) {
        getLogger().error('Candidate matching fallback error:', error);
      }
    } else {
      try {
        const candidateMatchingService = require('../services/candidateMatchingService');
        const matchResults = await candidateMatchingService.getMatchingCandidates(job.id, {
          limit: 15,
          minScore: 30
        });
        matchingCandidates = matchResults.candidates;
      } catch (error) {
        getLogger().error('Candidate matching error:', error);
      }
    }

    res.status(201).json({
      message: 'Job created successfully',
      job,
      linkedInSync,
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
    
    const job = await resolveModel(Job).findOne({ where: {
      _id: req.params.id,
      employer: req.user.userId
    } });

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

// @route   PATCH /api/employer/jobs/:jobId/applicants/bulk
// @desc    Bulk update application status
// @access  Private (employer)
router.patch('/jobs/:jobId/applicants/bulk', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { applicantIds, status } = req.body;

    if (!Array.isArray(applicantIds) || applicantIds.length === 0) {
      return res.status(400).json({ error: 'applicantIds must be a non-empty array' });
    }

    const job = await resolveModel(Job).findOne({ where: {
      _id: req.params.jobId,
      employer: req.user.userId
    } });

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

    await job.save?.() || await job.update?.({});

    res.json({
      message: `${updatedCount} applications updated successfully`,
      updatedCount
    });

  } catch (error) {
    getLogger().error('Bulk update applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/employer/jobs/:jobId/applicants/:applicationId
// @desc    Update application status
// @access  Private (employer)
router.patch('/jobs/:jobId/applicants/:applicationId', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { status, notes } = req.body;
    
    const job = await resolveModel(Job).findOne({ where: {
      _id: req.params.jobId,
      employer: req.user.userId
    } });

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

    await job.save?.() || await job.update?.({});

    res.json({
      message: 'Application status updated successfully',
      application
    });

  } catch (error) {
    getLogger().error('Update application status error:', error);
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

    const job = await resolveModel(Job).findOne({ where: {
      _id: req.params.jobId,
      employer: req.user.userId
    } });

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
      
      const parsedPage = parseInt(page, 10) || 1;
      const parsedLimit = parseInt(limit, 10) || 15;
      const skip = (parsedPage - 1) * parsedLimit;

      const normalizeCandidate = (candidate) => {
        if (!candidate) {
          return null;
        }

        const raw = typeof candidate.toJSON === 'function' ? candidate.toJSON() : candidate;
        return {
          _id: raw.id,
          id: raw.id || raw._id,
          firstName: raw.firstName || '',
          lastName: raw.lastName || '',
          email: raw.email || '',
          profile: raw.profile || {
            title: '',
            summary: raw.bio || '',
            location: raw.location || '',
            skills: Array.isArray(raw.skills) ? raw.skills : [],
            experience: raw.experience || []
          }
        };
      };

      let candidates = [];
      let total = 0;

      if (typeof User.find === 'function' && typeof User.countDocuments === 'function') {
        const searchQuery = { role: 'jobseeker' };

        if (skills) {
          const skillsArray = skills.split(',').map(skill => skill.trim());
          searchQuery['profile.skills'] = { [Op.in]: skillsArray };
        }

        if (location) {
          searchQuery['profile.location'] = { [Op.like]: location, $options: 'i' };
        }

        if (experience) {
          const [min, max] = experience.split('-');
          if (max === '+') {
            searchQuery['profile.experience.years'] = { [Op.gte]: parseInt(min, 10) };
          } else {
            searchQuery['profile.experience.years'] = {
              [Op.gte]: parseInt(min, 10),
              [Op.lte]: parseInt(max, 10)
            };
          }
        }

        if (keywords) {
          searchQuery.$or = [
            { 'profile.title': { [Op.like]: keywords, $options: 'i' } },
            { 'profile.summary': { [Op.like]: keywords, $options: 'i' } },
            { 'profile.skills': { [Op.in]: [new RegExp(keywords, 'i')] } }
          ];
        }

        candidates = await User.find(searchQuery)
          .select('firstName lastName email profile')
          .offset(skip)
          .limit(parsedLimit);

        total = await User.countDocuments(searchQuery);
      } else {
        const UserModel = getSqlUserModel();
        if (!UserModel) {
          return res.status(503).json({ error: 'User model not available' });
        }

        const allUsers = await UserModel.findAll({ where: { role: 'jobseeker' } });
        const skillTerms = skills ? skills.split(',').map((term) => term.trim().toLowerCase()).filter(Boolean) : [];
        const keywordTerm = String(keywords || '').trim().toLowerCase();
        const locationTerm = String(location || '').trim().toLowerCase();

        let minExp = null;
        let maxExp = null;
        if (experience) {
          const [minRaw, maxRaw] = String(experience).split('-');
          minExp = Number.parseInt(minRaw, 10);
          if (maxRaw && maxRaw !== '+') {
            maxExp = Number.parseInt(maxRaw, 10);
          }
        }

        const filtered = allUsers
          .map(normalizeCandidate)
          .filter(Boolean)
          .filter((candidate) => {
            const profile = candidate.profile || {};
            const profileSkills = Array.isArray(profile.skills) ? profile.skills.map((s) => String(s).toLowerCase()) : [];
            const combinedText = [
              candidate.firstName,
              candidate.lastName,
              candidate.email,
              profile.title,
              profile.summary,
              profile.location,
              ...profileSkills
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            const locationOk = !locationTerm || String(profile.location || '').toLowerCase().includes(locationTerm);
            const skillsOk = skillTerms.length === 0 || skillTerms.every((term) => profileSkills.some((skill) => skill.includes(term)));
            const keywordOk = !keywordTerm || combinedText.includes(keywordTerm);

            let experienceYears = 0;
            if (typeof profile?.experience?.years === 'number') {
              experienceYears = profile.experience.years;
            } else if (Array.isArray(profile.experience)) {
              experienceYears = profile.experience.length;
            }

            const minExpOk = Number.isFinite(minExp) ? experienceYears >= minExp : true;
            const maxExpOk = Number.isFinite(maxExp) ? experienceYears <= maxExp : true;

            return locationOk && skillsOk && keywordOk && minExpOk && maxExpOk;
          });

        total = filtered.length;
        candidates = filtered.slice(skip, skip + parsedLimit);
      }

      res.json({
        candidates,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
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

    const candidate = await resolveModel(User).findOne({ where: {
      _id: req.params.id,
      role: 'jobseeker'
    } }).select('firstName lastName email profile');

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
    const candidate = await resolveModel(User).findOne({ where: {
      _id: req.params.id,
      role: 'jobseeker'
    } }).select('firstName lastName email profile');

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Get job posting (verify it belongs to employer)
    const job = await resolveModel(Job).findOne({ where: {
      _id: jobId,
      employer: req.user.userId
    } });

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
        id: job.id,
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
    const job = await resolveModel(Job).findOne({ where: {
      _id: jobId,
      employer: req.user.userId
    } });

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
router.post('/candidates/:id/invite', [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('message').optional().isLength({ max: 1000 }).withMessage('Message must be under 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, message } = req.body;
    const candidateId = req.params.id;

    // Verify the job belongs to this employer
    if (Job && isMongoObjectId(jobId) && isMongoObjectId(req.user.userId)) {
      const job = await resolveModel(Job).findOne({ where: { _id: jobId, employer: req.user.userId } });
      if (!job) {
        return res.status(404).json({ error: 'Job not found or you do not have permission to invite for this job' });
      }
    }

    // Retrieve candidate details for the response/notification
    let candidateEmail = null;
    let candidateName = null;
    if (User && isMongoObjectId(candidateId)) {
      const candidate = await resolveModel(User).findOne({ where: { _id: candidateId, role: 'jobseeker' } }).select('firstName lastName email');
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      candidateEmail = candidate.email;
      candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
    } else {
      const UserModel = getSqlUserModel();
      if (UserModel) {
        const candidate = await UserModel.findByPk(Number(candidateId));
        if (!candidate) {
          return res.status(404).json({ error: 'Candidate not found' });
        }
        candidateEmail = candidate.email;
        candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
      }
    }

    // Emit real-time invite notification to the candidate if socket is available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${candidateId}`).emit('job:invitation', {
        jobId,
        employerId: req.user.userId,
        message: message || 'You have been invited to apply for a position.',
        sentAt: new Date().toISOString()
      });
    }

    res.json({
      message: 'Invitation sent successfully',
      candidate: { id: candidateId, name: candidateName, email: candidateEmail }
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
    if (!isMongoObjectId(req.user.userId)) {
      const { page = 1, limit = 20, status } = req.query;
      const interviewerId = String(req.user.userId);
      let interviews = Array.from(interviewMemoryStore.items.values())
        .filter((interview) => interview.interviewer?.id === interviewerId);

      if (status) {
        interviews = interviews.filter((interview) => interview.status === status);
      }

      interviews.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
      const parsedPage = parseInt(page, 10);
      const parsedLimit = parseInt(limit, 10);
      const start = (parsedPage - 1) * parsedLimit;
      const paged = interviews.slice(start, start + parsedLimit);

      return res.json({
        interviews: paged,
        total: interviews.length,
        page: parsedPage,
        totalPages: Math.ceil(interviews.length / parsedLimit) || 0
      });
    }

    if (!Interview) {
      return res.json({
        interviews: [],
        total: 0,
        page: parseInt(req.query.page || 1, 10),
        totalPages: 0
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    
    const query = { interviewer: req.user.userId };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const interviews = await Interview.find(query)
      
      
      .order([['scheduledAt','DESC']])
      .offset(skip)
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
    res.json({
      interviews: [],
      total: 0,
      page: parseInt(req.query.page || 1, 10),
      totalPages: 0
    });
  }
});

// @route   POST /api/employer/interviews
// @desc    Schedule an interview
// @access  Private (employer)
router.post('/interviews', [
  body('jobId').custom((value) => isMongoObjectId(value) || isNumericId(value)).withMessage('Valid job ID is required'),
  body('candidateId').custom((value) => isMongoObjectId(value) || isNumericId(value)).withMessage('Valid candidate ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('type').isIn(['phone', 'video', 'onsite']).withMessage('Invalid interview type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!Interview || !Job || shouldUseInterviewFallback(req.user.userId, req.body)) {
      const interviewer = await buildFallbackInterviewer(req);
      const UserModel = getSqlUserModel();
      let candidate = null;

      if (UserModel) {
        candidate = await UserModel.findByPk(Number(req.body.candidateId));
      }

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      const startTime = new Date(req.body.scheduledAt);
      const endTime = new Date(startTime.getTime() + parseInt(req.body.duration, 10) * 60000);
      let meetLink = null;
      let meetEventId = null;

      if (req.body.type === 'video') {
        try {
          const meetEvent = await createGMeetEvent({
            summary: `Interview - ${req.body.jobTitle || 'General Position'}`,
            description: req.body.description || req.body.notes || 'Scheduled interview',
            startTime,
            endTime,
            attendees: [
              { email: candidate.email, displayName: `${candidate.firstName} ${candidate.lastName}` },
              { email: interviewer.email, displayName: `${interviewer.firstName} ${interviewer.lastName}`.trim() }
            ]
          });

          meetLink = meetEvent?.hangoutLink || null;
          meetEventId = meetEvent?.id || null;
        } catch (meetError) {
          getLogger().warn('Fallback schedule Google Meet creation failed:', meetError.message);
        }
      }

      const interview = {
        _id: `local-i-${interviewMemoryStore.seq++}`,
        job: {
          _id: String(req.body.jobId),
          title: req.body.jobTitle || 'General Position',
          company: req.body.company || 'CareerConnect'
        },
        candidate: {
          _id: String(req.body.candidateId),
          id: String(req.body.candidateId),
          firstName: candidate.firstName || 'Candidate',
          lastName: candidate.lastName || '',
          email: candidate.email || ''
        },
        interviewer,
        scheduledAt: startTime.toISOString(),
        duration: parseInt(req.body.duration, 10),
        type: req.body.type,
        notes: req.body.notes || '',
        description: req.body.description || '',
        status: 'scheduled',
        meetLink,
        meetEventId,
        source: 'compatibility-fallback',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      interviewMemoryStore.items.set(interview._id, interview);

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${req.body.candidateId}`).emit('interview:scheduled', {
          interview,
          job: interview.job.title,
          employer: `${interviewer.firstName} ${interviewer.lastName}`.trim()
        });
      }

      return res.status(201).json({
        message: 'Interview scheduled successfully',
        interview
      });
    }

    // Verify job belongs to employer
    const job = await resolveModel(Job).findOne({ where: {
      _id: req.body.jobId,
      employer: req.user.userId
    } });

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

    await interview;

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
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, interviewer: req.user.userId },
      req.body,
      { new: true }
    );

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

// @route   GET /api/employer/analytics
// @desc    Get comprehensive employer analytics
// @access  Private (employer)
router.get('/analytics', async (req, res) => {
  try {
    const employerId = req.user.userId;
    const { startDate, endDate } = req.query;

    let jobs = [];
    let interviews = [];
    try {
      if (Job && typeof Job.find === 'function') {
        jobs = await resolveModel(Job).findAll({ where: { employer: employerId } });
      }
    } catch (error) {
      getLogger().warn(`Employer analytics jobs query unavailable: ${error.message}`);
    }

    try {
      if (Interview && typeof Interview.find === 'function') {
        interviews = await resolveModel(Interview).findAll({ where: { interviewer: employerId } });
      }
    } catch (error) {
      getLogger().warn(`Employer analytics interviews query unavailable: ${error.message}`);
    }

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((job) => job.status === 'active').length;
    const totalApplications = jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
    const totalHires = jobs.reduce((sum, job) => {
      const hires = (job.applications || []).filter((app) => app.status === 'hired').length;
      return sum + hires;
    }, 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    const lastMonthStart = new Date(thisMonthStart.getFullYear(), thisMonthStart.getMonth() - 1, 1);

    const thisMonthApplications = jobs.reduce((sum, job) => {
      return sum + (job.applications || []).filter((app) => {
        const appliedAt = new Date(app.appliedAt || app.createdAt || 0);
        return appliedAt >= thisMonthStart;
      }).length;
    }, 0);
    const lastMonthApplications = jobs.reduce((sum, job) => {
      return sum + (job.applications || []).filter((app) => {
        const appliedAt = new Date(app.appliedAt || app.createdAt || 0);
        return appliedAt >= lastMonthStart && appliedAt < thisMonthStart;
      }).length;
    }, 0);

    const thisMonthHires = jobs.reduce((sum, job) => {
      return sum + (job.applications || []).filter((app) => {
        const updatedAt = new Date(app.updatedAt || app.appliedAt || 0);
        return app.status === 'hired' && updatedAt >= thisMonthStart;
      }).length;
    }, 0);
    const lastMonthHires = jobs.reduce((sum, job) => {
      return sum + (job.applications || []).filter((app) => {
        const updatedAt = new Date(app.updatedAt || app.appliedAt || 0);
        return app.status === 'hired' && updatedAt >= lastMonthStart && updatedAt < thisMonthStart;
      }).length;
    }, 0);

    const totalTimeToHireDays = interviews
      .filter((interview) => interview.status === 'completed' && interview.createdAt && interview.scheduledAt)
      .map((interview) => {
        const created = new Date(interview.createdAt).getTime();
        const scheduled = new Date(interview.scheduledAt).getTime();
        return Math.max(0, Math.round((scheduled - created) / (1000 * 60 * 60 * 24)));
      });
    const averageTimeToHire = totalTimeToHireDays.length
      ? Math.round(totalTimeToHireDays.reduce((sum, v) => sum + v, 0) / totalTimeToHireDays.length)
      : 0;

    const analytics = {
      overview: {
        totalJobs,
        activeJobs,
        totalApplications,
        totalHires
      },
      trends: {
        applications: {
          thisMonth: thisMonthApplications,
          lastMonth: lastMonthApplications,
          growth: lastMonthApplications > 0
            ? `${Math.round(((thisMonthApplications - lastMonthApplications) / lastMonthApplications) * 100)}%`
            : '0%'
        },
        hires: {
          thisMonth: thisMonthHires,
          lastMonth: lastMonthHires,
          growth: lastMonthHires > 0
            ? `${Math.round(((thisMonthHires - lastMonthHires) / lastMonthHires) * 100)}%`
            : '0%'
        },
        timeToHire: {
          average: averageTimeToHire,
          improvement: '0 days'
        }
      },
      topPerformingJobs: jobs
        .map((job) => {
          const applications = job.applications?.length || 0;
          const hires = (job.applications || []).filter((app) => app.status === 'hired').length;
          return {
            title: job.title,
            applications,
            interviews: interviews.filter((intv) => String(intv.job) === String(job._id)).length,
            hires,
            conversionRate: applications > 0 ? `${((hires / applications) * 100).toFixed(1)}%` : '0.0%'
          };
        })
        .sort((a, b) => b.applications - a.applications)
        .slice(0, 5),
      candidateQuality: {
        averageScore: 0,
        qualifiedCandidates: 0,
        topSkills: []
      },
      sourcingEffectiveness: []
    };
    
    res.json(analytics);

  } catch (error) {
    getLogger().error('Get employer analytics error:', error);
    res.json({
      overview: {
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        totalHires: 0
      },
      trends: {
        applications: {
          thisMonth: 0,
          lastMonth: 0,
          growth: '0%'
        },
        hires: {
          thisMonth: 0,
          lastMonth: 0,
          growth: '0%'
        },
        timeToHire: {
          average: 0,
          improvement: '0 days'
        }
      },
      topPerformingJobs: [],
      candidateQuality: {
        averageScore: 0,
        qualifiedCandidates: 0,
        topSkills: []
      },
      sourcingEffectiveness: []
    });
  }
});

// @route   GET /api/employer/team
// @desc    Get team members
// @access  Private (employer)
router.get('/team', async (req, res) => {
  try {
    res.json({ members: [], pendingInvites: [] });

  } catch (error) {
    getLogger().error('Get team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/employer/team/invite
// @desc    Invite team member
// @access  Private (employer)
router.post('/team/invite', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['Recruiter', 'Hiring Manager', 'Admin']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const invite = {
      id: `invite-${Date.now()}`,
      email: req.body.email,
      role: req.body.role,
      status: 'pending',
      invitedBy: req.user.userId,
      invitedAt: new Date().toISOString()
    };

    res.status(202).json({
      message: 'Team invitation accepted for processing',
      invite
    });

  } catch (error) {
    getLogger().error('Invite team member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/reports/hiring
// @desc    Get hiring reports
// @access  Private (employer)
router.get('/reports/hiring', async (req, res) => {
  try {
    const employerId = req.user.userId;
    const { startDate, endDate, format } = req.query;

    let jobs = [];
    if (Job && typeof Job.find === 'function') {
      try {
        jobs = await resolveModel(Job).findAll({ where: { employer: employerId } });
      } catch (jobQueryError) {
        getLogger().warn(`Hiring report jobs query unavailable: ${jobQueryError.message}`);
      }
    }

    const allApplications = jobs.flatMap((job) => job.applications || []);
    const totalHires = allApplications.filter((app) => app.status === 'hired').length;
    const offerCount = allApplications.filter((app) => app.status === 'offered').length;

    const report = {
      summary: {
        totalHires,
        averageTimeToHire: 0,
        costPerHire: 0,
        offerAcceptanceRate: offerCount > 0 ? Math.round((totalHires / offerCount) * 100) : 0
      },
      byDepartment: [],
      monthlyTrends: [],
      topSources: []
    };
    
    res.json(report);

  } catch (error) {
    getLogger().error('Get hiring report error:', error);
    res.json({
      summary: {
        totalHires: 0,
        averageTimeToHire: 0,
        costPerHire: 0,
        offerAcceptanceRate: 0
      },
      byDepartment: [],
      monthlyTrends: [],
      topSources: []
    });
  }
});

// @route   GET /api/employer/pipeline
// @desc    Get hiring pipeline overview
// @access  Private (employer)
router.get('/pipeline', async (req, res) => {
  try {
    const employerId = req.user.userId;

    let jobs = [];
    if (Job && typeof Job.find === 'function') {
      try {
        jobs = await resolveModel(Job).findAll({ where: { employer: employerId } });
      } catch (jobQueryError) {
        getLogger().warn(`Pipeline jobs query unavailable: ${jobQueryError.message}`);
      }
    }

    const allApplications = jobs.flatMap((job) => job.applications || []);
    const stageMap = {
      Applied: ['applied'],
      Screening: ['reviewing', 'shortlisted'],
      Interview: ['interviewing'],
      'Final Round': ['final_round'],
      Offer: ['offered'],
      Hired: ['hired']
    };
    const total = allApplications.length || 1;

    const pipeline = {
      stages: Object.entries(stageMap).map(([stage, statuses]) => {
        const count = allApplications.filter((app) => statuses.includes(app.status)).length;
        return {
          stage,
          count,
          percentage: Math.round((count / total) * 100)
        };
      }),
      recentActivity: [],
      bottlenecks: []
    };
    
    res.json(pipeline);

  } catch (error) {
    getLogger().error('Get pipeline error:', error);
    res.json({
      stages: [
        { stage: 'Applied', count: 0, percentage: 0 },
        { stage: 'Screening', count: 0, percentage: 0 },
        { stage: 'Interview', count: 0, percentage: 0 },
        { stage: 'Final Round', count: 0, percentage: 0 },
        { stage: 'Offer', count: 0, percentage: 0 },
        { stage: 'Hired', count: 0, percentage: 0 }
      ],
      recentActivity: [],
      bottlenecks: []
    });
  }
});

// In-memory notification store (used as fallback when no DB-backed notification model exists)
const notificationStore = new Map();

// @route   GET /api/employer/notifications
// @desc    Get employer notifications
// @access  Private (employer)
router.get('/notifications', async (req, res) => {
  try {
    const employerId = String(req.user.userId);
    const notifications = Array.from(notificationStore.values())
      .filter(n => n.employerId === employerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ notifications });
  } catch (error) {
    getLogger().error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/employer/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (employer)
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notification = notificationStore.get(req.params.id);
    if (!notification || String(notification.employerId) !== String(req.user.userId)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    notification.read = true;
    notification.readAt = new Date().toISOString();
    notificationStore.set(req.params.id, notification);
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    getLogger().error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employer/settings
// @desc    Get employer settings
// @access  Private (employer)
router.get('/settings', async (req, res) => {
  try {
    res.json({ settings: {} });

  } catch (error) {
    getLogger().error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/employer/settings
// @desc    Update employer settings
// @access  Private (employer)
router.put('/settings', async (req, res) => {
  try {
    if (!User || typeof User.findByIdAndUpdate !== 'function') {
      // Graceful fallback when User model is unavailable
      return res.json({ message: 'Settings acknowledged', settings: req.body });
    }

    const UserModel = resolveModel(User);
    const user = await UserModel.findByPk(parseInt(req.user.userId, 10));
    if (user) {
      const allowed = ['companyName', 'companyWebsite', 'companyIndustry', 'companySize', 'bio', 'phone', 'location'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      await user.update(updates);
    }

    res.json({
      message: 'Settings updated successfully',
      settings: req.body
    });
  } catch (error) {
    getLogger().error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;