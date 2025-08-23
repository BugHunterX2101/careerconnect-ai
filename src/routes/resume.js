const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');

// Import middleware and utilities
const { authenticateToken, authorizeRole, checkOwnership } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');
const logger = require('../middleware/logger');
const { addResumeProcessingJob, addJobRecommendationJob } = require('../workers/jobQueue');

// Try to import models (optional)
let Resume = null;
let User = null;

try {
  Resume = require('../models/Resume');
} catch (error) {
  console.warn('Resume model not available:', error.message);
}

try {
  User = require('../models/User');
} catch (error) {
  console.warn('User model not available:', error.message);
}

const router = express.Router();

// Validation schemas
const uploadResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
  description: z.string().max(500).optional()
});

const updateResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
  description: z.string().max(500).optional(),
  personalInfo: z.object({
    fullName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional()
  }).optional(),
  summary: z.string().max(1000).optional(),
  skills: z.array(z.object({
    name: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    yearsOfExperience: z.number().min(0).optional(),
    category: z.string().optional(),
    confidence: z.number().min(0).max(1).optional()
  })).optional()
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }

  if (file.size > maxSize) {
    return cb(new Error('File too large. Maximum size is 10MB.'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
});

// @route   POST /api/resume/upload
// @desc    Upload and parse resume
// @access  Private
router.post('/upload', 
  authenticateToken, 
  authorizeRole('jobseeker', 'employer'),
  upload.single('resume'),
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      if (!Resume || !User) {
        return res.status(503).json({ error: 'Models not available' });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No file uploaded'
          }
        });
      }

      const { title, isPublic = false, description } = req.body;
      const fileType = path.extname(req.file.originalname).toLowerCase().substring(1);

      // Create resume record
      const resume = new Resume({
        userId: req.user._id,
        originalFileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType,
        title: title || req.file.originalname,
        isPublic,
        description
      });

      await resume.save();

      // Add resume processing job to queue
      await addResumeProcessingJob(
        req.user._id,
        resume._id,
        req.file.path,
        fileType
      );

      performanceLogger('resume_upload', startTime, {
        userId: req.user._id,
        resumeId: resume._id,
        fileSize: req.file.size,
        fileType
      });

             res.status(201).json({
         success: true,
         message: 'Resume uploaded successfully and queued for processing',
         data: {
           resumeId: resume._id,
           status: resume.processingStatus,
           originalFileName: resume.originalFileName,
           fileSize: resume.fileSize
         }
       });
     } catch (error) {
       errorHandler(error, req, res);
     }
   }
 );

// @route   GET /api/resume
// @desc    Get user's resumes
// @access  Private
router.get('/', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const query = { userId: req.user._id };
      if (status) {
        query.processingStatus = status;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const resumes = await Resume.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-filePath');

      const total = await Resume.countDocuments(query);

      res.json({
        success: true,
        data: {
          resumes,
          pagination: {
            currentPage: page * 1,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit * 1
          }
        }
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   GET /api/resume/:id
// @desc    Get specific resume
// @access  Private
router.get('/:id', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const resume = await Resume.findById(req.params.id)
        .populate('userId', 'firstName lastName email')
        .select('-filePath');

      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found'
          }
        });
      }

      res.json({
        success: true,
        data: resume
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   PUT /api/resume/:id
// @desc    Update resume
// @access  Private
router.put('/:id', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const resume = await Resume.findById(req.params.id);
      
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found'
          }
        });
      }

      // Update resume fields
      Object.keys(req.body).forEach(key => {
        if (key === 'skills' && Array.isArray(req.body[key])) {
          resume.skills = req.body[key];
        } else if (key === 'personalInfo' && typeof req.body[key] === 'object') {
          resume.personalInfo = { ...resume.personalInfo, ...req.body[key] };
        } else {
          resume[key] = req.body[key];
        }
      });

      await resume.save();

      res.json({
        success: true,
        message: 'Resume updated successfully',
        data: resume
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   DELETE /api/resume/:id
// @desc    Delete resume
// @access  Private
router.delete('/:id', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const resume = await Resume.findById(req.params.id);
      
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found'
          }
        });
      }

      // Delete file from filesystem
      try {
        await fs.unlink(resume.filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }

      await Resume.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Resume deleted successfully'
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   GET /api/resume/:id/status
// @desc    Get resume processing status
// @access  Private
router.get('/:id/status', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const resume = await Resume.findById(req.params.id)
        .select('processingStatus processingProgress processingError processedAt');

      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found'
          }
        });
      }

      res.json({
        success: true,
        data: {
          status: resume.processingStatus,
          progress: resume.processingProgress,
          error: resume.processingError,
          processedAt: resume.processedAt
        }
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   POST /api/resume/:id/reprocess
// @desc    Reprocess resume
// @access  Private
router.post('/:id/reprocess', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const resume = await Resume.findById(req.params.id);
      
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found'
          }
        });
      }

      // Reset processing status
      resume.processingStatus = 'pending';
      resume.processingProgress = 0;
      resume.processingError = null;
      await resume.save();

      // Add reprocessing job to queue
      await addResumeProcessingJob(
        req.user._id,
        resume._id,
        resume.filePath,
        resume.fileType
      );

      res.json({
        success: true,
        message: 'Resume reprocessing started',
        data: {
          resumeId: resume._id,
          status: resume.processingStatus
        }
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   GET /api/resume/:id/analysis
// @desc    Get resume AI analysis
// @access  Private
router.get('/:id/analysis', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const resume = await Resume.findById(req.params.id)
        .select('aiAnalysis skills experience education');

      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found'
          }
        });
      }

      if (resume.processingStatus !== 'completed') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Resume processing not completed'
          }
        });
      }

      res.json({
        success: true,
        data: {
          analysis: resume.aiAnalysis,
          skills: resume.skills,
          experience: resume.experience,
          education: resume.education
        }
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   POST /api/resume/:id/recommendations
// @desc    Get job recommendations for resume
// @access  Private
router.post('/:id/recommendations', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const { limit = 20, location, remoteOnly, minSalary, maxSalary, employmentType, seniorityLevel, skills = [] } = req.body;

      const resume = await Resume.findById(req.params.id);
      
      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found'
          }
        });
      }

      if (resume.processingStatus !== 'completed') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Resume processing not completed'
          }
        });
      }

      // Add job recommendation job to queue
      const job = await addJobRecommendationJob(
        req.user._id,
        resume._id,
        {
          limit,
          location,
          remoteOnly,
          minSalary,
          maxSalary,
          employmentType,
          seniorityLevel,
          skills
        },
        true // Send email notification
      );

      res.json({
        success: true,
        message: 'Job recommendations generation started',
        data: {
          jobId: job.id,
          resumeId: resume._id
        }
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   GET /api/resume/public/:id
// @desc    Get public resume (for employers)
// @access  Public
router.get('/public/:id', 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const resume = await Resume.findOne({
        _id: req.params.id,
        isPublic: true,
        isActive: true
      })
      .populate('userId', 'firstName lastName location')
      .select('-filePath -personalInfo.email -personalInfo.phone -personalInfo.address');

      if (!resume) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resume not found or not public'
          }
        });
      }

      res.json({
        success: true,
        data: resume
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   GET /api/resume/search
// @desc    Search resumes (for employers)
// @access  Private (employers only)
router.get('/search', 
  authenticateToken, 
  authorizeRole('employer', 'admin'),
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const { 
        page = 1, 
        limit = 10, 
        skills, 
        location, 
        experience, 
        education,
        sortBy = 'aiAnalysis.overallScore',
        sortOrder = 'desc'
      } = req.query;

      const query = {
        isPublic: true,
        isActive: true,
        processingStatus: 'completed'
      };

      // Add search filters
      if (skills) {
        const skillArray = skills.split(',').map(s => s.trim());
        query['skills.name'] = { $in: skillArray };
      }

      if (location) {
        query['userId.location.city'] = new RegExp(location, 'i');
      }

      if (experience) {
        query['aiAnalysis.experienceScore'] = { $gte: parseInt(experience) };
      }

      if (education) {
        query['education.degree'] = new RegExp(education, 'i');
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const resumes = await Resume.find(query)
        .populate('userId', 'firstName lastName location')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-filePath -personalInfo.email -personalInfo.phone -personalInfo.address');

      const total = await Resume.countDocuments(query);

      res.json({
        success: true,
        data: {
          resumes,
          pagination: {
            currentPage: page * 1,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit * 1
          }
        }
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

// @route   GET /api/resume/stats
// @desc    Get resume statistics
// @access  Private
router.get('/stats', 
  authenticateToken, 
  async (req, res) => {
    try {
      if (!Resume) {
        return res.status(503).json({ error: 'Resume model not available' });
      }

      const stats = await Resume.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$processingStatus', 'completed'] }, 1, 0] } },
            processing: { $sum: { $cond: [{ $eq: ['$processingStatus', 'processing'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$processingStatus', 'failed'] }, 1, 0] } },
            public: { $sum: { $cond: ['$isPublic', 1, 0] } },
            averageScore: { $avg: '$aiAnalysis.overallScore' },
            totalSkills: { $sum: { $size: '$skills' } }
          }
        }
      ]);

      const recentResumes = await Resume.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title processingStatus aiAnalysis.overallScore createdAt');

      res.json({
        success: true,
        data: {
          stats: stats[0] || {
            total: 0,
            completed: 0,
            processing: 0,
            failed: 0,
            public: 0,
            averageScore: 0,
            totalSkills: 0
          },
          recentResumes
        }
      });
    } catch (error) {
      errorHandler(error, req, res);
    }
  })
);

module.exports = router;
