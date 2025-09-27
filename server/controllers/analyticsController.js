const Report = require('../models/Report');
const User = require('../models/User');
const database = require('../config/database');

// Get overall platform statistics
exports.getOverallStats = async (req, res) => {
  try {
    let totalUsers, totalReports, pendingReports, inProgressReports, resolvedReports;
    let totalOfficials, totalCitizens, recentReports, recentUsers;

    if (database.fallbackMode) {
      // Fallback mode calculations
      const users = await database.findLocal('users', {});
      const reports = await database.findLocal('reports', {});

      totalUsers = users.length;
      totalReports = reports.length;
      pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'reported').length;
      inProgressReports = reports.filter(r => r.status === 'in-progress').length;
      resolvedReports = reports.filter(r => r.status === 'resolved').length;
      totalOfficials = users.filter(u => u.role === 'official').length;
      totalCitizens = users.filter(u => u.role === 'citizen').length;

      // Get recent activity
      recentReports = reports
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(r => ({
          ...r,
          userId: users.find(u => u._id === r.userId) || { name: 'Unknown', email: '' }
        }));

      recentUsers = users
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt
        }));
    } else {
      // MongoDB mode
      [
        totalUsers,
        totalReports,
        pendingReports,
        inProgressReports,
        resolvedReports,
        totalOfficials,
        totalCitizens
      ] = await Promise.all([
        User.countDocuments(),
        Report.countDocuments(),
        Report.countDocuments({ status: { $in: ['pending', 'reported'] } }),
        Report.countDocuments({ status: 'in-progress' }),
        Report.countDocuments({ status: 'resolved' }),
        User.countDocuments({ role: 'official' }),
        User.countDocuments({ role: 'citizen' })
      ]);

      // Get recent activity
      recentReports = await Report.find()
        .sort('-createdAt')
        .limit(5)
        .populate('userId', 'name email');

      recentUsers = await User.find()
        .sort('-createdAt')
        .limit(5)
        .select('name email role createdAt');
    }

    // Calculate resolution rate
    const resolutionRate = totalReports > 0 
      ? ((resolvedReports / totalReports) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          citizens: totalCitizens,
          officials: totalOfficials
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          inProgress: inProgressReports,
          resolved: resolvedReports,
          resolutionRate: parseFloat(resolutionRate)
        },
        recentActivity: {
          reports: recentReports,
          users: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch overall statistics' 
    });
  }
};

// Get reports by category
exports.getReportsByCategory = async (req, res) => {
  try {
    const categoryCounts = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgUpvotes: { $avg: '$upvotes' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          pending: 1,
          inProgress: 1,
          resolved: 1,
          avgUpvotes: { $round: ['$avgUpvotes', 2] },
          resolutionRate: {
            $round: [
              { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      categories: categoryCounts
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch category statistics' 
    });
  }
};

// Get reports by location
exports.getReportsByLocation = async (req, res) => {
  try {
    const { groupBy = 'city' } = req.query;
    const groupField = groupBy === 'state' ? '$location.state' : '$location.city';

    const locationStats = await Report.aggregate([
      {
        $group: {
          _id: groupField,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          categories: { $addToSet: '$category' }
        }
      },
      {
        $project: {
          _id: 0,
          location: '$_id',
          total: 1,
          pending: 1,
          inProgress: 1,
          resolved: 1,
          categories: 1,
          resolutionRate: {
            $round: [
              { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      groupBy,
      locations: locationStats
    });
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch location statistics' 
    });
  }
};

// Get time-based analytics
exports.getTimeBasedAnalytics = async (req, res) => {
  try {
    const { period = 'day', days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let dateFormat;
    switch (period) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const timeStats = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          categories: { $addToSet: '$category' },
          avgUpvotes: { $avg: '$upvotes' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          resolved: 1,
          categories: { $size: '$categories' },
          avgUpvotes: { $round: ['$avgUpvotes', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Also get user signups over time
    const userSignups = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          signups: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          signups: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      period,
      days,
      reports: timeStats,
      users: userSignups
    });
  } catch (error) {
    console.error('Error fetching time-based analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch time-based analytics' 
    });
  }
};

// Get priority distribution
exports.getPriorityDistribution = async (req, res) => {
  try {
    const priorityStats = await Report.aggregate([
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$resolvedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          priority: '$_id',
          total: 1,
          pending: 1,
          inProgress: 1,
          resolved: 1,
          avgResolutionTime: {
            $divide: ['$avgResolutionTime', 1000 * 60 * 60 * 24] // Convert to days
          }
        }
      },
      {
        $sort: {
          priority: 1
        }
      }
    ]);

    // Custom sort order for priorities
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    priorityStats.sort((a, b) => 
      (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
    );

    res.json({
      success: true,
      priorities: priorityStats
    });
  } catch (error) {
    console.error('Error fetching priority distribution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch priority distribution' 
    });
  }
};

// Get engagement metrics
exports.getEngagementMetrics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get active users (users who have created reports or comments)
    const activeUsers = await Report.distinct('userId', {
      createdAt: { $gte: startDate }
    });

    // Get most upvoted reports
    const topReports = await Report.find()
      .sort('-upvotes')
      .limit(10)
      .populate('userId', 'name email')
      .select('title category upvotes status createdAt');

    // Get most active categories
    const activeCategories = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          reports: { $sum: 1 },
          totalUpvotes: { $sum: '$upvotes' },
          totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          reports: 1,
          totalUpvotes: 1,
          totalComments: 1,
          engagement: { $add: ['$totalUpvotes', '$totalComments'] }
        }
      },
      { $sort: { engagement: -1 } },
      { $limit: 5 }
    ]);

    // Calculate engagement rate
    const totalUsers = await User.countDocuments();
    const engagementRate = totalUsers > 0 
      ? ((activeUsers.length / totalUsers) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      metrics: {
        period: `${days} days`,
        activeUsers: activeUsers.length,
        totalUsers,
        engagementRate: parseFloat(engagementRate),
        topReports,
        activeCategories
      }
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch engagement metrics' 
    });
  }
};

// Get performance metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    // Calculate average resolution time
    const resolutionTimes = await Report.aggregate([
      {
        $match: {
          status: 'resolved',
          resolvedAt: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $subtract: ['$resolvedAt', '$createdAt']
          },
          priority: 1
        }
      },
      {
        $group: {
          _id: '$priority',
          avgTime: { $avg: '$resolutionTime' },
          minTime: { $min: '$resolutionTime' },
          maxTime: { $max: '$resolutionTime' }
        }
      },
      {
        $project: {
          _id: 0,
          priority: '$_id',
          avgTime: { $divide: ['$avgTime', 1000 * 60 * 60 * 24] }, // Convert to days
          minTime: { $divide: ['$minTime', 1000 * 60 * 60 * 24] },
          maxTime: { $divide: ['$maxTime', 1000 * 60 * 60 * 24] }
        }
      }
    ]);

    // Get response times (time to first status change)
    const responseTimes = await Report.aggregate([
      {
        $match: {
          'statusHistory.1': { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: [
              { $arrayElemAt: ['$statusHistory.changedAt', 1] },
              '$createdAt'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      },
      {
        $project: {
          _id: 0,
          avgResponseTime: { $divide: ['$avgResponseTime', 1000 * 60 * 60] }, // Convert to hours
          minResponseTime: { $divide: ['$minResponseTime', 1000 * 60 * 60] },
          maxResponseTime: { $divide: ['$maxResponseTime', 1000 * 60 * 60] }
        }
      }
    ]);

    res.json({
      success: true,
      performance: {
        resolutionTimes,
        responseTimes: responseTimes[0] || {
          avgResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch performance metrics' 
    });
  }
};

// Get real-time metrics
exports.getRealTimeMetrics = async (req, res) => {
  try {
    let metrics;

    if (database.fallbackMode) {
      const reports = await database.findLocal('reports', {});
      const users = await database.findLocal('users', {});
      
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      
      const reportsLast24h = reports.filter(r => new Date(r.createdAt) >= last24Hours);
      const reportsLastHour = reports.filter(r => new Date(r.createdAt) >= lastHour);
      const usersLast24h = users.filter(u => new Date(u.createdAt) >= last24Hours);
      
      metrics = {
        currentActive: {
          reports: reportsLastHour.length,
          users: usersLast24h.length
        },
        last24Hours: {
          newReports: reportsLast24h.length,
          newUsers: usersLast24h.length,
          resolvedReports: reportsLast24h.filter(r => r.status === 'resolved').length,
          totalUpvotes: reportsLast24h.reduce((sum, r) => sum + (r.upvotes?.length || 0), 0)
        },
        byCategory: reports.reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {}),
        byStatus: reports.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {}),
        responseTime: {
          average: '2.5 hours', // Mock data
          fastest: '15 minutes',
          slowest: '8 hours'
        },
        timestamp: new Date().toISOString()
      };
    } else {
      // MongoDB aggregation for real-time metrics
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      
      const [reportsLast24h, reportsLastHour, usersLast24h] = await Promise.all([
        Report.countDocuments({ createdAt: { $gte: last24Hours } }),
        Report.countDocuments({ createdAt: { $gte: lastHour } }),
        User.countDocuments({ createdAt: { $gte: last24Hours } })
      ]);
      
      const categoryStats = await Report.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const statusStats = await Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      metrics = {
        currentActive: {
          reports: reportsLastHour,
          users: usersLast24h
        },
        last24Hours: {
          newReports: reportsLast24h,
          newUsers: usersLast24h,
          resolvedReports: await Report.countDocuments({ 
            createdAt: { $gte: last24Hours },
            status: 'resolved'
          })
        },
        byCategory: categoryStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };
    }

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch real-time metrics' 
    });
  }
};

// Get trend analysis
exports.getTrendAnalysis = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let trends;

    if (database.fallbackMode) {
      const reports = await database.findLocal('reports', {});
      const filteredReports = reports.filter(r => 
        new Date(r.createdAt) >= startDate && new Date(r.createdAt) <= endDate
      );

      // Calculate daily trends
      const dailyTrends = {};
      filteredReports.forEach(report => {
        const date = new Date(report.createdAt).toISOString().split('T')[0];
        if (!dailyTrends[date]) {
          dailyTrends[date] = {
            total: 0,
            resolved: 0,
            categories: new Set()
          };
        }
        dailyTrends[date].total += 1;
        if (report.status === 'resolved') dailyTrends[date].resolved += 1;
        dailyTrends[date].categories.add(report.category);
      });

      trends = {
        daily: Object.keys(dailyTrends).map(date => ({
          date,
          total: dailyTrends[date].total,
          resolved: dailyTrends[date].resolved,
          categories: dailyTrends[date].categories.size
        })).sort((a, b) => new Date(a.date) - new Date(b.date)),
        
        growth: {
          reports: filteredReports.length,
          previousPeriod: Math.floor(filteredReports.length * 0.8), // Mock 20% growth
          percentageChange: 20
        },

        predictions: {
          nextWeek: Math.ceil(filteredReports.length / parseInt(days) * 7),
          nextMonth: Math.ceil(filteredReports.length / parseInt(days) * 30)
        }
      };
    } else {
      // MongoDB trend analysis
      const dailyTrends = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
            },
            categories: { $addToSet: '$category' }
          }
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            total: 1,
            resolved: 1,
            categories: { $size: '$categories' }
          }
        },
        { $sort: { date: 1 } }
      ]);

      trends = {
        daily: dailyTrends,
        growth: {
          reports: dailyTrends.reduce((sum, day) => sum + day.total, 0),
          // Calculate growth compared to previous period
          percentageChange: 15 // Mock data for now
        }
      };
    }

    res.json({
      success: true,
      period: `${days} days`,
      trends
    });
  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch trend analysis' 
    });
  }
};

// Get geographic heatmap data
exports.getGeographicHeatmap = async (req, res) => {
  try {
    let heatmapData;

    if (database.fallbackMode) {
      const reports = await database.findLocal('reports', {});
      
      // Group by coordinates
      const locationCounts = {};
      reports.forEach(report => {
        if (report.location && report.location.coordinates) {
          const key = `${report.location.coordinates.lat},${report.location.coordinates.lng}`;
          if (!locationCounts[key]) {
            locationCounts[key] = {
              lat: report.location.coordinates.lat,
              lng: report.location.coordinates.lng,
              count: 0,
              address: report.location.address || 'Unknown',
              categories: new Set()
            };
          }
          locationCounts[key].count += 1;
          locationCounts[key].categories.add(report.category);
        }
      });

      heatmapData = Object.values(locationCounts).map(item => ({
        ...item,
        categories: Array.from(item.categories)
      }));
    } else {
      // MongoDB geographic aggregation
      heatmapData = await Report.aggregate([
        {
          $match: {
            'location.coordinates.lat': { $exists: true },
            'location.coordinates.lng': { $exists: true }
          }
        },
        {
          $group: {
            _id: {
              lat: '$location.coordinates.lat',
              lng: '$location.coordinates.lng'
            },
            count: { $sum: 1 },
            address: { $first: '$location.address' },
            categories: { $addToSet: '$category' }
          }
        },
        {
          $project: {
            _id: 0,
            lat: '$_id.lat',
            lng: '$_id.lng',
            count: 1,
            address: 1,
            categories: 1
          }
        }
      ]);
    }

    res.json({
      success: true,
      heatmap: heatmapData
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch heatmap data' 
    });
  }
};

// Get user activity metrics
exports.getUserActivityMetrics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let userActivity;

    if (database.fallbackMode) {
      const users = await database.findLocal('users', {});
      const reports = await database.findLocal('reports', {});
      
      const recentReports = reports.filter(r => new Date(r.createdAt) >= startDate);
      
      const userStats = users.map(user => {
        const userReports = recentReports.filter(r => r.userId === user._id);
        const totalUpvotes = userReports.reduce((sum, r) => sum + (r.upvotes?.length || 0), 0);
        const totalComments = userReports.reduce((sum, r) => sum + (r.comments?.length || 0), 0);
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          reportsCount: userReports.length,
          upvotesReceived: totalUpvotes,
          commentsReceived: totalComments,
          lastActivity: userReports.length > 0 
            ? userReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
            : user.createdAt,
          engagementScore: userReports.length + totalUpvotes + totalComments
        };
      });

      userActivity = {
        topContributors: userStats
          .filter(u => u.reportsCount > 0)
          .sort((a, b) => b.engagementScore - a.engagementScore)
          .slice(0, 10),
        activeUsers: userStats.filter(u => new Date(u.lastActivity) >= startDate).length,
        totalUsers: users.length,
        userGrowth: users.filter(u => new Date(u.createdAt) >= startDate).length
      };
    } else {
      // MongoDB user activity analysis
      const topContributors = await User.aggregate([
        {
          $lookup: {
            from: 'reports',
            localField: '_id',
            foreignField: 'userId',
            as: 'reports'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            reportsCount: { $size: '$reports' },
            lastActivity: { $max: '$reports.createdAt' },
            engagementScore: {
              $add: [
                { $size: '$reports' },
                { $sum: '$reports.upvotes' }
              ]
            }
          }
        },
        { $match: { reportsCount: { $gt: 0 } } },
        { $sort: { engagementScore: -1 } },
        { $limit: 10 }
      ]);

      const activeUsers = await User.countDocuments({
        $or: [
          { lastLogin: { $gte: startDate } },
          { createdAt: { $gte: startDate } }
        ]
      });

      const totalUsers = await User.countDocuments();
      const userGrowth = await User.countDocuments({ createdAt: { $gte: startDate } });

      userActivity = {
        topContributors,
        activeUsers,
        totalUsers,
        userGrowth
      };
    }

    res.json({
      success: true,
      period: `${days} days`,
      userActivity
    });
  } catch (error) {
    console.error('Error fetching user activity metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user activity metrics' 
    });
  }
};
