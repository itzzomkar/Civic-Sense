const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [20, 'Description must be at least 20 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Road Maintenance',
      'Waste Management', 
      'Water & Utilities',
      'Lighting',
      'Vandalism',
      'Traffic',
      'Infrastructure',
      'Other'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in-progress', 'resolved', 'closed', 'rejected'],
    default: 'pending'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Location address is required']
    },
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: String,
    enum: ['PWD', 'Municipal Corporation', 'Water Board', 'Electricity Board', 'Traffic Police', 'Other'],
    default: 'Municipal Corporation'
  },
  upvotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionNotes: String,
    verificationImages: [{
      url: String,
      caption: String
    }]
  },
  metadata: {
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    reportedViaApp: { type: Boolean, default: true },
    deviceInfo: {
      platform: String,
      browser: String,
      ip: String
    }
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ status: 1, priority: -1 });
reportSchema.index({ category: 1 });
reportSchema.index({ 'location.city': 1 });
reportSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries
reportSchema.index({ createdAt: -1 });

// Virtual for upvote count
reportSchema.virtual('upvoteCount').get(function() {
  return this.upvotes ? this.upvotes.length : 0;
});

// Virtual for comment count
reportSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Update timestamp middleware
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add status change to history
reportSchema.methods.updateStatus = function(newStatus, userId, reason) {
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    reason: reason,
    changedAt: Date.now()
  });
  this.status = newStatus;
  
  if (newStatus === 'resolved') {
    this.resolution.resolvedAt = Date.now();
    this.resolution.resolvedBy = userId;
  }
};

// Method to check if user has upvoted
reportSchema.methods.hasUpvoted = function(userId) {
  return this.upvotes.some(upvote => upvote.userId.toString() === userId.toString());
};

// Method to toggle upvote
reportSchema.methods.toggleUpvote = function(userId) {
  const existingIndex = this.upvotes.findIndex(
    upvote => upvote.userId.toString() === userId.toString()
  );
  
  if (existingIndex > -1) {
    this.upvotes.splice(existingIndex, 1);
    return false; // Removed upvote
  } else {
    this.upvotes.push({ userId });
    return true; // Added upvote
  }
};

// Include virtuals in JSON
reportSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Report', reportSchema);