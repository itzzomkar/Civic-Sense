const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireRole } = require('../middleware/auth');

// All analytics routes require authentication
router.use(authenticate);

// Public analytics routes (accessible to all authenticated users)
router.get('/overall', analyticsController.getOverallStats);
router.get('/categories', analyticsController.getReportsByCategory);
router.get('/locations', analyticsController.getReportsByLocation);
router.get('/time-series', analyticsController.getTimeBasedAnalytics);
router.get('/priorities', analyticsController.getPriorityDistribution);
router.get('/engagement', analyticsController.getEngagementMetrics);

// Admin-only analytics routes
router.get('/performance', requireRole('admin', 'official'), analyticsController.getPerformanceMetrics);
router.get('/real-time', analyticsController.getRealTimeMetrics);
router.get('/trends', analyticsController.getTrendAnalysis);
router.get('/heatmap', analyticsController.getGeographicHeatmap);
router.get('/user-activity', requireRole('admin', 'official'), analyticsController.getUserActivityMetrics);

module.exports = router;
