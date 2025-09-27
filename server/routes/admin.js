const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Report management
router.put('/reports/:id/status', adminController.updateReportStatus);
router.post('/reports/bulk-update', adminController.bulkUpdateReports);

// User management
router.post('/users/:id/manage', adminController.manageUserAccount);

// System
router.get('/logs', adminController.getSystemLogs);
router.get('/settings', adminController.getSystemSettings);

module.exports = router;