const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Notifications API - Coming soon',
    data: { notifications: [] }
  });
});

module.exports = router;