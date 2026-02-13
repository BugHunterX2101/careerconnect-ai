const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
let logger;
const getLogger = () => {
  if (!logger) {
    logger = require('../middleware/logger');
  }
  return logger;
};
const path = require('path');
const fs = require('fs');

// Try to import User model (optional)
let User = null;
try {
  const { User: getUserModel } = require('../models/User');
  User = getUserModel;
} catch (error) {
  console.warn('User model not available:', error.message);
}

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Rate limiting
// Rate limiting
const profileUpdateLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many profile update requests, please try again later.',
});
// Validation middleware
const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('website').optional().trim().isURL().withMessage('Invalid website URL'),
  body('linkedin').optional().trim().isURL().withMessage('Invalid LinkedIn URL'),
  body('github').optional().trim().isURL().withMessage('Invalid GitHub URL'),
];

const validateSkills = [
  body('skills').isArray().withMessage('Skills must be an array'),
  body('skills.*').trim().isLength({ min: 1, max: 50 }).withMessage('Each skill must be between 1 and 50 characters'),
];

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: user.toJSON() });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/profile/activities
// @desc    Get recent activities for dashboard
// @access  Private
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    // Mock activities for now; can be replaced with real tables
    const activities = [
      {
        id: 1,
        type: 'resume_upload',
        title: 'Resume uploaded successfully',
        description: 'Your resume was processed with AI analysis',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      },
      {
        id: 2,
    type: 'job_application',
    title: 'Application submitted',
    description: 'Applied for Software Engineer at Tech Corp',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
      }
    ];
    res.json({ activities });
  } catch (error) {
    logger.error('Get activities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', authenticateToken, csrfProtection, profileUpdateLimiter, validateProfileUpdate, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName, lastName, phone, location, bio, website,
      linkedin, github, timezone, language, notifications
    } = req.body;

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build updates respecting model shapes
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (location) updates.location = location; // expects object; setter will JSON.stringify
    if (bio) updates.bio = bio;

    // Social links are nested in socialLinks JSON column
    if (website || linkedin || github) {
      const currentLinks = user.socialLinks || {};
      updates.socialLinks = {
        ...currentLinks,
        portfolio: website !== undefined ? website : currentLinks.portfolio,
        linkedin: linkedin !== undefined ? linkedin : currentLinks.linkedin,
        github: github !== undefined ? github : currentLinks.github,
      };
    }

    // Preferences optional fields
    if (timezone || language || notifications) {
      const currentPrefs = user.preferences || {};
      updates.preferences = {
        ...currentPrefs,
        timezone: timezone !== undefined ? timezone : currentPrefs.timezone,
        language: language !== undefined ? language : currentPrefs.language,
        notifications: notifications !== undefined ? notifications : currentPrefs.notifications,
      };
    }

    await user.update(updates);

    res.json({
      message: 'Profile updated successfully',
      profile: user.toJSON()
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/profile/avatar
// @desc    Upload profile avatar
// @access  Private
router.post('/avatar', authenticateToken, upload.single('avatar'), csrfProtection, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Avatar file is required' });
    }

    // Verify authenticated user matches target user
    if (req.body.userId && req.body.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to modify other user\'s avatar' });
    }

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save file to disk and store path in database
    const fileName = `avatar-${user.id}-${Date.now()}${path.extname(req.file.originalname)}`;
    const filePath = path.join(__dirname, '../uploads/avatars', fileName);
    
    // Ensure uploads directory is outside public access
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, req.file.buffer);
    
    // Store full path for internal use
    const avatarPath = filePath;
    // Store relative path or identifier for database
    const avatarId = `${user.id}/${fileName}`;
    await user.update({ profilePicture: avatarId });

    res.json({
      message: 'Avatar uploaded successfully',
      avatarId
    });

  } catch (error) {
    logger.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/profile/avatar/:userId
// @desc    Get user avatar
// @access  Private
router.get('/avatar/:userId', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User().findByPk(req.params.userId);
    if (!user || !user.profilePicture) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    // Redirect to data URL or simply return it
    res.json({ avatarUrl: user.profilePicture });

  } catch (error) {
    logger.error('Get avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/profile/avatar
// @desc    Remove profile avatar
// @access  Private
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ profilePicture: null });

    res.json({ message: 'Avatar removed successfully' });

  } catch (error) {
    logger.error('Remove avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile/skills
// @desc    Update user skills
// @access  Private
router.put('/skills', authenticateToken, csrfProtection, validateSkills, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skills } = req.body;

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ skills });

    res.json({
      message: 'Skills updated successfully',
      skills: user.skills || []
    });

  } catch (error) {
    logger.error('Update skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile/experience
// @desc    Update user experience
// @access  Private
router.put('/experience', authenticateToken, csrfProtection, async (req, res) => {
  // Verify token payload matches the user making the request
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Verify if the user has permission to update experience
  if (!req.user.role || !['user', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized to update experience information' });
  }

  // Additional check to ensure user can only modify their own experience
  if (req.body.userId && req.body.userId !== req.user.userId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to modify other user\'s experience' });
  }

  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const { experience } = req.body;

    if (!Array.isArray(experience)) {
      return res.status(400).json({ error: 'Experience must be an array' });
    }

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ experience });

    res.json({
      message: 'Experience updated successfully',
      experience: user.experience || []
    });

  } catch (error) {
    logger.error('Update experience error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Validation middleware for education
const validateEducation = [
  body('education').isArray().withMessage('Education must be an array'),
  body('education.*.institution').trim().isLength({ min: 1, max: 100 }).withMessage('Institution name is required'),
  body('education.*.degree').trim().isLength({ min: 1, max: 100 }).withMessage('Degree is required'),
  body('education.*.fieldOfStudy').trim().isLength({ min: 1, max: 100 }).withMessage('Field of study is required'),
  body('education.*.startDate').isISO8601().withMessage('Invalid start date'),
  body('education.*.endDate').optional({ nullable: true }).isISO8601().withMessage('Invalid end date')
];

/**
 * @route   PUT /api/profile/education
 * @desc    Update user education history
 * @access  Private
 * @param   {Array} education - Array of education entries
 * @returns {Object} Message and updated education array
 */
router.put('/education', 
  authenticateToken, 
  csrfProtection, 
  validateEducation,
  async (req, res) => {
    // Verify token payload matches the user making the request
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      if (!User) {
        return res.status(503).json({ error: 'User model not available' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { education } = req.body;

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ education });

    res.json({
      message: 'Education updated successfully',
      education: user.education || []
    });

  } catch (error) {
    logger.error('Update education error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const {
      jobAlerts, emailNotifications, pushNotifications,
      privacySettings, theme, language
    } = req.body;

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPrefs = user.preferences || {};
    const updatedPrefs = {
      ...currentPrefs,
      jobAlerts: jobAlerts !== undefined ? jobAlerts : currentPrefs.jobAlerts,
      emailNotifications: emailNotifications !== undefined ? emailNotifications : currentPrefs.emailNotifications,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : currentPrefs.pushNotifications,
      privacySettings: privacySettings !== undefined ? privacySettings : currentPrefs.privacySettings,
      theme: theme !== undefined ? theme : currentPrefs.theme,
      language: language !== undefined ? language : currentPrefs.language,
    };

    await user.update({ preferences: updatedPrefs });

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });

  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/profile/public/:userId
// @desc    Get public profile
// @access  Private - authenticated users only
router.get('/public/:userId', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User().findByPk(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if profile is public
    const preferences = user.preferences || {};
    if (preferences.privacySettings?.profileVisibility !== 'public') {
      return res.status(403).json({ error: 'This profile is private' });
    }

    // Filter out private information
    const publicProfile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      skills: user.skills || [],
      experience: user.experience || [],
      education: user.education || [],
      bio: user.bio || ''
    };

    res.json({ profile: publicProfile });

  } catch (error) {
    logger.error('Get public profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/profile/export
// @desc    Export user profile data
// @access  Private
router.post('/export', authenticateToken, csrfProtection, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const { format = 'json' } = req.body;

    const user = await User().findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let exportData;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'json':
        exportData = JSON.stringify(user.toJSON(), null, 2);
        contentType = 'application/json';
        filename = `profile-${user.id}.json`;
        break;
      case 'pdf':
        // This would require a PDF generation library
        exportData = 'PDF export not implemented yet';
        contentType = 'application/pdf';
        filename = `profile-${user.id}.pdf`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported export format' });
    }

    res.set({
      'Content-Type': contentType
    });

    res.send(exportData);

  } catch (error) {
    logger.error('Export profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/profile
// @desc    Delete user account
// @access  Private
router.delete('/', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    getLogger().error('Delete account error:', error);
    await User.findByIdAndDelete(req.user.userId);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/profile/stats
// @desc    Get user dashboard statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock stats for now - can be replaced with real database queries
    const stats = {
      resumes: 2,
      applications: 15,
      interviews: 3,
      recommendations: 8,
      profile_completion: 85,
      skills_count: user.skills ? user.skills.length : 0,
      last_activity: new Date().toISOString()
    };

    res.json({ stats });
  } catch (error) {
    logger.error('Get profile stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/profile/dashboard
// @desc    Get comprehensive dashboard data
// @access  Private
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User().findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock dashboard data
    const dashboardData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        profile_completion: 85
      },
      stats: {
        resumes: 2,
        applications: 15,
        interviews: 3,
        recommendations: 8
      },
      recent_activities: [
        {
          id: 1,
          type: 'resume_upload',
          title: 'Resume uploaded successfully',
          description: 'Your resume was processed with AI analysis',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'completed'
        },
        {
          id: 2,
          type: 'job_application',
          title: 'Application submitted',
          description: 'Applied for Software Engineer at Tech Corp',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ],
    quick_actions: user.role === 'employer' ? [
      { title: 'Post New Job', action: 'post_job', icon: 'add' },
      { title: 'Search Candidates', action: 'search_candidates', icon: 'search' },
      { title: 'Schedule Interview', action: 'schedule_interview', icon: 'schedule' }
    ] : [
      { title: 'Upload Resume', action: 'upload_resume', icon: 'upload' },
      { title: 'Search Jobs', action: 'search_jobs', icon: 'search' }
    ]
    };

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    logger.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(user) {
  const fields = [
    'firstName', 'lastName', 'phone', 'location', 'bio',
    'skills', 'experience', 'education', 'avatar'
  ];

  let completed = 0;
  fields.forEach(field => {
    if (field === 'skills' || field === 'experience' || field === 'education') {
      if (user.profile[field] && user.profile[field].length > 0) {
        completed++;
      }
    } else if (field === 'avatar') {
      if (user.profile.avatar) {
        completed++;
      }
    } else if (user.profile[field] && user.profile[field].trim()) {
      completed++;
    }
  });

  return Math.round((completed / fields.length) * 100);
}

module.exports = router;
