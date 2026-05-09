// 后端服务器主文件
// 路由配置、中间件设置、API 端点实现

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BAIDU_MAP_API_KEY = process.env.BAIDU_MAP_API_KEY;
const BAIDU_MAP_REFERER = process.env.BAIDU_MAP_REFERER || 'http://localhost:8000/';
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY;
const QWEATHER_API_HOST = process.env.QWEATHER_API_HOST || 'devapi.qweather.com';
const CACHE_TTL_WEATHER = Number(process.env.CACHE_TTL_WEATHER || 3600);
const CACHE_TTL_AQI = Number(process.env.CACHE_TTL_AQI || 1800);
const CACHE_TTL_SECONDS = Math.min(CACHE_TTL_WEATHER, CACHE_TTL_AQI);

// 中间件
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// 数据存储（演示用，实际应使用数据库）
const locationStore = {};
const weatherCache = {};

function normalizeCityName(rawCity) {
  if (!rawCity || typeof rawCity !== 'string') {
    return '';
  }
  return rawCity.replace(/市$/, '').trim();
}

function mapAqiLevel(aqi) {
  const numeric = Number(aqi);
  if (!Number.isFinite(numeric)) {
    return '未知';
  }
  if (numeric <= 50) return '优';
  if (numeric <= 100) return '良';
  if (numeric <= 150) return '轻度污染';
  if (numeric <= 200) return '中度污染';
  if (numeric <= 300) return '重度污染';
  return '严重污染';
}

function checkRequiredKeys() {
  if (!BAIDU_MAP_API_KEY) {
    console.warn('[WARN] BAIDU_MAP_API_KEY is missing. /api/location will fail.');
  }
  if (!QWEATHER_API_KEY) {
    console.warn('[WARN] QWEATHER_API_KEY is missing. /api/weather and /api/aqi will fail.');
  }
  if (!QWEATHER_API_HOST) {
    console.warn('[WARN] QWEATHER_API_HOST is missing. Falling back to devapi.qweather.com.');
  }
}

function buildQWeatherUrl(pathname) {
  return `https://${QWEATHER_API_HOST}${pathname}`;
}

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

async function getQWeatherLocation(city) {
  if (!QWEATHER_API_KEY) {
    throw new Error('QWEATHER_API_KEY is not configured');
  }

  const response = await axios.get(buildQWeatherUrl('/geo/v2/city/lookup'), {
    params: {
      location: city,
      key: QWEATHER_API_KEY
    },
    timeout: 8000
  });

  const body = response.data || {};
  if (body.code !== '200' || !Array.isArray(body.location) || body.location.length === 0) {
    throw new Error(`QWeather city lookup failed: code=${body.code || 'unknown'}`);
  }

  return body.location[0];
}

async function fetchQWeatherNow(locationId) {
  const response = await axios.get(buildQWeatherUrl('/v7/weather/now'), {
    params: {
      location: locationId,
      key: QWEATHER_API_KEY
    },
    timeout: 8000
  });

  const body = response.data || {};
  if (body.code !== '200' || !body.now) {
    throw new Error(`QWeather now weather failed: code=${body.code || 'unknown'}`);
  }

  return body.now;
}

async function fetchQWeatherHourly(locationId) {
  const response = await axios.get(buildQWeatherUrl('/v7/weather/24h'), {
    params: {
      location: locationId,
      key: QWEATHER_API_KEY
    },
    timeout: 8000
  });

  const body = response.data || {};
  if (body.code !== '200' || !Array.isArray(body.hourly)) {
    throw new Error(`QWeather hourly forecast failed: code=${body.code || 'unknown'}`);
  }

  return body.hourly;
}

async function fetchQWeatherAirNow(latitude, longitude) {
  const response = await axios.get(buildQWeatherUrl(`/airquality/v1/current/${latitude}/${longitude}`), {
    params: {
      key: QWEATHER_API_KEY
    },
    timeout: 8000
  });

  const body = response.data || {};
  if (!Array.isArray(body.indexes) || body.indexes.length === 0) {
    throw new Error('QWeather air quality failed: empty indexes');
  }

  return body;
}

async function getWeatherAndAqiByCity(city, options = {}) {
  const { bypassCache = false } = options;
  const normalizedCity = normalizeCityName(city);
  const cached = weatherCache[normalizedCity];
  const nowMs = Date.now();

  if (!bypassCache && cached && nowMs - cached.cachedAt < CACHE_TTL_SECONDS * 1000) {
    return cached.data;
  }

  const location = await getQWeatherLocation(normalizedCity);
  const [weatherNow, airNow] = await Promise.all([
    fetchQWeatherNow(location.id),
    fetchQWeatherAirNow(location.lat, location.lon)
  ]);

  const primaryIndex = airNow.indexes[0] || {};
  const pollutantMap = {};
  for (const pollutant of airNow.pollutants || []) {
    pollutantMap[pollutant.name || pollutant.code] = Number(pollutant?.concentration?.value);
  }

  const weather = {
    city: location.name || city,
    temp: Number(weatherNow.temp),
    feels_like: Number(weatherNow.feelsLike),
    humidity: Number(weatherNow.humidity),
    weather: weatherNow.text,
    wind_speed: Number(weatherNow.windSpeed),
    wind_direction: weatherNow.windDir,
    aqi: Number(primaryIndex.aqi),
    aqi_level: primaryIndex.category || mapAqiLevel(primaryIndex.aqi),
    primary_pollutant: primaryIndex.primaryPollutant?.name || '未知',
    pollutants: {
      'PM2.5': pollutantMap['PM 2.5'] ?? pollutantMap['PM2.5'] ?? null,
      'PM10': pollutantMap['PM 10'] ?? pollutantMap['PM10'] ?? null,
      'O3': pollutantMap['O3'] ?? null,
      'NO2': pollutantMap['NO2'] ?? null,
      'SO2': pollutantMap['SO2'] ?? null,
      'CO': pollutantMap['CO'] ?? null
    },
    update_time: new Date().toISOString(),
    source: 'qweather'
  };

  const aqi = {
    city: location.name || city,
    aqi: Number(primaryIndex.aqi),
    level: mapAqiLevel(primaryIndex.aqi),
    level_cn: primaryIndex.category || mapAqiLevel(primaryIndex.aqi),
    primary_pollutant: primaryIndex.primaryPollutant?.name || '未知',
    health_implications: primaryIndex.health?.effect || '暂无健康建议。',
    suggestions: primaryIndex.health?.advice?.generalPopulation || '暂无建议。',
    pollutants: {
      'PM2.5': pollutantMap['PM 2.5'] ?? pollutantMap['PM2.5'] ?? null,
      'PM10': pollutantMap['PM 10'] ?? pollutantMap['PM10'] ?? null,
      'O3': pollutantMap['O3'] ?? null,
      'NO2': pollutantMap['NO2'] ?? null,
      'SO2': pollutantMap['SO2'] ?? null,
      'CO': pollutantMap['CO'] ?? null
    },
    update_time: new Date().toISOString()
  };

  const payload = { weather, aqi };
  weatherCache[normalizedCity] = {
    cachedAt: nowMs,
    data: payload
  };

  return payload;
}

async function getWeatherTrendByCity(city) {
  const normalizedCity = normalizeCityName(city);
  const location = await getQWeatherLocation(normalizedCity);
  const hourly = await fetchQWeatherHourly(location.id);

  return hourly.slice(0, 24).map((item) => ({
    fxTime: item.fxTime,
    temp: Number(item.temp),
    humidity: Number(item.humidity),
    text: item.text
  }));
}

/**
 * POST /api/location
 * 保存用户定位信息
 */
app.post('/api/location', async (req, res) => {
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

/**
 * GET /api/weather
 * 获取天气数据
 */
app.get('/api/weather', async (req, res) => {
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

/**
 * GET /api/aqi
 * 获取 AQI 数据
 */
app.get('/api/aqi', async (req, res) => {
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
      data: payload.aqi,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(502).json({
      code: 502,
      message: `AQI service error: ${error.message}`,
      data: null,
      timestamp: Date.now()
    });
  }
});

/**
 * GET /api/trend
 * 获取逐小时趋势数据
 */
app.get('/api/trend', async (req, res) => {
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

/**
 * 健康检查
 */
app.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: 'Server is running',
    timestamp: Date.now()
  });
});

/**
 * 404 处理
 */
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Not found',
    data: null,
    timestamp: Date.now()
  });
});

// 启动服务器
app.listen(PORT, () => {
  checkRequiredKeys();
  console.log(`🚀 Haze Detection Backend Server running on http://localhost:${PORT}`);
  console.log(`📍 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
