const express = require('express');
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
const { rateLimit } = require('express-rate-limit');
const logger = require('../middleware/logger');

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

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'firstName lastName email profile.avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

    const total = await Conversation.countDocuments({
      participants: userId
    });

    res.json({
      conversations,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('Get conversations error:', error);
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

    const { participantIds, title, type = 'direct' } = req.body;
    const userId = req.user.userId;

    // Validate participants
    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    // Add current user to participants if not already included
    const allParticipants = [...new Set([userId, ...participantIds])];

    // Check if conversation already exists (for direct messages)
    if (type === 'direct' && allParticipants.length === 2) {
      const existingConversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: allParticipants.length }
      });

      if (existingConversation) {
        return res.json({
          message: 'Conversation already exists',
          conversation: existingConversation
        });
      }
    }

    // Verify all participants exist
    const participants = await User.find({
      _id: { $in: allParticipants }
    }).select('firstName lastName email');

    if (participants.length !== allParticipants.length) {
      return res.status(400).json({ error: 'One or more participants not found' });
    }

    // Create conversation
    const conversation = new Conversation({
      title: title || `${participants.map(p => p.firstName).join(', ')}`,
      type,
      participants: allParticipants,
      createdBy: userId
    });

    await conversation.save();

    // Populate participants for response
    await conversation.populate('participants', 'firstName lastName email profile.avatar');

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

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    })
    .populate('participants', 'firstName lastName email profile.avatar')
    .populate('lastMessage');

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

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Only allow updates for group conversations or if user is creator
    if (conversation.type === 'direct' && conversation.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this conversation' });
    }

    if (title) {
      conversation.title = title;
    }

    if (participantIds) {
      // Validate new participants
      const participants = await User.find({
        _id: { $in: participantIds }
      });

      if (participants.length !== participantIds.length) {
        return res.status(400).json({ error: 'One or more participants not found' });
      }

      conversation.participants = participantIds;
    }

    await conversation.save();
    await conversation.populate('participants', 'firstName lastName email profile.avatar');

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
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Build query
    const query = { conversation: id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName email profile.avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Message.countDocuments({ conversation: id });

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
    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create message
    const messageData = {
      conversation: id,
      sender: userId,
      content,
      type: 'text'
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    if (req.file) {
      messageData.type = 'file';
      messageData.attachment = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      };
    }

    const message = new Message(messageData);
    await message.save();

    // Update conversation's last message and timestamp
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender for response
    await message.populate('sender', 'firstName lastName email profile.avatar');

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
      message: message
    });

  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:id
// @desc    Edit a message
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

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns the message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
      return res.status(400).json({ error: 'Message is too old to edit' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'firstName lastName email profile.avatar');

    res.json({
      message: 'Message updated successfully',
      message: message
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

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns the message or is admin
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(id);

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
      { _id: id, participants: userId },
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
      content: { $regex: q, $options: 'i' }
    };

    if (conversationId) {
      // Verify user is part of conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      searchQuery.conversation = conversationId;
    } else {
      // Search across all user's conversations
      const userConversations = await Conversation.find({
        participants: userId
      }).select('_id');

      searchQuery.conversation = { $in: userConversations.map(c => c._id) };
    }

    const messages = await Message.find(searchQuery)
      .populate('sender', 'firstName lastName email profile.avatar')
      .populate('conversation', 'title')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Message.countDocuments(searchQuery);

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

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.attachment) {
      return res.status(404).json({ error: 'No attachment found' });
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to access this attachment' });
    }

    res.set({
      'Content-Type': message.attachment.mimetype,
      'Content-Disposition': `attachment; filename="${message.attachment.filename}"`,
      'Content-Length': message.attachment.size
    });

    res.send(message.attachment.data);

  } catch (error) {
    logger.error('Get attachment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
