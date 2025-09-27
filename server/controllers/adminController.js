const User = require('../models/User');
const Report = require('../models/Report');
const database = require('../config/database');

// Get admin dashboard overview
exports.getDashboard = async (req, res) => {
  try {
    // Get counts and statistics
    const [
      totalUsers,
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      newUsersToday,
      newReportsToday,
      activeUsers
    ] = await Promise.all([
      User.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'in-progress' }),
      Report.countDocuments({ status: 'resolved' }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Report.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get recent reports requiring attention
    const urgentReports = await Report.find({
      status: 'pending',
      priority: { $in: ['high', 'critical'] }
    })
      .populate('userId', 'name email')
      .sort('-createdAt')
      .limit(10);

    // Get recent user registrations
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort('-createdAt')
      .limit(10);

    // Calculate growth rates
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [lastWeekUsers, lastWeekReports] = await Promise.all([
      User.countDocuments({ createdAt: { $lt: lastWeek } }),
      Report.countDocuments({ createdAt: { $lt: lastWeek } })
    ]);

    const userGrowth = lastWeekUsers > 0 
      ? ((totalUsers - lastWeekUsers) / lastWeekUsers * 100).toFixed(2)
      : 100;
    const reportGrowth = lastWeekReports > 0
      ? ((totalReports - lastWeekReports) / lastWeekReports * 100).toFixed(2)
      : 100;

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalUsers,
          totalReports,
          activeUsers,
          resolutionRate: totalReports > 0 
            ? ((resolvedReports / totalReports) * 100).toFixed(2)
            : 0
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          inProgress: inProgressReports,
          resolved: resolvedReports
        },
        today: {
          newUsers: newUsersToday,
          newReports: newReportsToday
        },
        growth: {
          users: parseFloat(userGrowth),
          reports: parseFloat(reportGrowth)
        },
        urgentReports,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data' 
    });
  }
};

// Manage report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, assignedTo, priority } = req.body;
    const adminId = req.user.id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    // Update status history
    if (status && status !== report.status) {
      report.statusHistory.push({
        status,
        changedBy: adminId,
        reason: reason || `Status changed to ${status}`,
        changedAt: new Date()
      });
      report.status = status;

      // Update resolved date if applicable
      if (status === 'resolved') {
        report.resolvedAt = new Date();
      }
    }

    // Update other fields
    if (assignedTo !== undefined) report.assignedTo = assignedTo;
    if (priority !== undefined) report.priority = priority;

    await report.save();

    // Update user stats if status changed
    if (status) {
      const User = require('../models/User');
      const userId = report.userId;
      
      if (status === 'resolved') {
        await User.findByIdAndUpdate(userId, {
          $inc: { 
            'stats.resolvedReports': 1,
            'stats.pendingReports': -1,
            'civicPoints': 10
          }
        });
      } else if (status === 'in-progress' && report.status === 'pending') {
        await User.findByIdAndUpdate(userId, {
          $inc: { 
            'stats.pendingReports': -1
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update report status' 
    });
  }
};

// Bulk operations on reports
exports.bulkUpdateReports = async (req, res) => {
  try {
    const { reportIds, action, data } = req.body;
    const adminId = req.user.id;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid report IDs' 
      });
    }

    let updateData = {};
    let statusUpdate = false;

    switch (action) {
      case 'approve':
        updateData.status = 'in-progress';
        statusUpdate = true;
        break;
      case 'resolve':
        updateData.status = 'resolved';
        updateData.resolvedAt = new Date();
        statusUpdate = true;
        break;
      case 'reject':
        updateData.status = 'rejected';
        statusUpdate = true;
        break;
      case 'setPriority':
        if (!data?.priority) {
          return res.status(400).json({ 
            success: false, 
            message: 'Priority is required' 
          });
        }
        updateData.priority = data.priority;
        break;
      case 'assign':
        if (!data?.assignedTo) {
          return res.status(400).json({ 
            success: false, 
            message: 'Assignee is required' 
          });
        }
        updateData.assignedTo = data.assignedTo;
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action' 
        });
    }

    // Update reports
    const result = await Report.updateMany(
      { _id: { $in: reportIds } },
      { 
        $set: updateData,
        $push: statusUpdate ? {
          statusHistory: {
            status: updateData.status,
            changedBy: adminId,
            reason: `Bulk ${action} operation`,
            changedAt: new Date()
          }
        } : {}
      }
    );

    res.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} reports`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to perform bulk update' 
    });
  }
};

// Get system logs
exports.getSystemLogs = async (req, res) => {
  try {
    const { type, days = 7, page = 1, limit = 50 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get status change logs
    const statusLogs = await Report.aggregate([
      { $unwind: '$statusHistory' },
      { $match: { 'statusHistory.changedAt': { $gte: startDate } } },
      {
        $lookup: {
          from: 'users',
          localField: 'statusHistory.changedBy',
          foreignField: '_id',
          as: 'changedByUser'
        }
      },
      { $unwind: { path: '$changedByUser', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          type: 'status_change',
          reportId: '$_id',
          reportTitle: '$title',
          status: '$statusHistory.status',
          reason: '$statusHistory.reason',
          changedBy: '$changedByUser.name',
          changedAt: '$statusHistory.changedAt'
        }
      },
      { $sort: { changedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    // Get user activity logs
    const userLogs = await User.find({
      $or: [
        { createdAt: { $gte: startDate } },
        { lastLogin: { $gte: startDate } }
      ]
    })
      .select('name email role createdAt lastLogin')
      .sort('-lastLogin')
      .limit(parseInt(limit));

    const logs = [
      ...statusLogs.map(log => ({ ...log, type: 'status_change' })),
      ...userLogs.map(user => ({
        type: 'user_activity',
        user: user.name,
        email: user.email,
        action: user.lastLogin > user.createdAt ? 'login' : 'registration',
        timestamp: user.lastLogin || user.createdAt
      }))
    ].sort((a, b) => {
      const dateA = new Date(a.changedAt || a.timestamp);
      const dateB = new Date(b.changedAt || b.timestamp);
      return dateB - dateA;
    });

    res.json({
      success: true,
      logs: logs.slice(0, limit),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get system logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system logs' 
    });
  }
};

// Manage user accounts
exports.manageUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, data } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    switch (action) {
      case 'suspend':
        user.isActive = false;
        user.suspendedAt = new Date();
        user.suspendReason = data?.reason || 'Account suspended by admin';
        break;
      case 'activate':
        user.isActive = true;
        user.suspendedAt = null;
        user.suspendReason = null;
        break;
      case 'resetPassword':
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        user.password = tempPassword; // Will be hashed by pre-save hook
        user.requirePasswordChange = true;
        // In production, send email with temp password
        break;
      case 'updateRole':
        if (!data?.role) {
          return res.status(400).json({ 
            success: false, 
            message: 'Role is required' 
          });
        }
        user.role = data.role;
        break;
      case 'addPoints':
        if (!data?.points) {
          return res.status(400).json({ 
            success: false, 
            message: 'Points value is required' 
          });
        }
        user.civicPoints += parseInt(data.points);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action' 
        });
    }

    await user.save();

    res.json({
      success: true,
      message: `User account ${action} completed successfully`,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Manage user account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to manage user account' 
    });
  }
};

// Get system settings
exports.getSystemSettings = async (req, res) => {
  try {
    // In a real application, these would be stored in a database
    const settings = {
      general: {
        siteName: 'Urban Guardians',
        siteDescription: 'Civic issue reporting platform',
        maintenanceMode: false,
        registrationEnabled: true
      },
      reports: {
        autoApprove: false,
        requireLocation: true,
        maxImagesPerReport: 5,
        categories: [
          'Road Maintenance',
          'Street Lighting',
          'Waste Management',
          'Water Supply',
          'Public Safety',
          'Parks & Recreation',
          'Traffic Management',
          'Other'
        ],
        priorities: ['low', 'medium', 'high', 'critical']
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true
      },
      limits: {
        maxReportsPerDay: 10,
        maxCommentsPerReport: 100,
        maxFileSize: 5 * 1024 * 1024
      }
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system settings' 
    });
  }
};

module.exports = exports;