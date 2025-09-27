const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({ 
    success: true, 
    message: 'Admin Dashboard API - Coming soon',
    data: { dashboard: {} }
  });
});

module.exports = router;