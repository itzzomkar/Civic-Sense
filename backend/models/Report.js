const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Infrastructure',
      'Water & Sanitation',
      'Transportation',
      'Environment',
      'Public Safety',
      'Healthcare',
      'Education',
      'Parks & Recreation',
      'Waste Management',
      'Utilities',
      'Housing',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    maxlength: [100, 'Subcategory cannot be more than 100 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in-progress', 'resolved', 'rejected', 'duplicate'],
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      maxlength: [300, 'Address cannot be more than 300 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      maxlength: [50, 'State cannot be more than 50 characters']
    },
    country: {
      type: String,
      default: 'India',
      maxlength: [50, 'Country cannot be more than 50 characters']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function(arr) {
            return arr.length === 2 && 
                   arr[0] >= -180 && arr[0] <= 180 && // longitude
                   arr[1] >= -90 && arr[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates format'
        }
      }
    },
    landmark: {
      type: String,
      maxlength: [100, 'Landmark cannot be more than 100 characters']
    },
    postalCode: {
      type: String,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit postal code']
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: [200, 'Image caption cannot be more than 200 characters']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    size: Number,
    format: String
  }],
  upvotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'duplicate', 'irrelevant', 'other'],
      default: 'other'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  department: {
    type: String,
    enum: ['Public Works', 'Water Department', 'Transportation', 'Environment', 'Health', 'Parks & Recreation', 'Police', 'Fire Department', 'Other']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'in-progress', 'resolved', 'rejected', 'duplicate'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason cannot be more than 500 characters']
    },
    attachments: [{
      url: String,
      description: String
    }],
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'qr'],
      default: 'web'
    },
    userAgent: String,
    ipAddress: String,
    sessionId: String
  },
  notifications: {
    emailSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false }
  },
  resolution: {
    description: {
      type: String,
      maxlength: [1000, 'Resolution description cannot be more than 1000 characters']
    },
    images: [{
      url: String,
      caption: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    cost: {
      estimated: Number,
      actual: Number,
      currency: { type: String, default: 'INR' }
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    satisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      feedback: {
        type: String,
        maxlength: [500, 'Feedback cannot be more than 500 characters']
      },
      submittedAt: Date
    }
  },
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
reportSchema.index({ 'location.coordinates': '2dsphere' });
reportSchema.index({ userId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ department: 1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'upvotes.userId': 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ visibility: 1, isArchived: 1 });

// Virtual for upvote count
reportSchema.virtual('upvoteCount').get(function() {
  return this.upvotes ? this.upvotes.length : 0;
});

// Virtual for downvote count
reportSchema.virtual('downvoteCount').get(function() {
  return this.downvotes ? this.downvotes.length : 0;
});

// Virtual for net votes
reportSchema.virtual('netVotes').get(function() {
  return this.upvoteCount - this.downvoteCount;
});

// Virtual for comment count
reportSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Virtual for days since creation
reportSchema.virtual('daysSinceCreation').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for current status duration
reportSchema.virtual('statusDuration').get(function() {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    return this.daysSinceCreation;
  }
  
  const lastStatusChange = this.statusHistory[this.statusHistory.length - 1];
  const now = new Date();
  const diffTime = Math.abs(now - lastStatusChange.changedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for full address
reportSchema.virtual('fullAddress').get(function() {
  if (!this.location) return '';
  const parts = [
    this.location.address,
    this.location.city,
    this.location.state,
    this.location.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Pre-save middleware to add initial status history
reportSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory = [{
      status: this.status,
      changedBy: this.userId,
      reason: 'Report created',
      changedAt: new Date()
    }];
  }
  next();
});

// Method to add upvote
reportSchema.methods.addUpvote = function(userId) {
  // Remove any existing upvote from this user
  this.upvotes = this.upvotes.filter(upvote => !upvote.userId.equals(userId));
  // Remove any existing downvote from this user
  this.downvotes = this.downvotes.filter(downvote => !downvote.userId.equals(userId));
  // Add new upvote
  this.upvotes.push({ userId, createdAt: new Date() });
  return this.save();
};

// Method to remove upvote
reportSchema.methods.removeUpvote = function(userId) {
  this.upvotes = this.upvotes.filter(upvote => !upvote.userId.equals(userId));
  return this.save();
};

// Method to add downvote
reportSchema.methods.addDownvote = function(userId, reason = 'other') {
  // Remove any existing upvote from this user
  this.upvotes = this.upvotes.filter(upvote => !upvote.userId.equals(userId));
  // Remove any existing downvote from this user
  this.downvotes = this.downvotes.filter(downvote => !downvote.userId.equals(userId));
  // Add new downvote
  this.downvotes.push({ userId, reason, createdAt: new Date() });
  return this.save();
};

// Method to update status with history
reportSchema.methods.updateStatus = function(newStatus, changedBy, reason, attachments = []) {
  if (this.status === newStatus) return Promise.resolve(this);
  
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    reason,
    attachments,
    changedAt: new Date()
  });
  
  if (newStatus === 'resolved') {
    this.resolution = this.resolution || {};
    this.resolution.completedAt = new Date();
    this.resolution.completedBy = changedBy;
  }
  
  return this.save();
};

// Method to assign to user/department
reportSchema.methods.assignTo = function(userId, assignedBy) {
  this.assignedTo = userId;
  this.assignedAt = new Date();
  
  this.statusHistory.push({
    status: this.status,
    changedBy: assignedBy,
    reason: `Report assigned to user/department`,
    changedAt: new Date()
  });
  
  return this.save();
};

// Static method to find nearby reports
reportSchema.statics.findNearby = function(coordinates, radiusInKm = 5) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: radiusInKm * 1000
      }
    }
  });
};

// Static method to get reports by status
reportSchema.statics.getByStatus = function(status, options = {}) {
  const query = { status };
  if (!options.includeArchived) {
    query.isArchived = { $ne: true };
  }
  return this.find(query)
    .populate('userId', 'name email avatar')
    .populate('assignedTo', 'name email department')
    .sort(options.sort || { createdAt: -1 });
};

// Static method to get trending reports
reportSchema.statics.getTrending = function(limit = 10) {
  return this.aggregate([
    { $match: { isArchived: { $ne: true }, visibility: 'public' } },
    { $addFields: { 
      upvoteCount: { $size: '$upvotes' },
      commentCount: { $size: '$comments' },
      score: { 
        $add: [
          { $multiply: [{ $size: '$upvotes' }, 2] },
          { $size: '$comments' }
        ]
      }
    }},
    { $sort: { score: -1, createdAt: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Report', reportSchema);