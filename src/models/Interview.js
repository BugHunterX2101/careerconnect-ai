const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 180 // 3 hours max
  },
  type: {
    type: String,
    enum: ['phone', 'video', 'onsite'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  meetLink: {
    type: String,
    trim: true
  },
  meetEventId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  feedback: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  interviewerNotes: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  startedAt: Date,
  endedAt: Date,
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
interviewSchema.index({ candidate: 1, scheduledAt: -1 });
interviewSchema.index({ interviewer: 1, scheduledAt: -1 });
interviewSchema.index({ job: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ scheduledAt: 1 });
interviewSchema.index({ type: 1 });

// Virtual for interview end time
interviewSchema.virtual('endTime').get(function() {
  if (!this.scheduledAt || !this.duration) return null;
  return new Date(this.scheduledAt.getTime() + this.duration * 60000);
});

// Virtual for interview duration in minutes
interviewSchema.virtual('durationMinutes').get(function() {
  return this.duration;
});

// Virtual for is upcoming
interviewSchema.virtual('isUpcoming').get(function() {
  return this.scheduledAt > new Date() && this.status === 'scheduled';
});

// Virtual for is ongoing
interviewSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.scheduledAt <= now && this.endTime >= now && this.status === 'in_progress';
});

// Virtual for is past
interviewSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Method to start interview
interviewSchema.methods.start = function() {
  this.status = 'in_progress';
  this.startedAt = new Date();
  return this.save();
};

// Method to end interview
interviewSchema.methods.end = function(feedback, rating, notes) {
  this.status = 'completed';
  this.endedAt = new Date();
  if (feedback) this.feedback = feedback;
  if (rating) this.rating = rating;
  if (notes) this.interviewerNotes = notes;
  return this.save();
};

// Method to cancel interview
interviewSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Method to reschedule interview
interviewSchema.methods.reschedule = function(newScheduledAt, newDuration) {
  this.status = 'cancelled';
  this.rescheduledTo = newScheduledAt;
  if (newDuration) this.duration = newDuration;
  return this.save();
};

// Static method to get upcoming interviews for a user
interviewSchema.statics.getUpcoming = async function(userId, limit = 10) {
  return await this.find({
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
  .limit(limit);
};

// Static method to get interviews with conflicts
interviewSchema.statics.findConflicts = async function(userId, startTime, endTime, excludeId = null) {
  const query = {
    $or: [
      { candidate: userId },
      { interviewer: userId }
    ],
    scheduledAt: { $lt: endTime },
    status: { $in: ['scheduled', 'confirmed'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const interviews = await this.find(query);
  
  return interviews.filter(interview => {
    const interviewEnd = new Date(interview.scheduledAt.getTime() + interview.duration * 60000);
    return interviewEnd > startTime;
  });
};

// Pre-save middleware to validate scheduling
interviewSchema.pre('save', async function(next) {
  if (this.isModified('scheduledAt') || this.isModified('duration')) {
    // Check for conflicts
    const conflicts = await this.constructor.findConflicts(
      this.interviewer,
      this.scheduledAt,
      this.endTime,
      this._id
    );

    if (conflicts.length > 0) {
      return next(new Error('Scheduling conflict detected'));
    }

    // Check candidate conflicts
    const candidateConflicts = await this.constructor.findConflicts(
      this.candidate,
      this.scheduledAt,
      this.endTime,
      this._id
    );

    if (candidateConflicts.length > 0) {
      return next(new Error('Candidate has a scheduling conflict'));
    }
  }

  next();
});

// Post-save middleware to send notifications
interviewSchema.post('save', async function() {
  if (this.isNew) {
    // Send notification to candidate
    try {
      const io = this.constructor.db.connection.client.topology.s.options.io;
      if (io) {
        io.to(`user_${this.candidate}`).emit('interview:scheduled', {
          interviewId: this._id,
          jobTitle: this.job.title,
          scheduledAt: this.scheduledAt,
          interviewer: this.interviewer
        });
      }
    } catch (error) {
      console.error('Error sending interview notification:', error);
    }
  }
});

module.exports = mongoose.model('Interview', interviewSchema);
