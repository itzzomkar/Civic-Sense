const express = require('express');
const Report = require('../models/Report');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all reports
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status, 
      priority, 
      search,
      lat,
      lng,
      radius = 10 
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { 
      visibility: 'public', 
      isArchived: { $ne: true } 
    };

    // Filter by category
    if (category) query.category = category;
    
    // Filter by status
    if (status) query.status = status;
    
    // Filter by priority
    if (priority) query.priority = priority;

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Geospatial search
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }

    const reports = await Report.find(query)
      .populate('userId', 'name avatar')
      .populate('assignedTo', 'name department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    // Return reports directly as array for frontend compatibility
    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
});

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      userId: req.user._id
    };

    const report = new Report(reportData);
    await report.save();

    // Populate user information
    await report.populate('userId', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: { report }
    });
  } catch (error) {
    console.error('Create report error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)[0].message,
        details: Object.keys(error.errors)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating report',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message, stack: error.stack })
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get specific report
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'name avatar role')
      .populate('assignedTo', 'name department role')
      .populate('comments');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user can view this report
    if (report.visibility === 'private' && 
        (!req.user || !req.user._id.equals(report.userId._id))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report'
    });
  }
});

// @route   POST /api/reports/:id/upvote
// @desc    Upvote a report
// @access  Private
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user already upvoted
    const existingUpvote = report.upvotes.find(upvote => 
      upvote.userId.equals(req.user._id)
    );

    if (existingUpvote) {
      // Remove upvote
      await report.removeUpvote(req.user._id);
      res.json({
        success: true,
        message: 'Upvote removed',
        data: { upvoted: false, upvoteCount: report.upvoteCount }
      });
    } else {
      // Add upvote
      await report.addUpvote(req.user._id);
      res.json({
        success: true,
        message: 'Report upvoted',
        data: { upvoted: true, upvoteCount: report.upvoteCount }
      });
    }
  } catch (error) {
    console.error('Upvote report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing upvote'
    });
  }
});

module.exports = router;