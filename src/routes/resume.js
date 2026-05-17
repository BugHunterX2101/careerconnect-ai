const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const { Op } = require('sequelize');
const csrf = require('csurf');

// Import middleware and utilities
const { authenticateToken } = require('../middleware/auth');

// Try to import models (optional)
let getResumeModel = null;

try {
  const { Resume: resumeModel } = require('../models/Resume');
  getResumeModel = resumeModel;
} catch (error) {
  console.warn('Resume model not available:', error.message);
}

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

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
      user_id: req.user.userId,
      title: title || req.file.originalname,
      original_file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      file_type: path.extname(req.file.originalname).toLowerCase(),
      description,
      is_public: isPublic,
      processing_status: 'pending'
    });

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume.id,
        title: resume.title,
        originalFileName: resume.original_file_name,
        fileSize: resume.file_size,
        processingStatus: resume.processing_status
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
      return res.json({
        resumes: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      });
    }

    let Resume;
    try {
      Resume = getResumeModel();
    } catch (modelError) {
      console.warn('Resume model initialization failed:', modelError.message);
      return res.json({
        resumes: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      });
    }
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    const where = { user_id: req.user.userId };
    if (status) where.processing_status = status;

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
    const where = { is_public: true, is_active: true };
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
    if (resume.user_id !== req.user.userId && req.user.role !== 'admin') {
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
router.put('/:id', [authenticateToken, csrfProtection], async (req, res) => {
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
    if (resume.user_id !== req.user.userId && req.user.role !== 'admin') {
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

    // Map camelCase schema fields to snake_case model columns
    const updateData = {};
    const d = validationResult.data;
    if (d.title !== undefined) updateData.title = d.title;
    if (d.isPublic !== undefined) updateData.is_public = d.isPublic;
    if (d.description !== undefined) updateData.description = d.description;
    if (d.personalInfo !== undefined) updateData.personal_info = d.personalInfo;
    if (d.summary !== undefined) updateData.summary = d.summary;
    if (d.skills !== undefined) updateData.skills = d.skills;

    // Update resume
    await resume.update(updateData);

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
    if (resume.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file
    try {
      await fs.unlink(resume.file_path);
    } catch (fileError) {
      console.warn('Failed to delete file:', fileError.message.replace(/[\r\n]/g, ''));
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
    if (resume.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      id: resume.id,
      status: resume.processing_status,
      progress: resume.processing_progress,
      error: resume.processing_error,
      processedAt: resume.processed_at
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
    if (resume.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Reset processing status
    await resume.update({
      processing_status: 'pending',
      processing_progress: 0,
      processing_error: null
    });

    res.json({
      message: 'Resume reprocessing started',
      id: resume.id,
      status: resume.processing_status
    });
  } catch (error) {
    console.error('Reprocess resume error:', error);
    res.status(500).json({ error: 'Failed to reprocess resume' });
  }
});

// @route   GET /api/resume/:id/analysis
// @desc    Get resume analysis with AI insights
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
    if (resume.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate analysis if not exists or if requested fresh
    let analysis = resume.ai_analysis;
    if (!analysis || req.query.refresh === 'true') {
      try {
        const ResumeAnalyzer = require('../ml/resumeAnalyzer');
        const analyzer = new ResumeAnalyzer();

        const parsedData = {
          personalInfo: resume.personal_info || {},
          education: resume.education || [],
          experience: resume.experience || [],
          skills: resume.skills || [],
          summary: resume.summary || ''
        };

        analysis = await analyzer.analyzeResumeWithAI(parsedData);

        // Save analysis to resume
        await resume.update({ ai_analysis: analysis });
      } catch (error) {
        console.error('AI analysis failed:', error);
        analysis = {
          overallScore: 70,
          overallAssessment: 'Basic analysis completed',
          improvementAreas: [{
            area: 'General',
            issue: 'Analysis service temporarily unavailable',
            suggestion: 'Please try again later',
            priority: 'low'
          }]
        };
      }
    }

    res.json({
      id: resume.id,
      analysis,
      skills: resume.skills,
      experience: resume.experience,
      education: resume.education,
      completeness: analysis.completeness || 70,
      skillsRelevance: analysis.skillsRelevance || 70,
      experienceDepth: analysis.experienceDepth || 70,
      overallScore: analysis.overallScore || 70,
      improvementAreas: analysis.improvementAreas || [],
      detailedAnalysis: analysis.detailedAnalysis || null
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
    if (resume.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (resume.processing_status !== 'completed') {
      return res.status(400).json({ 
        error: 'Resume processing not completed',
        status: resume.processing_status 
      });
    }

    res.json({
      id: resume.id,
      recommendations: resume.job_recommendations || []
    });
  } catch (error) {
    console.error('Get job recommendations error:', error);
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
});

module.exports = router;
