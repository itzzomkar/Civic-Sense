const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const database = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadReportImages, handleMulterError } = require('../config/upload');
const path = require('path');
const fs = require('fs');

// @route   GET /api/reports
// @desc    Get all public reports
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, category, city, page = 1, limit = 10 } = req.query;
    
    if (database.fallbackMode) {
      // Local storage mode
      let reports = await database.findLocal('reports', {});
      
      // Apply filters
      if (status) reports = reports.filter(r => r.status === status);
      if (category) reports = reports.filter(r => r.category === category);
      if (city) reports = reports.filter(r => r.location?.city === city);
      
      // Sort by creation date (newest first)
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedReports = reports.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        data: paginatedReports,
        total: reports.length,
        page: parseInt(page),
        pages: Math.ceil(reports.length / limit)
      });
    } else {
      // MongoDB mode
      const query = { isPublic: true };
      if (status) query.status = status;
      if (category) query.category = category;
      if (city) query['location.city'] = city;
      
      const total = await Report.countDocuments(query);
      const reports = await Report.find(query)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      res.json({
        success: true,
        data: reports,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });
    }
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let report;
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
    } else {
      report = await Report.findById(id)
        .populate('userId', 'name email avatar')
        .populate('comments.userId', 'name avatar');
      
      // Increment view count
      if (report) {
        report.metadata.viewCount += 1;
        await report.save();
      }
    }
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// @route   POST /api/reports
// @desc    Create new report with optional images
// @access  Private
router.post('/', authenticate, uploadReportImages.array('images', 5), handleMulterError, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Handle uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push({
          url: `/uploads/reports/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        });
      });
    }
    
    const reportData = {
      ...req.body,
      userId,
      images,
      status: 'pending',
      upvotes: [],
      downvotes: [],
      comments: [],
      statusHistory: [{
        status: 'pending',
        changedBy: userId,
        reason: 'Initial submission',
        changedAt: new Date()
      }]
    };
    
    let newReport;
    if (database.fallbackMode) {
      newReport = await database.createLocal('reports', reportData);
      
      // Update user stats
      const users = await database.findLocal('users', { _id: userId });
      if (users.length > 0) {
        const user = users[0];
        user.stats.totalReports += 1;
        user.stats.pendingReports += 1;
        await database.updateLocal('users', { _id: userId }, user);
      }
    } else {
      newReport = await Report.create(reportData);
      
      // Update user stats
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          'stats.totalReports': 1,
          'stats.pendingReports': 1
        }
      });
    }
    
    // Emit real-time update for new report
    if (req.app.get('io')) {
      req.app.get('io').emit('new-report-notification', {
        reportId: newReport._id || newReport.id,
        title: newReport.title,
        category: newReport.category,
        location: newReport.location,
        userId: newReport.userId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(201).json({
      success: true,
      data: newReport
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: error.message || 'Failed to create report' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private (owner or admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    let report;
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this report' });
      }
      
      const updated = await database.updateLocal('reports', { _id: id }, {
        ...report,
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      
      if (updated) {
        report = await database.findOneLocal('reports', { _id: id });
      }
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this report' });
      }
      
      Object.assign(report, req.body);
      await report.save();
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});


// @route   POST /api/reports/:id/comments
// @desc    Add comment to report
// @access  Private
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    let report;
    const comment = {
      userId,
      text,
      createdAt: new Date().toISOString()
    };
    
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      report.comments = report.comments || [];
      report.comments.push(comment);
      
      await database.updateLocal('reports', { _id: id }, report);
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      report.comments.push(comment);
      await report.save();
      
      // Populate the new comment's user info
      await report.populate('comments.userId', 'name avatar');
    }
    
    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('report-comment-added', {
        reportId: id,
        comment: comment,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// @route   GET /api/reports/my
// @desc    Get current user's reports
// @access  Private
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    if (database.fallbackMode) {
      let reports = await database.findLocal('reports', { userId });
      
      if (status) {
        reports = reports.filter(r => r.status === status);
      }
      
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      res.json({
        success: true,
        data: reports
      });
    } else {
      const query = { userId };
      if (status) query.status = status;
      
      const reports = await Report.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      res.json({
        success: true,
        data: reports
      });
    }
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ error: 'Failed to fetch user reports' });
  }
});

// @route   PATCH /api/reports/:id/status
// @desc    Update report status (admin only)
// @access  Private (Admin Only)
router.patch('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user.id;
    
    // Check if user has admin permission to update status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Only administrators can update report status' 
      });
    }
    
    let report;
    
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Add to status history
      report.statusHistory = report.statusHistory || [];
      report.statusHistory.push({
        status,
        changedBy: userId,
        reason: reason || `Status updated to ${status}`,
        changedAt: new Date().toISOString()
      });
      
      report.status = status;
      report.updatedAt = new Date().toISOString();
      
      if (status === 'resolved') {
        report.resolution = {
          resolvedBy: userId,
          resolvedAt: new Date().toISOString(),
          resolutionNotes: reason || 'Issue resolved'
        };
      }
      
      await database.updateLocal('reports', { _id: id }, report);
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Update status using the model method
      report.updateStatus(status, userId, reason || `Status updated to ${status}`);
      await report.save();
    }
    
    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('report-status-changed', {
        reportId: id,
        status,
        reason,
        changedBy: userId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// @route   POST /api/reports/:id/upvote
// @desc    Toggle upvote on report  
// @access  Private
router.post('/:id/upvote', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    let report;
    let added;
    
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Toggle upvote
      report.upvotes = report.upvotes || [];
      const upvoteIndex = report.upvotes.findIndex(u => u.userId === userId);
      if (upvoteIndex > -1) {
        report.upvotes.splice(upvoteIndex, 1);
        added = false;
      } else {
        report.upvotes.push({ userId, createdAt: new Date().toISOString() });
        added = true;
      }
      
      await database.updateLocal('reports', { _id: id }, report);
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      added = report.toggleUpvote(userId);
      await report.save();
    }
    
    res.json({
      success: true,
      data: report,
      added,
      upvoteCount: report.upvotes.length
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Failed to update upvote' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (database.fallbackMode) {
      const report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this report' });
      }
      
      await database.deleteLocal('reports', { _id: id });
    } else {
      const report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this report' });
      }
      
      await report.remove();
    }
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// @route   GET /api/reports/:id/timeline
// @desc    Get report timeline/history
// @access  Private
router.get('/:id/timeline', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    let report;
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
    } else {
      report = await Report.findById(id);
    }
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Generate timeline from status history and other events
    const timeline = [];
    
    // Add status history events
    if (report.statusHistory && report.statusHistory.length > 0) {
      report.statusHistory.forEach(history => {
        timeline.push({
          _id: `status_${history.changedAt}`,
          type: 'status_change',
          timestamp: history.changedAt,
          description: `Status changed to ${history.status}`,
          actor: {
            id: history.changedBy || 'system',
            name: history.changedBy || 'System',
            role: history.changedBy ? 'official' : 'citizen'
          },
          details: {
            newValue: history.status,
            reason: history.reason
          }
        });
      });
    }
    
    // Add comment events
    if (report.comments && report.comments.length > 0) {
      report.comments.forEach(comment => {
        timeline.push({
          _id: `comment_${comment.createdAt}`,
          type: 'comment',
          timestamp: comment.createdAt,
          description: 'Added a comment',
          actor: {
            id: comment.userId,
            name: 'User', // In real app, would populate from user data
            role: 'citizen'
          },
          details: {
            content: comment.text
          }
        });
      });
    }
    
    // Add upvote events (aggregate)
    if (report.upvotes && report.upvotes.length > 0) {
      timeline.push({
        _id: `upvotes_${report.updatedAt}`,
        type: 'upvote',
        timestamp: report.updatedAt,
        description: `${report.upvotes.length} citizens supported this report`,
        actor: {
          id: 'system',
          name: 'Community',
          role: 'citizen'
        }
      });
    }
    
    // Sort timeline by timestamp (newest first)
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      timeline: timeline
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

// @route   PATCH /api/reports/:id/status
// @desc    Update report status (admin only)
// @access  Private (Admin Only)
router.patch('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user.id;
    
    // Check admin permissions only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Only administrators can update report status' 
      });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['reported', 'acknowledged', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    let report;
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      const oldStatus = report.status;
      report.status = status;
      report.updatedAt = new Date().toISOString();
      
      // Add to status history
      if (!report.statusHistory) {
        report.statusHistory = [];
      }
      
      report.statusHistory.push({
        status: status,
        changedBy: userId,
        changedAt: new Date().toISOString(),
        reason: reason || `Status updated to ${status}`
      });
      
      await database.updateLocal('reports', { _id: id }, report);
      
      // Update user stats if status changed to resolved
      if (oldStatus !== 'resolved' && status === 'resolved') {
        const users = await database.findLocal('users', { _id: report.userId });
        if (users.length > 0) {
          const user = users[0];
          user.stats.resolvedReports += 1;
          user.stats.pendingReports = Math.max(0, user.stats.pendingReports - 1);
          await database.updateLocal('users', { _id: report.userId }, user);
        }
      }
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      const oldStatus = report.status;
      report.status = status;
      
      // Add to status history
      report.statusHistory.push({
        status: status,
        changedBy: userId,
        changedAt: new Date(),
        reason: reason || `Status updated to ${status}`
      });
      
      await report.save();
      
      // Update user stats if status changed to resolved
      if (oldStatus !== 'resolved' && status === 'resolved') {
        const User = require('../models/User');
        await User.findByIdAndUpdate(report.userId, {
          $inc: { 
            'stats.resolvedReports': 1,
            'stats.pendingReports': -1
          }
        });
      }
    }
    
    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('report-status-changed', {
        reportId: id,
        newStatus: status,
        oldStatus: report.status,
        reason: reason,
        changedBy: userId,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: report,
      message: `Report status updated to ${status}`
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
