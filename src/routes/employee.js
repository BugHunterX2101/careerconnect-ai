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
    if (!Job || !User || !Interview) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const userId = req.user.userId;
    
    // Get user's applications
    const jobs = await Job.find({ 'applications.applicant': userId });
    const userApplications = [];
    jobs.forEach(job => {
      const userApp = job.applications.find(app => app.applicant.toString() === userId);
      if (userApp) {
        userApplications.push({ ...userApp.toObject(), job: job });
      }
    });
    
    const totalApplications = userApplications.length;
    const pendingApplications = userApplications.filter(app => app.status === 'pending').length;
    
    // Get user's interviews
    const interviews = await Interview.find({ candidate: userId });
    const totalInterviews = interviews.length;
    const upcomingInterviews = interviews.filter(interview => 
      new Date(interview.scheduledAt) > new Date() && 
      ['scheduled', 'confirmed'].includes(interview.status)
    ).length;
    
    // Get profile completion and views (mock data)
    const user = await User.findById(userId);
    let profileCompletion = 0;
    const profileSuggestions = [];
    
    if (user) {
      if (user.firstName && user.lastName) profileCompletion += 20;
      if (user.email) profileCompletion += 10;
      if (user.profile?.title) profileCompletion += 15;
      if (user.profile?.summary) profileCompletion += 15;
      if (user.profile?.skills?.length > 0) profileCompletion += 20;
      if (user.profile?.experience) profileCompletion += 10;
      if (user.profile?.education?.length > 0) profileCompletion += 10;
      
      if (!user.profile?.title) profileSuggestions.push('Add a professional title');
      if (!user.profile?.summary) profileSuggestions.push('Write a professional summary');
      if (!user.profile?.skills || user.profile.skills.length < 3) profileSuggestions.push('Add more skills');
    }
    
    // Mock additional stats
    const profileViews = Math.floor(Math.random() * 100) + 20;
    const weeklyViews = Math.floor(Math.random() * 20) + 5;
    const jobMatches = Math.floor(Math.random() * 50) + 10;
    const newMatches = Math.floor(Math.random() * 10) + 2;

    res.json({
      totalApplications,
      pendingApplications,
      totalInterviews,
      upcomingInterviews,
      profileViews,
      weeklyViews,
      jobMatches,
      newMatches,
      profileCompletion,
      profileSuggestions
    });

  } catch (error) {
    getLogger().error('Get employee dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/applications
// @desc    Get user's job applications
// @access  Private (jobseeker)
router.get('/applications', async (req, res) => {
  try {
    if (!Job) {
      return res.status(503).json({ error: 'Job model not available' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user.userId;
    
    // Find jobs where user has applied
    const jobs = await Job.find({ 'applications.applicant': userId })
      .populate('employer', 'firstName lastName company');
    
    let applications = [];
    jobs.forEach(job => {
      const userApp = job.applications.find(app => app.applicant.toString() === userId);
      if (userApp) {
        applications.push({
          _id: userApp._id,
          job: {
            _id: job._id,
            title: job.title,
            company: job.company,
            location: job.location,
            employer: job.employer
          },
          status: userApp.status,
          appliedAt: userApp.appliedAt,
          coverLetter: userApp.coverLetter,
          notes: userApp.notes,
          updatedAt: userApp.updatedAt
        });
      }
    });
    
    // Filter by status if provided
    if (status) {
      applications = applications.filter(app => app.status === status);
    }
    
    // Sort by application date (newest first)
    applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
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
    getLogger().error('Get employee applications error:', error);
    res.status(500).json({ error: 'Server error' });
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
// @desc    Get user's interviews
// @access  Private (jobseeker)
router.get('/interviews', async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { page = 1, limit = 20, status } = req.query;
    const userId = req.user.userId;
    
    const query = { candidate: userId };
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const interviews = await Interview.find(query)
      .populate('job', 'title company')
      .populate('interviewer', 'firstName lastName email')
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
    getLogger().error('Get employee interviews error:', error);
    res.status(500).json({ error: 'Server error' });
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
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Mock career insights data
    const insights = {
      skillsInDemand: [
        { skill: 'React', demand: 85, growth: '+12%' },
        { skill: 'Node.js', demand: 78, growth: '+8%' },
        { skill: 'Python', demand: 92, growth: '+15%' },
        { skill: 'AWS', demand: 88, growth: '+20%' }
      ],
      salaryTrends: {
        currentRole: user.profile?.title || 'Software Developer',
        averageSalary: '$85,000',
        salaryRange: '$65,000 - $120,000',
        growth: '+5.2% from last year'
      },
      marketDemand: {
        jobOpenings: 1250,
        competitionLevel: 'Medium',
        hiringTrend: 'Increasing'
      },
      recommendations: [
        'Consider learning cloud technologies like AWS or Azure',
        'Update your LinkedIn profile with recent projects',
        'Add certifications to boost your profile strength'
      ]
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
    
    // Mock salary insights data
    const salaryInsights = {
      jobTitle,
      location: location || 'National Average',
      averageSalary: '$' + (Math.floor(Math.random() * 50000) + 60000).toLocaleString(),
      salaryRange: {
        min: '$' + (Math.floor(Math.random() * 20000) + 50000).toLocaleString(),
        max: '$' + (Math.floor(Math.random() * 40000) + 100000).toLocaleString()
      },
      experienceLevels: [
        { level: 'Entry Level', salary: '$55,000 - $70,000' },
        { level: 'Mid Level', salary: '$70,000 - $95,000' },
        { level: 'Senior Level', salary: '$95,000 - $130,000' }
      ],
      topCompanies: [
        { company: 'Google', salary: '$120,000' },
        { company: 'Microsoft', salary: '$115,000' },
        { company: 'Amazon', salary: '$110,000' }
      ]
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
    // Mock notifications data
    const notifications = [
      {
        id: 1,
        title: 'New Job Match',
        message: 'We found 3 new jobs matching your profile',
        type: 'job_match',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 2,
        title: 'Interview Reminder',
        message: 'You have an interview tomorrow at 2:00 PM',
        type: 'interview',
        read: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        id: 3,
        title: 'Application Update',
        message: 'Your application for Frontend Developer has been reviewed',
        type: 'application',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];
    
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
    const { id } = req.params;
    
    // Mock response - in real implementation, update notification in database
    res.json({ message: 'Notification marked as read' });

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
    
    // Mock analytics data
    const analytics = {
      applicationTrends: {
        thisMonth: Math.floor(Math.random() * 15) + 5,
        lastMonth: Math.floor(Math.random() * 12) + 3,
        growth: '+25%'
      },
      interviewConversion: {
        rate: Math.floor(Math.random() * 30) + 15,
        total: Math.floor(Math.random() * 8) + 2
      },
      profileViews: {
        thisWeek: Math.floor(Math.random() * 50) + 20,
        lastWeek: Math.floor(Math.random() * 40) + 15,
        growth: '+12%'
      },
      skillsInDemand: [
        { skill: 'React', demand: 95, jobs: 1250 },
        { skill: 'Node.js', demand: 88, jobs: 980 },
        { skill: 'Python', demand: 92, jobs: 1100 },
        { skill: 'AWS', demand: 85, jobs: 850 }
      ],
      applicationSuccess: {
        responseRate: Math.floor(Math.random() * 40) + 30,
        interviewRate: Math.floor(Math.random() * 20) + 10
      }
    };
    
    res.json(analytics);

  } catch (error) {
    getLogger().error('Get employee analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/employee/skill-recommendations
// @desc    Get AI-powered skill recommendations
// @access  Private (jobseeker)
router.get('/skill-recommendations', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Mock skill recommendations
    const recommendations = {
      trending: [
        { skill: 'TypeScript', growth: '+45%', avgSalary: '$95k', demand: 'High' },
        { skill: 'Docker', growth: '+38%', avgSalary: '$88k', demand: 'High' },
        { skill: 'GraphQL', growth: '+42%', avgSalary: '$92k', demand: 'Medium' },
        { skill: 'Kubernetes', growth: '+35%', avgSalary: '$105k', demand: 'High' }
      ],
      personalized: [
        { skill: 'Next.js', reason: 'Complements your React skills', timeToLearn: '2-3 months' },
        { skill: 'MongoDB', reason: 'Popular with Node.js developers', timeToLearn: '1-2 months' },
        { skill: 'Jest', reason: 'Essential for testing', timeToLearn: '2-4 weeks' }
      ],
      learningPaths: [
        {
          title: 'Full Stack JavaScript Developer',
          skills: ['React', 'Node.js', 'MongoDB', 'Express'],
          duration: '4-6 months',
          salaryIncrease: '$15k-25k'
        },
        {
          title: 'Cloud Developer',
          skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
          duration: '3-5 months',
          salaryIncrease: '$20k-30k'
        }
      ]
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
    const userId = req.user.userId;
    
    // Mock job alerts
    const alerts = {
      active: [
        {
          id: 1,
          title: 'React Developer in San Francisco',
          criteria: { keywords: 'React', location: 'San Francisco', salary: '80k+' },
          frequency: 'daily',
          newJobs: 5,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          title: 'Remote Full Stack Jobs',
          criteria: { keywords: 'Full Stack', remote: true, salary: '70k+' },
          frequency: 'weekly',
          newJobs: 12,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      ],
      recentMatches: [
        {
          jobTitle: 'Senior React Developer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          salary: '$120k-150k',
          matchScore: 92,
          postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          jobTitle: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'Remote',
          salary: '$90k-120k',
          matchScore: 88,
          postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ]
    };
    
    res.json(alerts);

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

    const { title, criteria, frequency = 'daily' } = req.body;
    
    // Mock response
    const alert = {
      id: Date.now(),
      title,
      criteria,
      frequency,
      newJobs: 0,
      createdAt: new Date()
    };
    
    res.status(201).json({ message: 'Job alert created successfully', alert });

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
    
    // Mock resume insights
    const insights = {
      score: Math.floor(Math.random() * 30) + 70,
      strengths: [
        'Strong technical skills section',
        'Relevant work experience',
        'Clear formatting and structure'
      ],
      improvements: [
        'Add more quantified achievements',
        'Include relevant keywords for ATS',
        'Add a professional summary'
      ],
      atsCompatibility: {
        score: Math.floor(Math.random() * 20) + 80,
        issues: [
          'Use standard section headings',
          'Avoid complex formatting'
        ]
      },
      keywordAnalysis: {
        missing: ['React', 'Node.js', 'AWS'],
        present: ['JavaScript', 'HTML', 'CSS'],
        suggestions: [
          'Add "React" to skills section',
          'Mention "Node.js" in project descriptions'
        ]
      },
      industryComparison: {
        averageScore: 75,
        yourScore: 82,
        percentile: 78
      }
    };
    
    res.json(insights);

  } catch (error) {
    getLogger().error('Get resume insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;