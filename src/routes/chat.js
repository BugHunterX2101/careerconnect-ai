const { Op } = require('sequelize');
const express = require('express');

// Sequelize model resolver — handles both getter-function and direct exports
const resolveModel = (mod) => {
  if (!mod) return null;
  if (typeof mod === 'function' && !mod.findAll) {
    try { return mod(); } catch (_) { return null; }
  }
  if (mod && typeof mod === 'object') {
    const keys = Object.keys(mod);
    for (const k of keys) {
      if (typeof mod[k] === 'function') {
        try {
          const r = mod[k]();
          if (r && r.findAll) return r;
        } catch (_) { /* ignore */ }
      }
    }
  }
  return mod;
};

const multer = require('multer');
const { body, validationResult } = require('express-validator');
// Try to import models (optional)
let Conversation = null;
let Message = null;
let User = null;

try {
  Conversation = require('../models/Conversation');
} catch (error) {
  console.warn('Conversation model not available:', error.message);
}

try {
  Message = require('../models/Message');
} catch (error) {
  console.warn('Message model not available:', error.message);
}

try {
  User = require('../models/User');
} catch (error) {
  console.warn('User model not available:', error.message);
}

const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
let logger;
const getLogger = () => {
  if (!logger) {
    logger = require('../middleware/logger');
  }
  return logger;
};

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Rate limiting
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 messages per minute
  message: 'Too many messages, please slow down.',
});

// Validation middleware
const validateMessage = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
];

// @route   GET /api/chat/health
// @desc    Check chat system health
// @access  Public
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      services: {
        conversation: Conversation ? 'available' : 'unavailable',
        message: Message ? 'available' : 'unavailable',
        user: User ? 'available' : 'unavailable'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    if (!Conversation) {
      return res.status(503).json({ error: 'Conversation model not available' });
    }

    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conversations = await resolveModel(Conversation).findAll({
      where: { participants: { [Op.like]: `%${userId}%` } },
      order: [['updatedAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    const total = conversations.length;

    res.json({
      conversations,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    getLogger().logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    if (!Conversation || !User) {
      return res.status(503).json({ error: 'Models not available' });
    }

    // Accept both participantId (singular) and participantIds (plural)
    const rawParticipants = req.body.participantIds || (req.body.participantId ? [req.body.participantId] : []);
    const { title, type = 'direct', message: firstMessage } = req.body;
    const userId = parseInt(req.user.userId, 10);

    if (rawParticipants.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    const allParticipants = [...new Set([userId, ...rawParticipants.map(Number)])];

    // Check for existing direct conversation (stored as JSON array in SQLite)
    const ConvModel = resolveModel(Conversation);
    const UserModel = resolveModel(User);

    if (type === 'direct' && allParticipants.length === 2) {
      const existing = await ConvModel.findOne({ where: { type: 'direct' } });
      if (existing && existing.participants.map(Number).sort().join(',') === allParticipants.sort().join(',')) {
        return res.json({ message: 'Conversation already exists', conversation: existing });
      }
    }

    // Verify participants exist
    const participantRecords = await UserModel.findAll({
      where: { id: allParticipants },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    const conversationTitle = title || participantRecords.map(p => p.firstName).join(', ') || 'Conversation';

    const conversation = await ConvModel.create({
      title: conversationTitle,
      type,
      participants: allParticipants,
      createdById: userId,
      unreadBy: allParticipants.filter(id => id !== userId)
    });

    // Optionally create the first message
    if (firstMessage) {
      const MsgModel = resolveModel(Message);
      if (MsgModel) {
        await MsgModel.create({
          conversationId: conversation.id,
          senderId: userId,
          content: firstMessage,
          type: 'text'
        });
      }
    }

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation
    });

  } catch (error) {
    logger.error('Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get conversation details
// @access  Private
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    if (!Conversation) {
      return res.status(503).json({ error: 'Conversation model not available' });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const conversation = await resolveModel(Conversation).findOne({ where: {
      id: parseInt(id, 10),
      participants: { [Op.like]: `%${parseInt(userId,10)}%` }
    } })
    
    ;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });

  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/chat/conversations/:id
// @desc    Update conversation (title, participants)
// @access  Private
router.put('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    if (!Conversation) {
      return res.status(503).json({ error: 'Conversation model not available' });
    }

    const { id } = req.params;
    const { title, participantIds } = req.body;
    const userId = req.user.userId;

    const conversation = await resolveModel(Conversation).findOne({ where: {
      id: parseInt(id, 10),
      participants: { [Op.like]: `%${parseInt(userId,10)}%` }
    } });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Only allow updates for group conversations or if user is creator
    if (conversation.type === 'direct' && String(conversation.createdById) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to update this conversation' });
    }

    const updates = {};
    if (title) updates.title = title;

    if (participantIds) {
      const UserModel = resolveModel(User);
      const participants = UserModel
        ? await UserModel.findAll({ where: { id: participantIds } })
        : [];
      if (participants.length !== participantIds.length) {
        return res.status(400).json({ error: 'One or more participants not found' });
      }
      updates.participants = participantIds;
    }

    await conversation.update(updates);

    res.json({
      message: 'Conversation updated successfully',
      conversation
    });

  } catch (error) {
    logger.error('Update conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id/messages
// @desc    Get messages for a conversation
// @access  Private
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    if (!Message || !Conversation) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const { id } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user.userId;

    // Verify user is part of conversation
    const conversation = await resolveModel(Conversation).findOne({ where: {
      id: parseInt(id, 10),
      participants: { [Op.like]: `%${parseInt(userId,10)}%` }
    } });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Build query
    const query = { conversationId: id };
    if (before) {
      query.createdAt = { [Op.lt]: new Date(before) };
    }

    const msgOffset = (parseInt(page) - 1) * parseInt(limit);
    const messages = await resolveModel(Message).findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: msgOffset,
      limit: parseInt(limit)
    });

    const total = await resolveModel(Message).count({ where: { conversationId: id } });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message
// @access  Private
router.post('/conversations/:id/messages', authenticateToken, messageLimiter, upload.single('attachment'), validateMessage, async (req, res) => {
  try {
    if (!Message || !Conversation) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content, replyTo } = req.body;
    const userId = req.user.userId;

    // Verify user is part of conversation
    const conversation = await resolveModel(Conversation).findOne({ where: {
      id: parseInt(id, 10),
      participants: { [Op.like]: `%${parseInt(userId,10)}%` }
    } });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create message
    const messageData = {
      conversationId: id,
      senderId: parseInt(userId, 10),
      content,
      type: 'text'
    };

    if (replyTo) messageData.replyToId = parseInt(replyTo, 10);

    if (req.file) {
      messageData.type = 'file';
      messageData.attachment = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        // Store file path reference, not raw buffer, to avoid memory exhaustion
        path: req.file.path || null
      };
    }

    const message = await resolveModel(Message).create(messageData);

    // Update conversation's lastMessageId
    await conversation.update({ lastMessageId: message.id });

    // Emit to Socket.IO for real-time delivery
    const io = req.app.get('io');
    if (io) {
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== userId) {
          io.to(`user_${participantId}`).emit('chat:new_message', {
            conversationId: id,
            message
          });
        }
      });
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:id
// @desc    Update a message
// @access  Private
router.put('/messages/:id', authenticateToken, validateMessage, async (req, res) => {
  try {
    if (!Message) {
      return res.status(503).json({ error: 'Message model not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const message = await resolveModel(Message).findByPk(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns the message
    if (String(message.senderId) !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
      return res.status(400).json({ error: 'Message is too old to edit' });
    }

    await message.update({ content, edited: true, editedAt: new Date() });

    res.json({
      message: 'Message updated successfully',
      data: message
    });

  } catch (error) {
    logger.error('Edit message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/chat/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/messages/:id', authenticateToken, async (req, res) => {
  try {
    if (!Message) {
      return res.status(503).json({ error: 'Message model not available' });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    const message = await resolveModel(Message).findByPk(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns the message or is admin
    if (String(message.senderId) !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await (async () => { const _d = await resolveModel(Message).findByPk(id); if (_d) await _d.destroy(); })();

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/read
// @desc    Mark conversation as read
// @access  Private
router.post('/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    if (!Conversation) {
      return res.status(503).json({ error: 'Conversation model not available' });
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Update unread count for this user in this conversation
    await Conversation.updateOne(
      { id: id, participants: userId },
      { $pull: { unreadBy: userId } }
    );

    res.json({ message: 'Conversation marked as read' });

  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/search
// @desc    Search messages
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    if (!Message) {
      return res.status(503).json({ error: 'Message model not available' });
    }

    const { q, conversationId, page = 1, limit = 20 } = req.query;
    const userId = req.user.userId;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Build search query
    const searchQuery = {
      content: { [Op.like]: q, $options: 'i' }
    };

    if (conversationId) {
      // Verify user is part of conversation
      const conversation = await resolveModel(Conversation).findOne({ where: {
        _id: conversationId,
        participants: userId
      } });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      searchQuery.conversation = conversationId;
    } else {
      // Search across all user's conversations
      const userConversations = await resolveModel(Conversation).findAll({
        where: { participants: { [Op.like]: `%${userId}%` } },
        attributes: ['id']
      });
      searchQuery.conversationId = { [Op.in]: userConversations.map(c => c.id) };
    }

    const searchOffset = (parseInt(page) - 1) * parseInt(limit);
    const messages = await resolveModel(Message).findAll({
      where: searchQuery,
      order: [['createdAt', 'DESC']],
      offset: searchOffset,
      limit: parseInt(limit)
    });

    const total = await resolveModel(Message).count({ where: searchQuery });

    res.json({
      messages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('Search messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/attachments/:messageId
// @desc    Get message attachment
// @access  Private
router.get('/attachments/:messageId', authenticateToken, async (req, res) => {
  try {
    if (!Message) {
      return res.status(503).json({ error: 'Message model not available' });
    }

    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await resolveModel(Message).findByPk(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.attachment) {
      return res.status(404).json({ error: 'No attachment found' });
    }

    // Verify user is part of conversation
    const conversation = await resolveModel(Conversation).findOne({ where: {
      _id: message.conversation,
      participants: userId
    } });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to access this attachment' });
    }

    const sanitizedFilename = message.attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.set({
      'Content-Type': message.attachment.mimetype,
      'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      'Content-Length': message.attachment.size,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'X-Frame-Options': 'DENY'
    });

    res.send(message.attachment.data);

  } catch (error) {
    logger.error('Get attachment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
