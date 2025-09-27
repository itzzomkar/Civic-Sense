const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
    maxlength: [20, 'Phone number cannot be more than 20 characters']
  },
  role: {
    type: String,
    enum: ['citizen', 'admin'],
    default: 'citizen'
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  location: {
    address: {
      type: String,
      maxlength: [200, 'Address cannot be more than 200 characters']
    },
    city: {
      type: String,
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    state: {
      type: String,
      maxlength: [50, 'State cannot be more than 50 characters']
    },
    country: {
      type: String,
      default: 'India',
      maxlength: [50, 'Country cannot be more than 50 characters']
    },
    coordinates: {
      lat: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showLocation: { type: Boolean, default: true },
      showProfile: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'es', 'fr']
    }
  },
  civicPoints: {
    type: Number,
    default: 0,
    min: [0, 'Civic points cannot be negative']
  },
  stats: {
    totalReports: { type: Number, default: 0 },
    resolvedReports: { type: Number, default: 0 },
    pendingReports: { type: Number, default: 0 },
    upvotesReceived: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 }
  },
  department: {
    type: String,
    required: false,
    enum: ['Public Works', 'Water Department', 'Transportation', 'Environment', 'Health', 'Parks & Recreation', 'Police', 'Fire Department', 'Other']
  },
  permissions: [{
    type: String,
    enum: ['view_reports', 'edit_reports', 'delete_reports', 'manage_users', 'view_analytics', 'moderate_comments', 'send_notifications']
  }],
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verificationToken: String,
  verificationExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ createdAt: -1 });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.location) return '';
  const parts = [
    this.location.address,
    this.location.city,
    this.location.state,
    this.location.country
  ].filter(Boolean);
  return parts.join(', ');
});

// Virtual for completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completed = 0;
  const fields = ['name', 'email', 'phone', 'avatar'];
  fields.forEach(field => {
    if (this[field]) completed++;
  });
  if (this.location && this.location.address) completed++;
  return Math.round((completed / (fields.length + 1)) * 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    }
  );
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.verificationToken = require('crypto').createHash('sha256').update(token).digest('hex');
  this.verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to update civic points
userSchema.methods.updateCivicPoints = function(points, reason) {
  this.civicPoints = Math.max(0, this.civicPoints + points);
  // You could also log the point changes here
  return this.save();
};

// Static method to find users by location
userSchema.statics.findByLocation = function(coordinates, radiusInKm = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.verificationToken;
  delete user.verificationExpire;
  return user;
};

module.exports = mongoose.model('User', userSchema);