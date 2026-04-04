const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

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

// Helper: get a model's Sequelize instance safely
const resolveModel = (model) => {
  if (!model) throw new Error('Model not available');
  return typeof model === 'function' && !model.findAll ? model() : model;
};
let logger;
const getLogger = () => {
  if (!logger) {
    logger = require('../middleware/logger');
  }
  return logger;
};

const getUserById = async (userId) => {
  if (!User) return null;
  if (typeof User.findByPk === 'function') {
    return User.findByPk(userId);
  }
  if (typeof User.findByPk === 'function') {
    return User.findByPk(userId);
  }
  return null;
};

const getCandidateInterviews = async (userId, { page = 1, limit = 20, status } = {}) => {
  if (!Interview) return [];

  try {
    if (typeof Interview.findAll === 'function') {
      const where = { candidateId: userId };
      if (status) where.status = status;
      return Interview.findAll({
        where,
        limit: parseInt(limit, 10),
        offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        order: [['scheduledAt', 'DESC']]
      });
    }

    if (typeof Interview !== 'undefined' && Interview) {
      const query = { candidate: userId };
      if (status) query.status = status;
      return resolveModel(Interview).findAll({
        where: { candidateId: parseInt(userId, 10), ...(status ? { status } : {}) },
        order: [['scheduledAt', 'DESC']],
        offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        limit: parseInt(limit, 10)
      });
    }

    return [];
  } catch (error) {
    getLogger().warn(`Could not query candidate interviews: ${error.message}`);
    return [];
  }
};

const router = express.Router();

// Rate limiting
const employeeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting and authentication to all employee routes
router.use(employeeLimiter);
router.use(authenticateToken);
router.use(authorizeRole('jobseeker'));

// @route   GET /api/employee/dashboard/stats
// @desc    Get employee dashboard statistics
// @access  Private (jobseeker)
router.get('/dashboard/stats', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    // Get real data from database
    let stats = {
      totalApplications: 0,
      pendingApplications: 0,
      totalInterviews: 0,
      upcomingInterviews: 0,
      profileCompletion: 0,
      profileSuggestions: []
    };

    // Try to fetch from User model for profile completion
    if (User) {
      try {
        const user = await getUserById(userId);
        if (user) {
          let completion = 0;
          if (user.firstName && user.lastName) completion += 20;
          if (user.email) completion += 10;
          if (user.profile?.title) completion += 15;
          if (user.profile?.summary) completion += 15;
          if (user.profile?.skills?.length > 0) completion += 20;
          if (user.profile?.experience) completion += 10;
          if (user.profile?.education?.length > 0) completion += 10;
          
          stats.profileCompletion = completion;
          
          if (!user.profile?.title) stats.profileSuggestions.push('Add a professional title');
          if (!user.profile?.summary) stats.profileSuggestions.push('Write a professional summary');
          if (!user.profile?.skills || user.profile.skills.length < 3) stats.profileSuggestions.push('Add more skills');
        }
      } catch (dbError) {
        getLogger().warn('Could not fetch user profile:', dbError.message);
      }
    }

    // Try to fetch application/interview metrics from live interview records
    if (Interview) {
      try {
        const interviews = await getCandidateInterviews(userId, { page: 1, limit: 500 });
        const normalized = interviews || [];

        stats.totalApplications = normalized.length;
        stats.pendingApplications = normalized.filter((i) =>
          ['pending', 'applied', 'reviewed'].includes(i.status)
        ).length;
        stats.totalInterviews = interviews.length || 0;
        const now = new Date();
        stats.upcomingInterviews = (interviews || []).filter(i => 
          i.scheduledAt && new Date(i.scheduledAt) > now && ['scheduled', 'confirmed'].includes(i.status)
        ).length || 0;
      } catch (dbError) {
        getLogger().warn('Could not fetch interviews:', dbError.message);
      }
    }

    // Keep dashboard counters grounded in persisted data only.
    stats.profileViews = 0;
    stats.weeklyViews = 0;
    stats.jobMatches = 0;
    stats.newMatches = 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    getLogger().error('Get employee dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      data: {
        totalApplications: 0,
        pendingApplications: 0,
        totalInterviews: 0,
        upcomingInterviews: 0,
        profileCompletion: 0,
        profileSuggestions: [],
        profileViews: 0,
        weeklyViews: 0,
        jobMatches: 0,
        newMatches: 0
      }
    });
  }
});

// @route   GET /api/employee/applications
// @desc    Get user's job applications (real-time data)
// @access  Private (jobseeker)
router.get('/applications', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user?.userId || req.user?.id;
    
    let applications = [];

    // Try to fetch from Interview model (applications related data)
    if (Interview) {
      try {
        const interviews = await getCandidateInterviews(userId, { page, limit });

        applications = (interviews || []).map(interview => ({
          id: interview.id,
          job: {
            id: interview.jobId,
            title: interview.jobTitle || 'Job Position',
            company: interview.company || 'Company Name',
            location: interview.location || 'Location TBD'
          },
          status: interview.status || 'applied',
          appliedAt: interview.createdAt || new Date(),
          updatedAt: interview.updatedAt || new Date(),
          interviewType: interview.type
        }));
      } catch (dbError) {
        getLogger().warn('Could not fetch applications from database:', dbError.message);
      }
    }

    // Filter by status if provided
    let filtered = applications;
    if (status) {
      filtered = applications.filter(app => app.status === status);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
    res.json({
      success: true,
      data: {
        applications: filtered,
        total: applications.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(applications.length / parseInt(limit))
      }
    });

  } catch (error) {
    getLogger().error('Get employee applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applications',
      data: {
        applications: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    });
  }
});

// @route   GET /api/employee/applications/:id
// @desc    Get a single application by ID
// @access  Private (jobseeker)
router.get('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;

    let application = null;

    if (Interview) {
      try {
        const interviews = await getCandidateInterviews(userId, { page: 1, limit: 500 });
        const match = (interviews || []).find(
          (i) => String(i.id || i._id) === String(id)
        );
        if (match) {
          application = {
            id: match.id || match._id,
            job: {
              id: match.jobId,
              title: match.jobTitle || 'Job Position',
              company: match.company || 'Company Name',
              location: match.location || 'Location TBD'
            },
            status: match.status || 'applied',
            appliedAt: match.createdAt || new Date(),
            updatedAt: match.updatedAt || new Date(),
            interviewType: match.type
          };
        }
      } catch (dbError) {
        getLogger().warn('Could not fetch application by ID:', dbError.message);
      }
    }

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    res.json({ success: true, data: { application } });
  } catch (error) {
    getLogger().error('Get application by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch application' });
  }
});

// @route   DELETE /api/employee/applications/:id
// @desc    Withdraw job application
// @access  Private (jobseeker)
router.delete('/applications/:id', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { id } = req.params;
    const userId = req.user.userId;
    
    // Find the job with this application
    // Applications stored as JSON in job.applications — find by scanning
    const allJobs = await resolveModel(Job).findAll();
    const job = allJobs.find(j => (j.applications || []).some(a => String(a.id || a._id) === String(id)));
    if (!job) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = job.applications.id(id);
    if (!application || String(application.applicant) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to withdraw this application' });
    }
    
    // Check if application can be withdrawn
    if (['hired', 'rejected'].includes(application.status)) {
      return res.status(400).json({ error: 'Cannot withdraw completed application' });
    }
    
    // Remove the application
    job.applications.pull(id);
    await job.update({ applications: job.applications });
    
    res.json({ message: 'Application withdrawn successfully' });

  } catch (error) {
    getLogger().error('Withdraw application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/interviews
// @desc    Get user's interviews (real-time data)
// @access  Private (jobseeker)
router.get('/interviews', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user?.userId || req.user?.id;
    
    let interviews = [];

    // Try to fetch from Interview model
    if (Interview) {
      try {
        const query = { candidateId: userId };
        if (status) {
          query.status = status;
        }

        const dbInterviews = await getCandidateInterviews(userId, { page, limit, status });

        interviews = (dbInterviews || []).map(interview => ({
          id: interview.id,
          job: {
            id: interview.jobId,
            title: interview.jobTitle || 'Interview Position',
            company: interview.company || 'Company'
          },
          interviewer: {
            name: interview.interviewerName || 'Interviewer',
            email: interview.interviewerEmail
          },
          status: interview.status || 'scheduled',
          scheduledAt: interview.scheduledAt,
          type: interview.type || 'technical',
          duration: interview.duration || 60,
          feedback: interview.feedback,
          notes: interview.notes
        }));
      } catch (dbError) {
        getLogger().warn('Could not fetch interviews from database:', dbError.message);
      }
    }

    // Apply status filter if needed
    let filtered = interviews;
    if (status) {
      filtered = interviews.filter(interview => interview.status === status);
    }
    
    // Sort by scheduled date (upcoming first, then completed)
    filtered.sort((a, b) => {
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
      if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
      return new Date(b.scheduledAt) - new Date(a.scheduledAt);
    });
    
    res.json({
      success: true,
      data: {
        interviews: filtered,
        total: interviews.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(interviews.length / parseInt(limit))
      }
    });

  } catch (error) {
    getLogger().error('Get employee interviews error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch interviews',
      data: {
        interviews: [],
        total: 0,
        page: 1,
        totalPages: 0
      }
    });
  }
});

// @route   PATCH /api/employee/interviews/:id
// @desc    Update interview status (confirm/decline)
// @access  Private (jobseeker)
router.patch('/interviews/:id', async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    
    // Validate status
    const allowedStatuses = ['confirmed', 'declined'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const interview = await Interview.findOneAndUpdate(
      { _id: id, candidate: userId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    res.json({
      message: `Interview ${status} successfully`,
      interview
    });

  } catch (error) {
    getLogger().error('Update interview status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/saved-jobs
// @desc    Get user's saved jobs
// @access  Private (jobseeker)
router.get('/saved-jobs', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.userId || req.user?.id;

    const user = await getUserById(userId);
    
    if (!user) {
      return res.json({ jobs: [], total: 0, page: parseInt(page, 10), totalPages: 0 });
    }

    const savedJobs = Array.isArray(user.savedJobs) ? user.savedJobs : [];
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedJobs = savedJobs.slice(skip, skip + parseInt(limit));
    
    res.json({
      jobs: paginatedJobs,
      total: savedJobs.length,
      page: parseInt(page),
      totalPages: Math.ceil(savedJobs.length / limit)
    });

  } catch (error) {
    getLogger().error('Get saved jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/career-insights
// @desc    Get career insights and recommendations
// @access  Private (jobseeker)
router.get('/career-insights', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userSkills = Array.isArray(user.skills) ? user.skills : [];
    const insights = {
      skillsInDemand: userSkills.map((skill) => ({ skill, demand: null, growth: null })),
      salaryTrends: {
        currentRole: user.profile?.title || user.role || 'jobseeker',
        averageSalary: null,
        salaryRange: null,
        growth: null
      },
      marketDemand: {
        jobOpenings: 0,
        competitionLevel: null,
        hiringTrend: null
      },
      recommendations: []
    };
    
    res.json(insights);

  } catch (error) {
    getLogger().error('Get career insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/salary-insights
// @desc    Get salary insights for specific job title and location
// @access  Private (jobseeker)
router.get('/salary-insights', async (req, res) => {
  try {
    const { jobTitle, location } = req.query;
    
    if (!jobTitle) {
      return res.status(400).json({ error: 'Job title is required' });
    }
    
    let jobs = [];
    if (Job && typeof Job.find === 'function') {
      const query = {
        title: { [Op.like]: `%${jobTitle}%` }
      };

      if (location) {
        query.$or = [
          { locationCity: { [Op.like]: `%${location}%` } },
          { 'location.state': { $regex: location, $options: 'i' } },
          { 'location.country': { $regex: location, $options: 'i' } }
        ];
      }

      jobs = await Job.find(query).limit(200);
    }

    const salaryValues = jobs
      .map((job) => [job?.benefits?.salary?.min, job?.benefits?.salary?.max])
      .flat()
      .filter((value) => Number.isFinite(value));

    const minSalary = salaryValues.length ? Math.min(...salaryValues) : null;
    const maxSalary = salaryValues.length ? Math.max(...salaryValues) : null;
    const avgSalary = salaryValues.length
      ? Math.round(salaryValues.reduce((sum, value) => sum + value, 0) / salaryValues.length)
      : null;

    const salaryInsights = {
      jobTitle,
      location: location || 'National Average',
      averageSalary: avgSalary === null ? null : `$${avgSalary.toLocaleString()}`,
      salaryRange: {
        min: minSalary === null ? null : `$${minSalary.toLocaleString()}`,
        max: maxSalary === null ? null : `$${maxSalary.toLocaleString()}`
      },
      experienceLevels: [],
      topCompanies: []
    };
    
    res.json(salaryInsights);

  } catch (error) {
    getLogger().error('Get salary insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// In-memory employee notification store (mirrors employer implementation)
const employeeNotificationStore = new Map();

// @route   GET /api/employee/notifications
// @desc    Get user notifications
// @access  Private (jobseeker)
router.get('/notifications', async (req, res) => {
  try {
    const userId = String(req.user?.userId || req.user?.id);
    const notifications = Array.from(employeeNotificationStore.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ notifications });
  } catch (error) {
    getLogger().error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/employee/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (jobseeker)
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notification = employeeNotificationStore.get(req.params.id);
    const userId = String(req.user?.userId || req.user?.id);
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    notification.read = true;
    notification.readAt = new Date().toISOString();
    employeeNotificationStore.set(req.params.id, notification);
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    getLogger().error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/settings
// @desc    Get user settings
// @access  Private (jobseeker)
router.get('/settings', async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const userId = req.user.userId;
    let UserModel = null;
    try {
      UserModel = typeof User.findByPk === 'function' ? User : (typeof User.User === 'function' ? User.User() : null);
    } catch (_) {}

    const user = UserModel ? await UserModel.findByPk(userId) : null;
    
    const defaultSettings = {
      emailNotifications: {
        jobMatches: true,
        applicationUpdates: true,
        interviewReminders: true,
        weeklyDigest: false
      },
      privacy: {
        profileVisibility: 'public',
        showSalaryExpectations: false,
        allowRecruiterContact: true
      },
      jobPreferences: {
        jobTypes: ['full-time'],
        remoteWork: false,
        willingToRelocate: false,
        salaryRange: { min: 0, max: 200000 }
      }
    };
    
    const settings = user?.settings || defaultSettings;
    
    res.json({ settings });

  } catch (error) {
    getLogger().error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/analytics
// @desc    Get employee analytics and insights
// @access  Private (jobseeker)
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.userId;

    const allInterviews = await getCandidateInterviews(userId, { page: 1, limit: 1000 });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfPreviousWeek = new Date(now);
    startOfPreviousWeek.setDate(now.getDate() - 14);

    const thisMonthInterviews = allInterviews.filter((i) => new Date(i.createdAt || i.scheduledAt || now) >= startOfMonth).length;
    const lastMonthInterviews = allInterviews.filter((i) => {
      const timestamp = new Date(i.createdAt || i.scheduledAt || now);
      return timestamp >= startOfLastMonth && timestamp < startOfMonth;
    }).length;

    const completedInterviews = allInterviews.filter((i) => i.status === 'completed').length;
    const scheduledInterviews = allInterviews.filter((i) => ['scheduled', 'confirmed'].includes(i.status)).length;
    const responseRate = allInterviews.length
      ? Math.round(((completedInterviews + scheduledInterviews) / allInterviews.length) * 100)
      : 0;

    const analytics = {
      applicationTrends: {
        thisMonth: thisMonthInterviews,
        lastMonth: lastMonthInterviews,
        growth: lastMonthInterviews > 0
          ? `${Math.round(((thisMonthInterviews - lastMonthInterviews) / lastMonthInterviews) * 100)}%`
          : '0%'
      },
      interviewConversion: {
        rate: responseRate,
        total: completedInterviews
      },
      profileViews: {
        thisWeek: allInterviews.filter((i) => new Date(i.updatedAt || i.createdAt || now) >= startOfWeek).length,
        lastWeek: allInterviews.filter((i) => {
          const timestamp = new Date(i.updatedAt || i.createdAt || now);
          return timestamp >= startOfPreviousWeek && timestamp < startOfWeek;
        }).length,
        growth: '0%'
      },
      skillsInDemand: [],
      applicationSuccess: {
        responseRate,
        interviewRate: allInterviews.length ? Math.round((completedInterviews / allInterviews.length) * 100) : 0
      }
    };
    
    res.json(analytics);

  } catch (error) {
    getLogger().error('Get employee analytics error:', error);
    res.json({
      applicationTrends: {
        thisMonth: 0,
        lastMonth: 0,
        growth: '0%'
      },
      interviewConversion: {
        rate: 0,
        total: 0
      },
      profileViews: {
        thisWeek: 0,
        lastWeek: 0,
        growth: '0%'
      },
      skillsInDemand: [],
      applicationSuccess: {
        responseRate: 0,
        interviewRate: 0
      }
    });
  }
});

// @route   GET /api/employee/skill-recommendations
// @desc    Get AI-powered skill recommendations
// @access  Private (jobseeker)
router.get('/skill-recommendations', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await getUserById(userId);
    const currentSkills = new Set(Array.isArray(user?.skills) ? user.skills.map((s) => String(s).toLowerCase()) : []);

    let trending = [];
    if (Job) {
      try {
        let jobs = [];
        if (typeof Job.findAll === 'function') {
          jobs = await Job.findAll({ where: { status: 'active' }, limit: 200 });
        } else if (typeof Job.find === 'function') {
          const jobQuery = Job.find({ status: 'active' });
          if (jobQuery && typeof jobQuery.limit === 'function' && typeof jobQuery.select === 'function') {
            jobs = await jobQuery.limit(200).select('requirements requiredSkills');
          } else {
            jobs = await jobQuery;
          }
        }

        const skillCounts = new Map();
        (jobs || []).forEach((job) => {
          const skillsFromRequirements = Array.isArray(job?.requirements?.skills)
            ? job.requirements.skills.map((entry) => entry?.name)
            : [];
          const skillsFromRequired = Array.isArray(job?.requiredSkills) ? job.requiredSkills : [];
          [...skillsFromRequirements, ...skillsFromRequired].forEach((skill) => {
            const name = String(skill || '').trim();
            if (!name) return;
            skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
          });
        });

        trending = Array.from(skillCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([skill, count]) => ({ skill, growth: null, avgSalary: null, demand: count }));
      } catch (jobQueryError) {
        getLogger().warn(`Skill recommendations jobs query unavailable: ${jobQueryError.message}`);
      }
    }

    const recommendations = {
      trending,
      personalized: trending
        .filter((item) => !currentSkills.has(String(item.skill).toLowerCase()))
        .slice(0, 5)
        .map((item) => ({
          skill: item.skill,
          reason: 'Frequently required in active jobs',
          timeToLearn: null
        })),
      learningPaths: []
    };
    
    res.json(recommendations);

  } catch (error) {
    getLogger().error('Get skill recommendations error:', error);
    res.json({
      trending: [],
      personalized: [],
      learningPaths: []
    });
  }
});

// @route   GET /api/employee/job-alerts
// @desc    Get job alerts and saved searches
// @access  Private (jobseeker)
router.get('/job-alerts', async (req, res) => {
  try {
    res.json({ active: [], recentMatches: [] });

  } catch (error) {
    getLogger().error('Get job alerts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/employee/job-alerts
// @desc    Create new job alert
// @access  Private (jobseeker)
router.post('/job-alerts', [
  body('title').trim().isLength({ min: 1 }).withMessage('Alert title is required'),
  body('criteria').isObject().withMessage('Search criteria is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const alert = {
      id: `alert-${Date.now()}`,
      title: req.body.title,
      criteria: req.body.criteria,
      frequency: req.body.frequency || 'daily',
      active: true,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      message: 'Job alert created successfully',
      alert
    });

  } catch (error) {
    getLogger().error('Create job alert error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/employee/settings
// @desc    Update user settings
// @access  Private (jobseeker)
router.put('/settings', async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const userId = req.user.userId;
    const { settings } = req.body;

    let UserModel = null;
    try {
      UserModel = typeof User.findByPk === 'function' ? User : (typeof User.User === 'function' ? User.User() : null);
    } catch (_) {}

    if (!UserModel) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await UserModel.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ preferences: settings });

    res.json({
      message: 'Settings updated successfully',
      settings: user.preferences || settings
    });

  } catch (error) {
    getLogger().error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/job-recommendations
// @desc    Get AI-powered job recommendations for the logged-in jobseeker
// @access  Private (jobseeker)
router.get('/job-recommendations', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const userId = req.user?.userId || req.user?.id;

    let recommendations = [];

    if (Job) {
      try {
        const user = await getUserById(userId);
        const userSkills = Array.isArray(user?.skills)
          ? user.skills.map((s) => String(s).toLowerCase())
          : [];

        let jobs = [];
        if (typeof Job.find === 'function') {
          jobs = await Job.find({ status: 'active' })
            .limit(200)
            .select('title company location employmentType benefits requirements requiredSkills _id');
        } else if (typeof Job.findAll === 'function') {
          jobs = await Job.findAll({ where: { status: 'active' }, limit: 200 });
        }

        recommendations = (jobs || [])
          .map((job) => {
            const jobSkills = [
              ...(Array.isArray(job?.requirements?.skills) ? job.requirements.skills.map((s) => String(s?.name || s).toLowerCase()) : []),
              ...(Array.isArray(job?.requiredSkills) ? job.requiredSkills.map((s) => String(s).toLowerCase()) : [])
            ];
            const matchCount = userSkills.filter((skill) =>
              jobSkills.some((js) => js.includes(skill) || skill.includes(js))
            ).length;
            const matchScore = jobSkills.length > 0
              ? Math.round((matchCount / jobSkills.length) * 100)
              : 0;
            return { job, matchScore };
          })
          .filter(({ matchScore }) => matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, parseInt(limit, 10))
          .map(({ job, matchScore }) => ({
            id: job._id || job.id,
            title: job.title,
            company: job.company?.name || job.company,
            location: job.location?.city || job.location,
            type: job.employmentType || job.type,
            salary: job.benefits?.salary || job.salary,
            matchScore
          }));
      } catch (dbError) {
        getLogger().warn('Could not fetch job recommendations:', dbError.message);
      }
    }

    res.json({
      success: true,
      data: {
        recommendations,
        total: recommendations.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    });
  } catch (error) {
    getLogger().error('Get job recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job recommendations',
      data: { recommendations: [], total: 0 }
    });
  }
});

// @route   GET /api/employee/resume-insights
// @desc    Get resume analysis and improvement suggestions
// @access  Private (jobseeker)
router.get('/resume-insights', async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await getUserById(userId);
    const userSkills = Array.isArray(user?.skills) ? user.skills : [];

    const insights = {
      score: 0,
      strengths: [],
      improvements: [],
      atsCompatibility: {
        score: 0,
        issues: []
      },
      keywordAnalysis: {
        missing: [],
        present: userSkills,
        suggestions: []
      },
      industryComparison: {
        averageScore: 0,
        yourScore: 0,
        percentile: 0
      }
    };
    
    res.json(insights);

  } catch (error) {
    getLogger().error('Get resume insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;