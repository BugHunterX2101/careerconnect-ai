const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
let csrf;
let csrfProtection;
const getCsrfProtection = () => {
  if (!csrf) {
    csrf = require('csurf');
    csrfProtection = csrf({ cookie: true });
  }
  return csrfProtection;
};
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
const userModelModule = require('../models/User');
let logger;
const getLogger = () => {
  if (!logger) {
    logger = require('../middleware/logger');
  }
  return logger;
};

const chatMemoryStore = {
  conversations: new Map(),
  messages: new Map(),
  conversationSeq: 1,
  messageSeq: 1
};

const toUserId = (value) => String(value);
const isMongoObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));
const useInMemoryChat = (userId, participantIds = []) => {
  return !isMongoObjectId(userId) || participantIds.some((id) => !isMongoObjectId(id));
};

const getSqlUserModel = () => {
  if (typeof userModelModule?.User === 'function') {
    try {
      return userModelModule.User();
    } catch (error) {
      return null;
    }
  }
  return null;
};

const loadUserProfiles = async (participantIds) => {
  const UserModel = getSqlUserModel();
  const ids = [...new Set(participantIds.map(toUserId))];

  if (!UserModel) {
    const fallback = new Map();
    ids.forEach((id) => {
      fallback.set(id, {
        _id: id,
        id,
        firstName: 'User',
        lastName: id,
        email: ''
      });
    });
    return fallback;
  }

  const users = await Promise.all(ids.map(async (id) => {
    try {
      return await UserModel.findByPk(Number(id));
    } catch (error) {
      return null;
    }
  }));

  const userMap = new Map();
  users.forEach((user, index) => {
    const id = ids[index];
    if (user) {
      userMap.set(id, {
        _id: id,
        id,
        firstName: user.firstName || 'User',
        lastName: user.lastName || id,
        email: user.email || ''
      });
    } else {
      userMap.set(id, {
        _id: id,
        id,
        firstName: 'User',
        lastName: id,
        email: ''
      });
    }
  });

  return userMap;
};

const serializeMemoryMessage = async (message) => {
  const profiles = await loadUserProfiles([message.senderId]);
  return {
    _id: message._id,
    conversation: message.conversationId,
    sender: profiles.get(message.senderId),
    content: message.content,
    type: message.type,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
};

const serializeMemoryConversation = async (conversation) => {
  const profiles = await loadUserProfiles(conversation.participantIds);
  let lastMessage = null;
  if (conversation.lastMessageId) {
    const message = chatMemoryStore.messages.get(conversation.lastMessageId);
    if (message) {
      lastMessage = await serializeMemoryMessage(message);
    }
  }

  return {
    _id: conversation._id,
    title: conversation.title,
    type: conversation.type,
    participants: conversation.participantIds.map((id) => profiles.get(id)),
    createdBy: conversation.createdBy,
    lastMessage,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt
  };
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
    const userId = toUserId(req.user.userId);
    if (useInMemoryChat(userId)) {
      const { page = 1, limit = 20 } = req.query;
      const items = Array.from(chatMemoryStore.conversations.values())
        .filter((conversation) => conversation.participantIds.includes(userId))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const paged = items.slice(start, start + parseInt(limit, 10));
      const conversations = await Promise.all(paged.map(serializeMemoryConversation));

      return res.json({
        conversations,
        total: items.length,
        page: parseInt(page, 10),
        totalPages: Math.ceil(items.length / parseInt(limit, 10)) || 0
      });
    }

    if (!Conversation) {
      return res.status(503).json({ error: 'Conversation model not available' });
    }

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
    getLogger().error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantIds, title, type = 'direct' } = req.body;
    const userId = toUserId(req.user.userId);

    if (useInMemoryChat(userId, participantIds || [])) {
      if (!participantIds || participantIds.length === 0) {
        return res.status(400).json({ error: 'At least one participant is required' });
      }

      const allParticipants = [...new Set([userId, ...participantIds.map(toUserId)])];
      if (type === 'direct' && allParticipants.length === 2) {
        const existing = Array.from(chatMemoryStore.conversations.values()).find((conversation) => {
          return conversation.type === 'direct' &&
            conversation.participantIds.length === 2 &&
            allParticipants.every((id) => conversation.participantIds.includes(id));
        });

        if (existing) {
          return res.json({
            message: 'Conversation already exists',
            conversation: await serializeMemoryConversation(existing)
          });
        }
      }

      const profiles = await loadUserProfiles(allParticipants);
      const fallbackTitle = allParticipants
        .map((id) => profiles.get(id))
        .filter(Boolean)
        .map((profile) => profile.firstName)
        .join(', ');

      const conversation = {
        _id: `local-c-${chatMemoryStore.conversationSeq++}`,
        title: title || fallbackTitle || 'Direct Conversation',
        type,
        participantIds: allParticipants,
        createdBy: userId,
        lastMessageId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      chatMemoryStore.conversations.set(conversation._id, conversation);

      return res.status(201).json({
        message: 'Conversation created successfully',
        conversation: await serializeMemoryConversation(conversation)
      });
    }

    if (!Conversation || !User) {
      return res.status(503).json({ error: 'Models not available' });
    }

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
    getLogger().error('Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get conversation details
// @access  Private
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const userId = toUserId(req.user.userId);
    if (useInMemoryChat(userId)) {
      const conversation = chatMemoryStore.conversations.get(req.params.id);
      if (!conversation || !conversation.participantIds.includes(userId)) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      return res.json({ conversation: await serializeMemoryConversation(conversation) });
    }

    if (!Conversation) {
      return res.status(503).json({ error: 'Conversation model not available' });
    }

    const { id } = req.params;

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
    getLogger().error('Get conversation error:', error);
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
    getLogger().error('Update conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/chat/conversations/:id/messages
// @desc    Get messages for a conversation
// @access  Private
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const userId = toUserId(req.user.userId);
    if (useInMemoryChat(userId)) {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const conversation = chatMemoryStore.conversations.get(id);

      if (!conversation || !conversation.participantIds.includes(userId)) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const list = Array.from(chatMemoryStore.messages.values())
        .filter((message) => message.conversationId === id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const paged = list.slice(start, start + parseInt(limit, 10));
      const messages = await Promise.all(paged.map(serializeMemoryMessage));

      return res.json({
        messages,
        total: list.length,
        page: parseInt(page, 10),
        totalPages: Math.ceil(list.length / parseInt(limit, 10)) || 0
      });
    }

    if (!Message || !Conversation) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const { id } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const mongoUserId = req.user.userId;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: id,
      participants: mongoUserId
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
    getLogger().error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message
// @access  Private
router.post('/conversations/:id/messages', authenticateToken, messageLimiter, upload.single('attachment'), validateMessage, async (req, res) => {
  try {
    const userId = toUserId(req.user.userId);
    if (useInMemoryChat(userId)) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const conversation = chatMemoryStore.conversations.get(id);
      if (!conversation || !conversation.participantIds.includes(userId)) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const message = {
        _id: `local-m-${chatMemoryStore.messageSeq++}`,
        conversationId: id,
        senderId: userId,
        content: req.body.content,
        type: req.file ? 'file' : 'text',
        attachment: req.file ? {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          data: req.file.buffer
        } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      chatMemoryStore.messages.set(message._id, message);
      conversation.lastMessageId = message._id;
      conversation.updatedAt = new Date().toISOString();
      chatMemoryStore.conversations.set(id, conversation);

      const responseMessage = await serializeMemoryMessage(message);
      const io = req.app.get('io');
      if (io) {
        conversation.participantIds.forEach((participantId) => {
          if (participantId !== userId) {
            io.to(`user_${participantId}`).emit('chat:new_message', {
              conversationId: id,
              message: responseMessage
            });
          }
        });
      }

      return res.status(201).json({
        message: 'Message sent successfully',
        data: responseMessage
      });
    }

    if (!Message || !Conversation) {
      return res.status(503).json({ error: 'Models not available' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content, replyTo } = req.body;
    const mongoUserId = req.user.userId;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: id,
      participants: mongoUserId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create message
    const messageData = {
      conversation: id,
      sender: mongoUserId,
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
        if (participantId.toString() !== mongoUserId) {
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
    getLogger().error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:id
// @desc    Update a message
// @access  Private
router.put('/messages/:id', authenticateToken, getCsrfProtection(), validateMessage, async (req, res) => {
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
      data: message
    });

  } catch (error) {
    getLogger().error('Edit message error:', error);
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
    getLogger().error('Delete message error:', error);
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
    getLogger().error('Mark as read error:', error);
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
    getLogger().error('Search messages error:', error);
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
    getLogger().error('Get attachment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
