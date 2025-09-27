const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private (Admin/Official)
router.get('/dashboard', authenticateToken, requireRole('admin', 'official'), async (req, res) => {
  try {
    // Get counts
    const totalReports = await Report.countDocuments({ isArchived: { $ne: true } });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const totalUsers = await User.countDocuments({ isActive: true });

    // Get reports by category
    const reportsByCategory = await Report.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get reports by status
    const reportsByStatus = await Report.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          reports: totalReports,
          pending: pendingReports,
          resolved: resolvedReports,
          users: totalUsers
        },
        reportsByCategory,
        reportsByStatus
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;