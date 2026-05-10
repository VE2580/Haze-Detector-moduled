const axios = require('axios');
const { BAIDU_MAP_API_KEY, BAIDU_MAP_REFERER } = require('../config');

async function reverseGeocodeByBaidu(lat, lon) {
  if (!BAIDU_MAP_API_KEY) {
    throw new Error('BAIDU_MAP_API_KEY is not configured');
  }

  const response = await axios.get('https://api.map.baidu.com/reverse_geocoding/v3/', {
    params: {
      ak: BAIDU_MAP_API_KEY,
      output: 'json',
      coordtype: 'wgs84ll',
      location: `${lat},${lon}`
    },
    headers: {
      Referer: BAIDU_MAP_REFERER,
      Origin: BAIDU_MAP_REFERER.replace(/\/$/, '')
    },
    timeout: 8000
  });

  if (response.data.status !== 0) {
    throw new Error(`Baidu reverse geocoding failed: status=${response.data.status}`);
  }

  const result = response.data.result || {};
  const component = result.addressComponent || {};

  return {
    city: component.city || '未知城市',
    district: component.district || '未知区',
    province: component.province || '',
    address: result.formatted_address || ''
  };
}

module.exports = {
  reverseGeocodeByBaidu
};
