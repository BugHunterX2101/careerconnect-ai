const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 'employer' is stored alongside 'employerId' so both legacy queries
  // (employer: req.user.userId) and new queries work without migration
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String
    },
    website: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      default: 'medium'
    },
    industry: {
      type: String,
      trim: true
    }
  },
  location: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    isRemote: {
      type: Boolean,
      default: false
    },
    remoteType: {
      type: String,
      enum: ['on-site', 'hybrid', 'remote'],
      default: 'on-site'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  requirements: {
    skills: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      level: {
        type: String,
        enum: ['required', 'preferred', 'nice-to-have'],
        default: 'required'
      },
      yearsOfExperience: {
        type: Number,
        min: 0
      }
    }],
    experience: {
      minYears: {
        type: Number,
        min: 0,
        default: 0
      },
      maxYears: {
        type: Number,
        min: 0
      }
    },
    education: {
      minimumDegree: {
        type: String,
        enum: ['high_school', 'associate', 'bachelor', 'master', 'phd'],
        default: 'bachelor'
      },
      preferredFields: [{
        type: String,
        trim: true
      }]
    },
    certifications: [{
      type: String,
      trim: true
    }]
  },
  benefits: {
    salary: {
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      },
      period: {
        type: String,
        enum: ['hourly', 'monthly', 'yearly'],
        default: 'yearly'
      },
      isNegotiable: {
        type: Boolean,
        default: true
      }
    },
    perks: [{
      type: String,
      trim: true
    }],
    healthInsurance: {
      type: Boolean,
      default: false
    },
    dentalInsurance: {
      type: Boolean,
      default: false
    },
    visionInsurance: {
      type: Boolean,
      default: false
    },
    retirementPlan: {
      type: Boolean,
      default: false
    },
    paidTimeOff: {
      type: Number,
      min: 0
    },
    flexibleHours: {
      type: Boolean,
      default: false
    }
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true
  },
  seniorityLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid-level', 'senior', 'lead', 'manager', 'director', 'executive'],
    default: 'mid-level'
  },
  // AI Analysis and Matching
  aiAnalysis: {
    extractedKeywords: [{
      keyword: String,
      confidence: Number,
      category: String
    }],
    requiredSkills: [{
      skill: String,
      importance: Number,
      frequency: Number
    }],
    jobCategory: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    complexity: {
      type: String,
      enum: ['entry', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    marketDemand: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    salaryCompetitiveness: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  // Application tracking
  applications: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['applied', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'rejected', 'withdrawn'],
      default: 'applied'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  // Job status and visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'expired'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  applicationsCount: {
    type: Number,
    default: 0
  },
  // Dates
  postedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  applicationDeadline: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
jobSchema.index({ employerId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ 'location.city': 1, 'location.country': 1 });
jobSchema.index({ 'requirements.skills.name': 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ seniorityLevel: 1 });
jobSchema.index({ 'aiAnalysis.jobCategory': 1 });
jobSchema.index({ 'aiAnalysis.industry': 1 });
jobSchema.index({ postedAt: -1 });
jobSchema.index({ isFeatured: 1, isUrgent: 1 });
jobSchema.index({ 'benefits.salary.min': 1, 'benefits.salary.max': 1 });

// Virtual for salary range display
jobSchema.virtual('salaryRange').get(function() {
  if (!this.benefits.salary.min && !this.benefits.salary.max) {
    return 'Not specified';
  }
  
  const currency = this.benefits.salary.currency || 'USD';
  const period = this.benefits.salary.period || 'yearly';
  
  if (this.benefits.salary.min && this.benefits.salary.max) {
    return `${currency} ${this.benefits.salary.min.toLocaleString()} - ${this.benefits.salary.max.toLocaleString()} per ${period}`;
  } else if (this.benefits.salary.min) {
    return `${currency} ${this.benefits.salary.min.toLocaleString()}+ per ${period}`;
  } else {
    return `${currency} Up to ${this.benefits.salary.max.toLocaleString()} per ${period}`;
  }
});

// Virtual for days since posted
jobSchema.virtual('daysSincePosted').get(function() {
  const now = new Date();
  const posted = new Date(this.postedAt);
  const diffTime = Math.abs(now - posted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is expired
jobSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
});

// Virtual for application rate
jobSchema.virtual('applicationRate').get(function() {
  if (this.views === 0) return 0;
  return Math.round((this.applicationsCount / this.views) * 100);
});

// Instance method to increment views
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to add application
jobSchema.methods.addApplication = function(userId, resumeId, matchScore = 0) {
  this.applications.push({
    userId,
    resumeId,
    matchScore
  });
  this.applicationsCount += 1;
  return this.save();
};

// Static method to find jobs by skills
jobSchema.statics.findBySkills = function(skills, limit = 20) {
  return this.find({
    'requirements.skills.name': { $in: skills },
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ isFeatured: -1, postedAt: -1 })
  .limit(limit);
};

// Static method to find jobs by location
jobSchema.statics.findByLocation = function(city, country, limit = 20) {
  return this.find({
    'location.city': new RegExp(city, 'i'),
    'location.country': new RegExp(country, 'i'),
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ isFeatured: -1, postedAt: -1 })
  .limit(limit);
};

// Static method to find remote jobs
jobSchema.statics.findRemoteJobs = function(limit = 20) {
  return this.find({
    'location.isRemote': true,
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ isFeatured: -1, postedAt: -1 })
  .limit(limit);
};

// Static method to find featured jobs
jobSchema.statics.findFeaturedJobs = function(limit = 10) {
  return this.find({
    isFeatured: true,
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ postedAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Job', jobSchema);
