const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  attachment: {
    filename: String,
    mimetype: String,
    size: Number,
    data: Buffer
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ type: 1 });

// Virtual for formatted content
messageSchema.virtual('formattedContent').get(function() {
  if (this.type === 'file') {
    return `📎 ${this.attachment.filename}`;
  }
  return this.content;
});

// Virtual for is read by specific user
messageSchema.virtual('isRead').get(function() {
  return this.readBy.length > 0;
});

// Method to mark as read by a user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId });
  }
  return this.save();
};

// Method to check if read by a specific user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Static method to get unread count for a user in a conversation
messageSchema.statics.getUnreadCount = async function(conversationId, userId) {
  return await this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId }
  });
};

// Pre-save middleware to update conversation's last message
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Conversation = mongoose.model('Conversation');
      await Conversation.findByIdAndUpdate(this.conversation, {
        lastMessage: this._id,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating conversation last message:', error);
    }
  }
  next();
});

// Post-save middleware to mark as unread for other participants
messageSchema.post('save', async function() {
  if (this.isNew) {
    try {
      const Conversation = mongoose.model('Conversation');
      const conversation = await Conversation.findById(this.conversation);
      
      if (conversation) {
        // Mark as unread for all participants except sender
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== this.sender.toString()) {
            conversation.markAsUnread(participantId);
          }
        });
      }
    } catch (error) {
      console.error('Error marking conversation as unread:', error);
    }
  }
});

module.exports = mongoose.model('Message', messageSchema);
