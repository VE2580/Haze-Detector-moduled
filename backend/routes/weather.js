const express = require('express');
const router = express.Router();
const { getWeatherAndAqiByCity } = require('../services/weatherService');

router.get('/weather', async (req, res) => {
  const { city, forceRefresh } = req.query;
  if (!city) {
    return res.status(400).json({
      code: 400,
      message: 'Missing city parameter',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    const payload = await getWeatherAndAqiByCity(city, {
      bypassCache: forceRefresh === '1' || forceRefresh === 'true'
    });
    res.json({
      code: 0,
      message: 'success',
      data: payload.weather,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(502).json({
      code: 502,
      message: `Weather service error: ${error.message}`,
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;
