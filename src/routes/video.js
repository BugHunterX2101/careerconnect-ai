const express = require('express');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const logger = require('../middleware/logger');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { createGMeetEvent, updateGMeetEvent, deleteGMeetEvent } = require('../services/gmeetService');

// Model resolvers (Sequelize getter-function pattern)
const getModel = (mod) => {
  if (!mod) return null;
  if (typeof mod.Interview === 'function') try { return mod.Interview(); } catch(_) { return null; }
  if (typeof mod.Job === 'function') try { return mod.Job(); } catch(_) { return null; }
  if (typeof mod.User === 'function') try { return mod.User(); } catch(_) { return null; }
  if (typeof mod === 'function') try { return mod(); } catch(_) { return null; }
  return mod;
};

let InterviewMod = null, UserMod = null, JobMod = null;
try { InterviewMod = require('../models/Interview'); } catch(e) { console.warn('Interview model:', e.message); }
try { UserMod = require('../models/User'); } catch(e) { console.warn('User model:', e.message); }
try { JobMod = require('../models/Job'); } catch(e) { console.warn('Job model:', e.message); }

const getInterview = () => InterviewMod ? (typeof InterviewMod.Interview === 'function' ? InterviewMod.Interview() : InterviewMod) : null;
const getUser = () => UserMod ? (typeof UserMod.User === 'function' ? UserMod.User() : UserMod) : null;
const getJob = () => JobMod ? (typeof JobMod.Job === 'function' ? JobMod.Job() : JobMod) : null;

const router = express.Router();

const interviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many interview requests, please try again later.'
});

const validateInterview = [
  body('jobId').isInt({ min: 1 }).withMessage('Valid job ID (integer) is required'),
  body('candidateId').isInt({ min: 1 }).withMessage('Valid candidate ID (integer) is required'),
  body('scheduledAt').isISO8601().withMessage('Valid ISO 8601 date is required'),
  body('duration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('type').isIn(['phone', 'video', 'onsite']).withMessage('Type must be phone, video, or onsite'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
];

// POST /api/video/interviews — Schedule an interview
router.post('/interviews', authenticateToken, authorizeRole('employer'), interviewLimiter, validateInterview, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    const UserModel = getUser();
    const JobModel = getJob();
    if (!InterviewModel || !UserModel || !JobModel) {
      return res.status(503).json({ error: 'Database models not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { jobId, candidateId, scheduledAt, duration, type, notes, description } = req.body;

    const job = await JobModel.findByPk(parseInt(jobId, 10));
    if (!job) return res.status(404).json({ error: 'Job not found' });

    if (String(job.employerId) !== String(req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to schedule interviews for this job' });
    }

    const candidate = await UserModel.findByPk(parseInt(candidateId, 10));
    if (!candidate || candidate.role !== 'jobseeker') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const scheduledAtDate = new Date(scheduledAt);
    const endAtDate = new Date(scheduledAtDate.getTime() + duration * 60000);

    const conflictingInterview = await InterviewModel.findOne({
      where: {
        [Op.or]: [
          { candidateId: parseInt(candidateId, 10), scheduledAt: { [Op.between]: [scheduledAtDate, endAtDate] } },
          { interviewerId: parseInt(req.user.userId, 10), scheduledAt: { [Op.between]: [scheduledAtDate, endAtDate] } }
        ],
        status: { [Op.in]: ['scheduled', 'confirmed'] }
      }
    });
    if (conflictingInterview) return res.status(400).json({ error: 'Scheduling conflict detected' });

    const interview = await InterviewModel.create({
      jobId: parseInt(jobId, 10),
      candidateId: parseInt(candidateId, 10),
      interviewerId: parseInt(req.user.userId, 10),
      scheduledAt: scheduledAtDate,
      duration,
      type,
      notes,
      description,
      status: 'scheduled'
    });

    if (type === 'video') {
      try {
        const meetEvent = await createGMeetEvent({
          summary: `Interview: ${job.title} - ${candidate.firstName} ${candidate.lastName}`,
          description: description || `Interview for ${job.title} position`,
          startTime: scheduledAtDate,
          endTime: endAtDate,
          attendees: [
            { email: candidate.email, displayName: `${candidate.firstName} ${candidate.lastName}` },
            { email: req.user.email || '', displayName: `${req.user.firstName || ''} ${req.user.lastName || ''}` }
          ]
        });
        await interview.update({ meetLink: meetEvent.hangoutLink, meetEventId: meetEvent.id });
      } catch (err) {
        logger.error('Google Meet creation error:', err.message);
      }
    }

    const io = req.app.get('io');
    if (io) io.to(`user_${candidateId}`).emit('interview:scheduled', { interview: interview.toJSON(), jobTitle: job.title });

    res.status(201).json({ message: 'Interview scheduled successfully', interview });
  } catch (error) {
    logger.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/video/interviews — List user's interviews
router.get('/interviews', authenticateToken, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const { page = 1, limit = 20, status, type } = req.query;

    const where = {
      [Op.or]: [{ candidateId: userId }, { interviewerId: userId }]
    };
    if (status) where.status = status;
    if (type) where.type = type;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows: interviews } = await InterviewModel.findAndCountAll({
      where,
      order: [['scheduledAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset
    });

    res.json({ interviews, total: count, page: parseInt(page, 10), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    logger.error('Get interviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/video/interviews/:id — Get interview details
router.get('/interviews/:id', authenticateToken, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const interview = await InterviewModel.findOne({
      where: {
        id: parseInt(req.params.id, 10),
        [Op.or]: [{ candidateId: userId }, { interviewerId: userId }]
      }
    });
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    res.json({ interview });
  } catch (error) {
    logger.error('Get interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/video/interviews/:id — Update interview
router.put('/interviews/:id', authenticateToken, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const interview = await InterviewModel.findByPk(parseInt(req.params.id, 10));
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    if (interview.interviewerId !== userId && interview.candidateId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { scheduledAt, duration, notes, status } = req.body;
    const updates = {};
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);
    if (duration) updates.duration = duration;
    if (notes) updates.notes = notes;
    if (status) updates.status = status;

    if (interview.type === 'video' && interview.meetEventId && (scheduledAt || duration)) {
      try {
        const newStart = updates.scheduledAt || interview.scheduledAt;
        const newDuration = updates.duration || interview.duration;
        await updateGMeetEvent(interview.meetEventId, {
          startTime: newStart,
          endTime: new Date(new Date(newStart).getTime() + newDuration * 60000)
        });
      } catch (err) { logger.error('Google Meet update error:', err.message); }
    }

    await interview.update(updates);
    res.json({ message: 'Interview updated successfully', interview });
  } catch (error) {
    logger.error('Update interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/video/interviews/:id — Cancel interview
router.delete('/interviews/:id', authenticateToken, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const interview = await InterviewModel.findByPk(parseInt(req.params.id, 10));
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.interviewerId !== userId) return res.status(403).json({ error: 'Not authorized' });

    if (interview.meetEventId) {
      try { await deleteGMeetEvent(interview.meetEventId); } catch(err) { logger.error('GMeet delete error:', err.message); }
    }

    await interview.destroy();

    const io = req.app.get('io');
    if (io) io.to(`user_${interview.candidateId}`).emit('interview:cancelled', { interviewId: interview.id });

    res.json({ message: 'Interview cancelled successfully' });
  } catch (error) {
    logger.error('Cancel interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/video/interviews/:id/join
router.post('/interviews/:id/join', authenticateToken, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const interview = await InterviewModel.findByPk(parseInt(req.params.id, 10));
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    if (interview.candidateId !== userId && interview.interviewerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const now = new Date();
    const start = new Date(interview.scheduledAt);
    const end = new Date(start.getTime() + interview.duration * 60000);

    if (now < new Date(start.getTime() - 15 * 60000)) return res.status(400).json({ error: 'Interview has not started yet (joins open 15 min early)' });
    if (now > end) return res.status(400).json({ error: 'Interview has ended' });

    if (interview.status === 'scheduled') {
      await interview.update({ status: 'in_progress', startedAt: now });
    }

    res.json({ message: 'Joined interview', interview, meetLink: interview.meetLink });
  } catch (error) {
    logger.error('Join interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/video/interviews/:id/end
router.post('/interviews/:id/end', authenticateToken, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('feedback').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const InterviewModel = getInterview();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const interview = await InterviewModel.findByPk(parseInt(req.params.id, 10));
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.interviewerId !== userId) return res.status(403).json({ error: 'Not authorized' });

    const { feedback, rating, notes } = req.body;
    await interview.update({ status: 'completed', endedAt: new Date(), feedback, rating, interviewerNotes: notes });

    const io = req.app.get('io');
    if (io) io.to(`user_${interview.candidateId}`).emit('interview:completed', { interviewId: interview.id, feedback, rating });

    res.json({ message: 'Interview ended', interview });
  } catch (error) {
    logger.error('End interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/video/meet-link/:interviewId
router.get('/meet-link/:interviewId', authenticateToken, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    const JobModel = getJob();
    const UserModel = getUser();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const interview = await InterviewModel.findByPk(parseInt(req.params.interviewId, 10));
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    if (interview.candidateId !== userId && interview.interviewerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (interview.meetLink) return res.json({ meetLink: interview.meetLink });

    if (interview.type !== 'video') return res.status(400).json({ error: 'Not a video interview' });

    // Look up job/candidate for meet creation
    const job = JobModel ? await JobModel.findByPk(interview.jobId) : null;
    const candidate = UserModel ? await UserModel.findByPk(interview.candidateId) : null;

    try {
      const meetEvent = await createGMeetEvent({
        summary: `Interview: ${job?.title || 'Position'} - ${candidate?.firstName || 'Candidate'} ${candidate?.lastName || ''}`,
        description: `Interview session`,
        startTime: new Date(interview.scheduledAt),
        endTime: new Date(new Date(interview.scheduledAt).getTime() + interview.duration * 60000),
        attendees: candidate ? [{ email: candidate.email }] : []
      });
      await interview.update({ meetLink: meetEvent.hangoutLink, meetEventId: meetEvent.id });
      res.json({ meetLink: interview.meetLink });
    } catch (err) {
      logger.error('Meet link creation error:', err.message);
      res.status(500).json({ error: 'Failed to create meet link' });
    }
  } catch (error) {
    logger.error('Get meet link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/video/upcoming
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const InterviewModel = getInterview();
    if (!InterviewModel) return res.status(503).json({ error: 'Interview model not available' });

    const userId = parseInt(req.user.userId, 10);
    const limit = parseInt(req.query.limit || '5', 10);

    const upcomingInterviews = await InterviewModel.findAll({
      where: {
        [Op.or]: [{ candidateId: userId }, { interviewerId: userId }],
        scheduledAt: { [Op.gt]: new Date() },
        status: { [Op.in]: ['scheduled', 'confirmed'] }
      },
      order: [['scheduledAt', 'ASC']],
      limit
    });

    res.json({ upcomingInterviews });
  } catch (error) {
    logger.error('Get upcoming error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
