const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Upload API - Coming soon',
    data: { uploads: [] }
  });
});

module.exports = router;