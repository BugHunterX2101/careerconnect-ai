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
  if (typeof User.findById === 'function') {
    return User.findById(userId);
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

    if (typeof Interview.find === 'function') {
      const query = { candidate: userId };
      if (status) query.status = status;
      return Interview.find(query)
        .sort({ scheduledAt: -1 })
        .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
        .limit(parseInt(limit, 10));
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
    const job = await Job.findOne({ 'applications._id': id });
    if (!job) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const application = job.applications.id(id);
    if (!application || application.applicant.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to withdraw this application' });
    }
    
    // Check if application can be withdrawn
    if (['hired', 'rejected'].includes(application.status)) {
      return res.status(400).json({ error: 'Cannot withdraw completed application' });
    }
    
    // Remove the application
    job.applications.pull(id);
    await job.save();
    
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
    ).populate([
      { path: 'job', select: 'title company' },
      { path: 'interviewer', select: 'firstName lastName email' }
    ]);
    
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
    if (!User || !Job) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;
    
    const user = await User.findById(userId).populate({
      path: 'savedJobs',
      populate: {
        path: 'employer',
        select: 'firstName lastName company'
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const savedJobs = user.savedJobs || [];
    
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
        title: { $regex: jobTitle, $options: 'i' }
      };

      if (location) {
        query.$or = [
          { 'location.city': { $regex: location, $options: 'i' } },
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

// @route   GET /api/employee/notifications
// @desc    Get user notifications
// @access  Private (jobseeker)
router.get('/notifications', authenticateToken, authorizeRole('jobseeker'), async (req, res) => {
  try {
    res.json({ notifications: [] });

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
    res.status(404).json({ error: 'Notification not found' });

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
    const user = await User.findById(userId).select('settings');
    
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
    if (Job && typeof Job.find === 'function') {
      const jobs = await Job.find({ status: 'active' }).limit(200).select('requirements');
      const skillCounts = new Map();
      jobs.forEach((job) => {
        const skills = Array.isArray(job?.requirements?.skills) ? job.requirements.skills : [];
        skills.forEach((entry) => {
          const name = String(entry?.name || '').trim();
          if (!name) return;
          skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
        });
      });
      trending = Array.from(skillCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, growth: null, avgSalary: null, demand: count }));
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
    res.status(500).json({ error: 'Server error' });
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

    res.status(501).json({ error: 'Job alerts persistence is not implemented yet' });

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
    
    const user = await User.findByIdAndUpdate(
      userId,
      { settings },
      { new: true, runValidators: true }
    ).select('settings');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });

  } catch (error) {
    getLogger().error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
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