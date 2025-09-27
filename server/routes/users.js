const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public routes
router.get('/top-contributors', usersController.getTopContributors);

// Protected routes (require authentication)
router.use(authenticate);

// User profile routes
router.get('/profile', usersController.getUserProfile);
router.get('/profile/:id', usersController.getUserProfile);
router.put('/profile', usersController.updateProfile);
router.put('/profile/:id', usersController.updateProfile);
router.get('/stats', usersController.getUserStats);
router.get('/stats/:id', usersController.getUserStats);

// Admin-only routes
router.get('/', requireRole('admin'), usersController.getAllUsers);
router.delete('/:id', requireRole('admin'), usersController.deleteUser);
router.put('/:id/role', requireRole('admin'), usersController.updateUserRole);

module.exports = router;
