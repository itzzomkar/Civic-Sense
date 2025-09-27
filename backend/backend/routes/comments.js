const express = require('express');
const router = express.Router();

// Placeholder for comments routes
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Comments API endpoints - Coming soon',
    data: { comments: [] }
  });
});

module.exports = router;