const express = require('express');
const router = express.Router();
const { getWeatherTrendByCity } = require('../services/weatherService');

router.get('/trend', async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({
      code: 400,
      message: 'Missing city parameter',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    const trend = await getWeatherTrendByCity(city);
    res.json({
      code: 0,
      message: 'success',
      data: {
        city,
        trend
      },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(502).json({
      code: 502,
      message: `Trend service error: ${error.message}`,
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;
