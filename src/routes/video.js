const express = require('express');
const { body, validationResult } = require('express-validator');
// Try to import models (optional)
let Interview = null;
let User = null;
let Job = null;

try {
  Interview = require('../models/Interview');
} catch (error) {
  console.warn('Interview model not available:', error.message);
}

try {
  User = require('../models/User');
} catch (error) {
  console.warn('User model not available:', error.message);
}

try {
  Job = require('../models/Job');
} catch (error) {
  console.warn('Job model not available:', error.message);
}

const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');
const logger = require('../middleware/logger');
const { createGMeetEvent, updateGMeetEvent, deleteGMeetEvent } = require('../services/gmeetService');

const router = express.Router();

// Rate limiting
const interviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many interview requests, please try again later.',
});

// Validation middleware
const validateInterview = [
  body('jobId').isMongoId().withMessage('Valid job ID is required'),
  body('candidateId').isMongoId().withMessage('Valid candidate ID is required'),
  body('scheduledAt').isISO8601().withMessage('Valid date is required'),
  body('duration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('type').isIn(['phone', 'video', 'onsite']).withMessage('Interview type must be phone, video, or onsite'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
];

// @route   POST /api/video/interviews
// @desc    Schedule an interview
// @access  Private (employer)
router.post('/interviews', authenticateToken, authorizeRole('employer'), interviewLimiter, validateInterview, async (req, res) => {
  try {
    if (!Interview || !User || !Job) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      jobId, candidateId, scheduledAt, duration, type, notes, description
    } = req.body;

    // Verify job exists and belongs to employer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.employer.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to schedule interviews for this job' });
    }

    // Verify candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'jobseeker') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Check for scheduling conflicts
    const conflictingInterview = await Interview.findOne({
      $or: [
        { candidate: candidateId, scheduledAt: { $lt: new Date(scheduledAt.getTime() + duration * 60000), $gt: scheduledAt } },
        { interviewer: req.user.userId, scheduledAt: { $lt: new Date(scheduledAt.getTime() + duration * 60000), $gt: scheduledAt } }
      ],
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingInterview) {
      return res.status(400).json({ error: 'Scheduling conflict detected' });
    }

    // Create interview
    const interview = new Interview({
      job: jobId,
      candidate: candidateId,
      interviewer: req.user.userId,
      scheduledAt: new Date(scheduledAt),
      duration,
      type,
      notes,
      description,
      status: 'scheduled'
    });

    await interview.save();

    // Create Google Meet event if it's a video interview
    if (type === 'video') {
      try {
        const meetEvent = await createGMeetEvent({
          summary: `Interview: ${job.title} - ${candidate.firstName} ${candidate.lastName}`,
          description: description || `Interview for ${job.title} position`,
          startTime: new Date(scheduledAt),
          endTime: new Date(scheduledAt.getTime() + duration * 60000),
          attendees: [
            { email: candidate.email, displayName: `${candidate.firstName} ${candidate.lastName}` },
            { email: req.user.email, displayName: `${req.user.firstName} ${req.user.lastName}` }
          ]
        });

        interview.meetLink = meetEvent.hangoutLink;
        interview.meetEventId = meetEvent.id;
        await interview.save();
      } catch (error) {
        logger.error('Google Meet creation error:', error);
        // Continue without meet link
      }
    }

    // Populate references
    await interview.populate([
      { path: 'job', select: 'title company' },
      { path: 'candidate', select: 'firstName lastName email' },
      { path: 'interviewer', select: 'firstName lastName email' }
    ]);

    // Emit to Socket.IO for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${candidateId}`).emit('interview:scheduled', {
        interview,
        job: job.title,
        employer: `${req.user.firstName} ${req.user.lastName}`
      });
    }

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview
    });

  } catch (error) {
    logger.error('Schedule interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/video/interviews
// @desc    Get user's interviews
// @access  Private
router.get('/interviews', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const userId = req.user.userId;
    const { page = 1, limit = 20, status, type } = req.query;

    const query = {
      $or: [
        { candidate: userId },
        { interviewer: userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const interviews = await Interview.find(query)
      .populate('job', 'title company')
      .populate('candidate', 'firstName lastName email')
      .populate('interviewer', 'firstName lastName email')
      .sort({ scheduledAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Interview.countDocuments(query);

    res.json({
      interviews,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('Get interviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/video/interviews/:id
// @desc    Get interview details
// @access  Private
router.get('/interviews/:id', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const interview = await Interview.findOne({
      _id: id,
      $or: [
        { candidate: userId },
        { interviewer: userId }
      ]
    })
    .populate('job', 'title company description')
    .populate('candidate', 'firstName lastName email profile')
    .populate('interviewer', 'firstName lastName email profile');

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({ interview });

  } catch (error) {
    logger.error('Get interview details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/video/interviews/:id
// @desc    Update interview
// @access  Private
router.put('/interviews/:id', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { id } = req.params;
    const { scheduledAt, duration, notes, status } = req.body;
    const userId = req.user.userId;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Check authorization
    if (interview.interviewer.toString() !== userId && interview.candidate.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this interview' });
    }

    // Only interviewer can change status to certain values
    if (status && interview.interviewer.toString() !== userId) {
      const allowedStatuses = ['accepted', 'declined', 'rescheduled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({ error: 'Not authorized to change status to this value' });
      }
    }

    // Update fields
    if (scheduledAt) {
      interview.scheduledAt = new Date(scheduledAt);
    }
    if (duration) {
      interview.duration = duration;
    }
    if (notes) {
      interview.notes = notes;
    }
    if (status) {
      interview.status = status;
    }

    // Update Google Meet if it's a video interview and time changed
    if (interview.type === 'video' && interview.meetEventId && (scheduledAt || duration)) {
      try {
        const endTime = new Date(interview.scheduledAt.getTime() + interview.duration * 60000);
        await updateGMeetEvent(interview.meetEventId, {
          startTime: interview.scheduledAt,
          endTime
        });
      } catch (error) {
        logger.error('Google Meet update error:', error);
      }
    }

    await interview.save();

    // Populate references
    await interview.populate([
      { path: 'job', select: 'title company' },
      { path: 'candidate', select: 'firstName lastName email' },
      { path: 'interviewer', select: 'firstName lastName email' }
    ]);

    res.json({
      message: 'Interview updated successfully',
      interview
    });

  } catch (error) {
    logger.error('Update interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/video/interviews/:id
// @desc    Cancel interview
// @access  Private
router.delete('/interviews/:id', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Only interviewer can cancel
    if (interview.interviewer.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this interview' });
    }

    // Delete Google Meet event if exists
    if (interview.meetEventId) {
      try {
        await deleteGMeetEvent(interview.meetEventId);
      } catch (error) {
        logger.error('Google Meet deletion error:', error);
      }
    }

    await Interview.findByIdAndDelete(id);

    // Emit to Socket.IO for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${interview.candidate}`).emit('interview:cancelled', {
        interviewId: id,
        job: interview.job
      });
    }

    res.json({ message: 'Interview cancelled successfully' });

  } catch (error) {
    logger.error('Cancel interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/video/interviews/:id/join
// @desc    Join video interview
// @access  Private
router.post('/interviews/:id/join', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const interview = await Interview.findById(id)
      .populate('job', 'title company')
      .populate('candidate', 'firstName lastName email')
      .populate('interviewer', 'firstName lastName email');

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Check if user is part of the interview
    if (interview.candidate.toString() !== userId && interview.interviewer.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to join this interview' });
    }

    // Check if interview is scheduled and not too early/late
    const now = new Date();
    const interviewStart = new Date(interview.scheduledAt);
    const interviewEnd = new Date(interview.scheduledAt.getTime() + interview.duration * 60000);

    if (now < interviewStart.getTime() - 15 * 60000) { // 15 minutes early
      return res.status(400).json({ error: 'Interview has not started yet' });
    }

    if (now > interviewEnd) {
      return res.status(400).json({ error: 'Interview has ended' });
    }

    // Update interview status if needed
    if (interview.status === 'scheduled') {
      interview.status = 'in_progress';
      interview.startedAt = now;
      await interview.save();
    }

    res.json({
      message: 'Joining interview',
      interview,
      meetLink: interview.meetLink
    });

  } catch (error) {
    logger.error('Join interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/video/interviews/:id/end
// @desc    End video interview
// @access  Private
router.post('/interviews/:id/end', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { id } = req.params;
    const { feedback, rating, notes } = req.body;
    const userId = req.user.userId;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Only interviewer can end and provide feedback
    if (interview.interviewer.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to end this interview' });
    }

    interview.status = 'completed';
    interview.endedAt = new Date();
    interview.feedback = feedback;
    interview.rating = rating;
    interview.interviewerNotes = notes;

    await interview.save();

    // Emit to Socket.IO for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${interview.candidate}`).emit('interview:completed', {
        interviewId: id,
        feedback,
        rating
      });
    }

    res.json({
      message: 'Interview ended successfully',
      interview
    });

  } catch (error) {
    logger.error('End interview error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/video/meet-link/:interviewId
// @desc    Get or create Google Meet link for interview
// @access  Private
router.get('/meet-link/:interviewId', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const { interviewId } = req.params;
    const userId = req.user.userId;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Check if user is part of the interview
    if (interview.candidate.toString() !== userId && interview.interviewer.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this interview' });
    }

    // If meet link already exists, return it
    if (interview.meetLink) {
      return res.json({ meetLink: interview.meetLink });
    }

    // Create new meet link if it's a video interview
    if (interview.type === 'video') {
      try {
        const meetEvent = await createGMeetEvent({
          summary: `Interview: ${interview.job.title} - ${interview.candidate.firstName} ${interview.candidate.lastName}`,
          description: `Interview for ${interview.job.title} position`,
          startTime: interview.scheduledAt,
          endTime: new Date(interview.scheduledAt.getTime() + interview.duration * 60000),
          attendees: [
            { email: interview.candidate.email, displayName: `${interview.candidate.firstName} ${interview.candidate.lastName}` },
            { email: interview.interviewer.email, displayName: `${interview.interviewer.firstName} ${interview.interviewer.lastName}` }
          ]
        });

        interview.meetLink = meetEvent.hangoutLink;
        interview.meetEventId = meetEvent.id;
        await interview.save();

        res.json({ meetLink: interview.meetLink });
      } catch (error) {
        logger.error('Google Meet creation error:', error);
        res.status(500).json({ error: 'Failed to create meet link' });
      }
    } else {
      res.status(400).json({ error: 'This interview is not a video interview' });
    }

  } catch (error) {
    logger.error('Get meet link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/video/upcoming
// @desc    Get upcoming interviews
// @access  Private
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    if (!Interview) {
      return res.status(503).json({ error: 'Interview model not available' });
    }

    const userId = req.user.userId;
    const { limit = 5 } = req.query;

    const upcomingInterviews = await Interview.find({
      $or: [
        { candidate: userId },
        { interviewer: userId }
      ],
      scheduledAt: { $gt: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    })
    .populate('job', 'title company')
    .populate('candidate', 'firstName lastName email')
    .populate('interviewer', 'firstName lastName email')
    .sort({ scheduledAt: 1 })
    .limit(parseInt(limit));

    res.json({ upcomingInterviews });

  } catch (error) {
    logger.error('Get upcoming interviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
