const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
// Try to import User model (optional)
let User = null;
try {
  User = require('../models/User');
} catch (error) {
  console.warn('User model not available:', error.message);
}
const { authenticateToken } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');
const logger = require('../middleware/logger');

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
const profileUpdateLimiter = rateLimit({
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

    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('resumes', 'title skills experience education createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ profile: user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', authenticateToken, profileUpdateLimiter, validateProfileUpdate, async (req, res) => {
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

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile fields
    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phone) user.profile.phone = phone;
    if (location) user.profile.location = location;
    if (bio) user.profile.bio = bio;
    if (website) user.profile.website = website;
    if (linkedin) user.profile.linkedin = linkedin;
    if (github) user.profile.github = github;
    if (timezone) user.profile.timezone = timezone;
    if (language) user.profile.language = language;
    if (notifications) user.profile.notifications = notifications;

    // Update main user fields if profile fields changed
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Profile updated successfully',
      profile: userResponse
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/profile/avatar
// @desc    Upload profile avatar
// @access  Private
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Avatar file is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store avatar data
    user.profile.avatar = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname
    };

    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: `/api/profile/avatar/${user._id}`
    });

  } catch (error) {
    logger.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/profile/avatar/:userId
// @desc    Get user avatar
// @access  Public
router.get('/avatar/:userId', async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User.findById(req.params.userId);
    if (!user || !user.profile.avatar) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    res.set({
      'Content-Type': user.profile.avatar.contentType,
      'Content-Length': user.profile.avatar.data.length
    });

    res.send(user.profile.avatar.data);

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

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profile.avatar = undefined;
    await user.save();

    res.json({ message: 'Avatar removed successfully' });

  } catch (error) {
    logger.error('Remove avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile/skills
// @desc    Update user skills
// @access  Private
router.put('/skills', authenticateToken, validateSkills, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skills } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profile.skills = skills;
    await user.save();

    res.json({
      message: 'Skills updated successfully',
      skills: user.profile.skills
    });

  } catch (error) {
    logger.error('Update skills error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile/experience
// @desc    Update user experience
// @access  Private
router.put('/experience', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const { experience } = req.body;

    if (!Array.isArray(experience)) {
      return res.status(400).json({ error: 'Experience must be an array' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profile.experience = experience;
    await user.save();

    res.json({
      message: 'Experience updated successfully',
      experience: user.profile.experience
    });

  } catch (error) {
    logger.error('Update experience error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/profile/education
// @desc    Update user education
// @access  Private
router.put('/education', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const { education } = req.body;

    if (!Array.isArray(education)) {
      return res.status(400).json({ error: 'Education must be an array' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profile.education = education;
    await user.save();

    res.json({
      message: 'Education updated successfully',
      education: user.profile.education
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

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update preferences
    if (jobAlerts !== undefined) user.preferences.jobAlerts = jobAlerts;
    if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) user.preferences.pushNotifications = pushNotifications;
    if (privacySettings) user.preferences.privacySettings = privacySettings;
    if (theme) user.preferences.theme = theme;
    if (language) user.preferences.language = language;

    await user.save();

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
// @access  Public
router.get('/public/:userId', async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User.findById(req.params.userId)
      .select('firstName lastName profile.skills profile.experience profile.education profile.bio profile.avatar')
      .populate('resumes', 'title skills experience education createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter out private information
    const publicProfile = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      skills: user.profile.skills || [],
      experience: user.profile.experience || [],
      education: user.profile.education || [],
      bio: user.profile.bio || '',
      avatar: user.profile.avatar ? `/api/profile/avatar/${user._id}` : null,
      resumes: user.resumes || []
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
router.post('/export', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const { format = 'json' } = req.body;

    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('resumes');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let exportData;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'json':
        exportData = JSON.stringify(user, null, 2);
        contentType = 'application/json';
        filename = `profile-${user._id}.json`;
        break;
      case 'pdf':
        // This would require a PDF generation library
        exportData = 'PDF export not implemented yet';
        contentType = 'application/pdf';
        filename = `profile-${user._id}.pdf`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported export format' });
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`
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

    // Delete user account
    await User.findByIdAndDelete(req.user.userId);

    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/profile/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!User) {
      return res.status(503).json({ error: 'User model not available' });
    }

    const user = await User.findById(req.user.userId)
      .populate('resumes')
      .populate('appliedJobs')
      .populate('savedJobs');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      resumes: user.resumes?.length || 0,
      applications: user.appliedJobs?.length || 0,
      savedJobs: user.savedJobs?.length || 0,
      skills: user.profile.skills?.length || 0,
      experience: user.profile.experience?.length || 0,
      education: user.profile.education?.length || 0,
      profileCompletion: calculateProfileCompletion(user),
      lastActive: user.lastLogin || user.createdAt
    };

    res.json({ stats });

  } catch (error) {
    logger.error('Get profile stats error:', error);
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
