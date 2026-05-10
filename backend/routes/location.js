const express = require('express');
const router = express.Router();
const { reverseGeocodeByBaidu } = require('../services/locationService');

const locationStore = {};

router.post('/location', async (req, res) => {
  const { lat, lon, city, district, province, address } = req.body;

  if (lat === undefined || lon === undefined) {
    return res.status(400).json({
      code: 400,
      message: 'Missing latitude or longitude',
      data: null,
      timestamp: Date.now()
    });
  }

  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({
      code: 400,
      message: 'Invalid latitude or longitude',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    const geo = city
      ? {
          city,
          district: district || '',
          province: province || '',
          address: address || ''
        }
      : await reverseGeocodeByBaidu(latitude, longitude);

    const location = {
      city: geo.city,
      district: geo.district,
      province: geo.province,
      address: geo.address,
      lat: latitude,
      lon: longitude,
      timestamp: new Date().toISOString()
    };

    locationStore[`${latitude},${longitude}`] = location;

    res.json({
      code: 0,
      message: 'success',
      data: location,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(502).json({
      code: 502,
      message: `Location service error: ${error.message}`,
      data: null,
      timestamp: Date.now()
    });
  }
});

module.exports = router;
