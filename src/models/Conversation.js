const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1, participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ 'unreadBy': 1 });

// Virtual for unread count
conversationSchema.virtual('unreadCount').get(function() {
  return this.unreadBy.length;
});

// Ensure participants array has at least 2 users for direct conversations
conversationSchema.pre('save', function(next) {
  if (this.type === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct conversations must have exactly 2 participants'));
  }
  next();
});

// Method to add participant
conversationSchema.methods.addParticipant = function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
  return this.save();
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Method to mark as unread for a user
conversationSchema.methods.markAsUnread = function(userId) {
  if (!this.unreadBy.includes(userId)) {
    this.unreadBy.push(userId);
  }
  return this.save();
};

// Method to mark as read for a user
conversationSchema.methods.markAsRead = function(userId) {
  this.unreadBy = this.unreadBy.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function(userId1, userId2) {
  const conversation = await this.findOne({
    type: 'direct',
    participants: { $all: [userId1, userId2], $size: 2 }
  });

  if (conversation) {
    return conversation;
  }

  // Get user names for conversation title
  const User = mongoose.model('User');
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select('firstName lastName'),
    User.findById(userId2).select('firstName lastName')
  ]);

  const title = `${user1.firstName} ${user1.lastName}, ${user2.firstName} ${user2.lastName}`;

  return new this({
    title,
    type: 'direct',
    participants: [userId1, userId2],
    createdBy: userId1
  }).save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
