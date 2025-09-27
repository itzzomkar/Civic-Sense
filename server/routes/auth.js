const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const database = require('../config/database');

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Simulate SMS sending (in production, integrate with Twilio, AWS SNS, etc.)
const sendSMS = async (phone, message) => {
  console.log(`SMS to ${phone}: ${message}`);
  // In production, implement actual SMS service
  return true;
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, role, adminCode } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if using fallback mode
    if (database.fallbackMode) {
      // Local storage mode
      const existingUser = await database.findOneLocal('users', { email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Role assignment with admin code for demo
      const ALLOWED_ROLES = ['citizen', 'official', 'admin'];
const ADMIN_CODE = process.env.ADMIN_SIGNUP_CODE || 'pokemon';
      let assignedRole = 'citizen';
      if (role && ALLOWED_ROLES.includes(role)) {
        if (role === 'citizen') {
          assignedRole = 'citizen';
        } else if (adminCode && adminCode === ADMIN_CODE) {
          assignedRole = role;
        }
      }

      const newUser = await database.createLocal('users', {
        name,
        email,
        password: hashedPassword,
        phone,
        role: assignedRole,
        civicPoints: 0,
        stats: {
          totalReports: 0,
          resolvedReports: 0,
          pendingReports: 0,
          upvotesReceived: 0
        }
      });

      const token = generateToken(newUser._id);
      
      const userResponse = { ...newUser };
      delete userResponse.password;

      res.status(201).json({
        success: true,
        token,
        user: userResponse
      });
    } else {
      // MongoDB mode
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Role assignment with admin code for demo
      const ALLOWED_ROLES = ['citizen', 'official', 'admin'];
const ADMIN_CODE = process.env.ADMIN_SIGNUP_CODE || 'pokemon';
      let assignedRole = 'citizen';
      if (role && ALLOWED_ROLES.includes(role)) {
        if (role === 'citizen') {
          assignedRole = 'citizen';
        } else if (adminCode && adminCode === ADMIN_CODE) {
          assignedRole = role;
        }
      }

      const user = await User.create({
        name,
        email,
        password,
        phone,
        role: assignedRole
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    if (database.fallbackMode) {
      // Local storage mode
      const user = await database.findOneLocal('users', { email });
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await database.updateLocal('users', { _id: user._id }, { lastLogin: new Date().toISOString() });

      const token = generateToken(user._id);
      
      const userResponse = { ...user };
      delete userResponse.password;

      res.json({
        success: true,
        token,
        user: userResponse
      });
    } else {
      // MongoDB mode
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      user.lastLogin = Date.now();
      await user.save();

      const token = generateToken(user._id);

      res.json({
        success: true,
        token,
        user: user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    let user;
    if (database.fallbackMode) {
      user = await database.findOneLocal('users', { _id: decoded.id });
      if (user) {
        delete user.password;
      }
    } else {
      user = await User.findById(decoded.id);
      if (user) {
        user = user.getPublicProfile();
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStorage.set(phone, {
      otp,
      expiresAt,
      attempts: 0
    });

    // Send SMS
    const message = `Your Urban Guardians verification code is: ${otp}. Valid for 5 minutes.`;
    await sendSMS(phone, message);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for phone number
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const storedData = otpStorage.get(phone);
    
    if (!storedData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      otpStorage.delete(phone);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Check attempts limit
    if (storedData.attempts >= 3) {
      otpStorage.delete(phone);
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP' });
    }

    // Verify OTP
    if (otp !== storedData.otp) {
      storedData.attempts += 1;
      otpStorage.set(phone, storedData);
      return res.status(400).json({ 
        error: 'Invalid OTP',
        attemptsLeft: 3 - storedData.attempts
      });
    }

    // OTP verified successfully
    otpStorage.delete(phone);
    
    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// @route   POST /api/auth/signup-with-phone
// @desc    Register user with phone verification
// @access  Public
router.post('/signup-with-phone', async (req, res) => {
  try {
    const { name, email, password, phone, isVerified } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (!isVerified) {
      return res.status(400).json({ error: 'Phone number must be verified first' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if using fallback mode
    if (database.fallbackMode) {
      // Local storage mode
      const existingUser = await database.findOneLocal('users', { 
        $or: [{ email }, { phone }]
      });
      if (existingUser) {
        return res.status(400).json({ 
          error: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await database.createLocal('users', {
        name,
        email,
        password: hashedPassword,
        phone,
        verificationStatus: {
          phone: true,
          email: false
        },
        role: 'citizen',
        civicPoints: 0,
        stats: {
          totalReports: 0,
          resolvedReports: 0,
          pendingReports: 0,
          upvotesReceived: 0
        }
      });

      const token = generateToken(newUser._id);
      
      const userResponse = { ...newUser };
      delete userResponse.password;

      res.status(201).json({
        success: true,
        token,
        user: userResponse
      });
    } else {
      // MongoDB mode
      const existingUser = await User.findOne({ 
        $or: [{ email }, { phone }]
      });
      if (existingUser) {
        return res.status(400).json({ 
          error: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone,
        verificationStatus: {
          phone: true,
          email: false
        }
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Signup with phone error:', error);
    res.status(500).json({ error: error.message || 'Failed to create account' });
  }
});

// @route   GET /api/auth/check-email
// @desc    Check if email exists (supports both local and Mongo modes)
// @access  Public
router.get('/check-email', async (req, res) => {
  try {
    const rawEmail = req.query.email;
    if (!rawEmail || typeof rawEmail !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    const email = rawEmail.toLowerCase().trim();

    let exists = false;
    if (database.fallbackMode) {
      const user = await database.findOneLocal('users', { email });
      exists = !!user;
    } else {
      const user = await User.findOne({ email });
      exists = !!user;
    }

    return res.json({ success: true, data: { exists } });
  } catch (error) {
    console.error('Check email (server) error:', error);
    return res.status(500).json({ success: false, message: 'Server error while checking email' });
  }
});

module.exports = router;
