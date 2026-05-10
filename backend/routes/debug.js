const express = require('express');
const router = express.Router();
const { BAIDU_MAP_API_KEY, QWEATHER_API_KEY, QWEATHER_API_HOST } = require('../config');

router.get('/debug/env', (req, res) => {
  res.json({
    code: 0,
    message: 'Environment debug info',
    data: {
      BAIDU_MAP_API_KEY_configured: Boolean(BAIDU_MAP_API_KEY),
      QWEATHER_API_KEY_configured: Boolean(QWEATHER_API_KEY),
      QWEATHER_API_HOST: QWEATHER_API_HOST || 'devapi.qweather.com'
    },
    timestamp: Date.now()
  });
});

module.exports = router;
