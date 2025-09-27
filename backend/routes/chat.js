const express = require('express');
const router = express.Router();

// Placeholder for chat routes
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Chat API endpoints - Coming soon',
    data: { chats: [] }
  });
});

module.exports = router;