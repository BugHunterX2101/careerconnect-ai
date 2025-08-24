const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { Op } = require('sequelize');

// Import middleware and utilities
const { authenticateToken, authorizeRole, checkOwnership } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');
const { performanceLogger } = require('../middleware/logger');

// Try to import models (optional)
let getResumeModel = null;
let getUserModel = null;

try {
  const { Resume: resumeModel, initializeResumeModel } = require('../models/Resume');
  getResumeModel = resumeModel;
} catch (error) {
  console.warn('Resume model not available:', error.message);
}

try {
  const { User: userModel } = require('../models/User');
  getUserModel = userModel;
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
// @desc    Upload a new resume
// @access  Private
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();

    // Validate request body
    const validationResult = uploadResumeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required' });
    }

    const { title, isPublic = false, description } = validationResult.data;

    // Create resume record
    const resume = await Resume.create({
      userId: req.user.userId,
      title: title || req.file.originalname,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).toLowerCase(),
      description,
      isPublic,
      processingStatus: 'pending'
    });

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume.id,
        title: resume.title,
        originalFileName: resume.originalFileName,
        fileSize: resume.fileSize,
        processingStatus: resume.processingStatus
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// @route   GET /api/resume
// @desc    Get user's resumes
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    const where = { userId: req.user.userId };
    if (status) where.processingStatus = status;

    const resumes = await Resume.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const total = await Resume.count({ where });

    res.json({
      resumes: resumes.map(resume => resume.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ error: 'Failed to get resumes' });
  }
});

// @route   GET /api/resume/public
// @desc    Get public resumes
// @access  Public
router.get('/public', async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    const where = { isPublic: true, isActive: true };
    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    const resumes = await Resume.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const total = await Resume.count({ where });

    res.json({
      resumes: resumes.map(resume => resume.toJSON()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get public resumes error:', error);
    res.status(500).json({ error: 'Failed to get public resumes' });
  }
});

// @route   GET /api/resume/:id
// @desc    Get a specific resume
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check ownership
    if (resume.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ resume: resume.toJSON() });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to get resume' });
  }
});

// @route   PUT /api/resume/:id
// @desc    Update a resume
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check ownership
    if (resume.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate request body
    const validationResult = updateResumeSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.errors 
      });
    }

    // Update resume
    await resume.update(validationResult.data);

    res.json({
      message: 'Resume updated successfully',
      resume: resume.toJSON()
    });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

// @route   DELETE /api/resume/:id
// @desc    Delete a resume
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check ownership
    if (resume.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file
    try {
      await fs.unlink(resume.filePath);
    } catch (fileError) {
      console.warn('Failed to delete file:', fileError.message);
    }

    // Delete from database
    await resume.destroy();

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// @route   GET /api/resume/:id/status
// @desc    Get resume processing status
// @access  Private
router.get('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check ownership
    if (resume.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: resume.id,
      status: resume.processingStatus,
      progress: resume.processingProgress,
      error: resume.processingError,
      processedAt: resume.processedAt
    });
  } catch (error) {
    console.error('Get resume status error:', error);
    res.status(500).json({ error: 'Failed to get resume status' });
  }
});

// @route   POST /api/resume/:id/reprocess
// @desc    Reprocess a resume
// @access  Private
router.post('/:id/reprocess', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check ownership
    if (resume.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Reset processing status
    await resume.update({
      processingStatus: 'pending',
      processingProgress: 0,
      processingError: null
    });

    res.json({
      message: 'Resume reprocessing started',
      id: resume.id,
      status: resume.processingStatus
    });
  } catch (error) {
    console.error('Reprocess resume error:', error);
    res.status(500).json({ error: 'Failed to reprocess resume' });
  }
});

// @route   GET /api/resume/:id/analysis
// @desc    Get resume analysis
// @access  Private
router.get('/:id/analysis', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check ownership
    if (resume.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (resume.processingStatus !== 'completed') {
      return res.status(400).json({ 
        error: 'Resume processing not completed',
        status: resume.processingStatus 
      });
    }

    res.json({
      id: resume.id,
      analysis: resume.aiAnalysis,
      skills: resume.skills,
      experience: resume.experience,
      education: resume.education
    });
  } catch (error) {
    console.error('Get resume analysis error:', error);
    res.status(500).json({ error: 'Failed to get resume analysis' });
  }
});

// @route   GET /api/resume/:id/recommendations
// @desc    Get job recommendations for resume
// @access  Private
router.get('/:id/recommendations', authenticateToken, async (req, res) => {
  try {
    if (!getResumeModel) {
      return res.status(503).json({ error: 'Resume model not available' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check ownership
    if (resume.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (resume.processingStatus !== 'completed') {
      return res.status(400).json({ 
        error: 'Resume processing not completed',
        status: resume.processingStatus 
      });
    }

    res.json({
      id: resume.id,
      recommendations: resume.jobRecommendations || []
    });
  } catch (error) {
    console.error('Get job recommendations error:', error);
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
});

module.exports = router;
