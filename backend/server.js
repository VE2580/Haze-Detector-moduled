// 后端服务器主文件
// 路由配置、中间件设置、API 端点实现

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// 数据存储（演示用，实际应使用数据库）
const locationStore = {};
const weatherCache = {};

/**
 * POST /api/location
 * 保存用户定位信息
 */
app.post('/api/location', (req, res) => {
  const { lat, lon } = req.body;

  if (!lat || !lon) {
    return res.status(400).json({
      code: 400,
      message: 'Missing latitude or longitude',
      data: null,
      timestamp: Date.now()
    });
  }

  // 模拟地理编码（实际需调用百度地图 API）
  const mockCityData = {
    39.9042: { city: '北京市', district: '朝阳区' },
    30.5728: { city: '杭州市', district: '上城区' },
    31.2304: { city: '上海市', district: '浦东新区' }
  };

  const nearestLat = Object.keys(mockCityData).reduce((prev, curr) => 
    Math.abs(curr - lat) < Math.abs(prev - lat) ? curr : prev
  );

  const cityInfo = mockCityData[nearestLat] || { city: '未知城市', district: '未知区' };

  const location = {
    ...cityInfo,
    lat,
    lon,
    timestamp: new Date().toISOString()
  };

  locationStore[`${lat},${lon}`] = location;

  res.json({
    code: 0,
    message: 'success',
    data: location,
    timestamp: Date.now()
  });
});

/**
 * GET /api/weather
 * 获取天气数据
 */
app.get('/api/weather', (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({
      code: 400,
      message: 'Missing city parameter',
      data: null,
      timestamp: Date.now()
    });
  }

  // 模拟天气数据
  const mockWeatherData = {
    '北京市': {
      temp: 25,
      feels_like: 24,
      humidity: 65,
      weather: '晴',
      wind_speed: 3.2,
      aqi: 85,
      aqi_level: '良',
      primary_pollutant: 'PM2.5',
      pollutants: {
        'PM2.5': 35,
        'PM10': 52,
        'O3': 120,
        'NO2': 45,
        'SO2': 12,
        'CO': 0.8
      }
    },
    '杭州市': {
      temp: 28,
      feels_like: 27,
      humidity: 70,
      weather: '多云',
      wind_speed: 2.1,
      aqi: 72,
      aqi_level: '良',
      primary_pollutant: 'PM10',
      pollutants: {
        'PM2.5': 28,
        'PM10': 42,
        'O3': 95,
        'NO2': 35,
        'SO2': 8,
        'CO': 0.6
      }
    },
    '上海市': {
      temp: 26,
      feels_like: 25,
      humidity: 68,
      weather: '晴朗',
      wind_speed: 2.8,
      aqi: 78,
      aqi_level: '良',
      primary_pollutant: 'PM2.5',
      pollutants: {
        'PM2.5': 32,
        'PM10': 48,
        'O3': 110,
        'NO2': 42,
        'SO2': 10,
        'CO': 0.7
      }
    }
  };

  const weather = mockWeatherData[city] || {
    temp: 20,
    feels_like: 19,
    humidity: 60,
    weather: '阴',
    wind_speed: 2.0,
    aqi: 100,
    aqi_level: '轻度污染',
    primary_pollutant: 'PM2.5',
    pollutants: {
      'PM2.5': 55,
      'PM10': 70,
      'O3': 140,
      'NO2': 50,
      'SO2': 15,
      'CO': 1.0
    }
  };

  res.json({
    code: 0,
    message: 'success',
    data: {
      city,
      ...weather,
      update_time: new Date().toISOString(),
      source: 'baidu'
    },
    timestamp: Date.now()
  });
});

/**
 * GET /api/aqi
 * 获取 AQI 数据
 */
app.get('/api/aqi', (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({
      code: 400,
      message: 'Missing city parameter',
      data: null,
      timestamp: Date.now()
    });
  }

  // 模拟 AQI 数据
  const mockAQIData = {
    '北京市': {
      aqi: 85,
      level: '良',
      level_cn: '良好',
      primary_pollutant: 'PM2.5',
      health_implications: '空气质量良好，各类人群都可以正常活动。',
      suggestions: '继续保持良好的户外活动习惯。'
    },
    '杭州市': {
      aqi: 72,
      level: '良',
      level_cn: '良好',
      primary_pollutant: 'PM10',
      health_implications: '空气质量良好，适宜户外活动。',
      suggestions: '可以进行户外运动。'
    },
    '上海市': {
      aqi: 78,
      level: '良',
      level_cn: '良好',
      primary_pollutant: 'PM2.5',
      health_implications: '空气质量良好，各类人群都可以正常活动。',
      suggestions: '户外活动无特别限制。'
    }
  };

  const aqi = mockAQIData[city] || {
    aqi: 100,
    level: '轻度污染',
    level_cn: '轻度污染',
    primary_pollutant: 'PM2.5',
    health_implications: '易感人群应减少户外活动。',
    suggestions: '建议敏感人群增加户外活动。'
  };

  res.json({
    code: 0,
    message: 'success',
    data: {
      city,
      ...aqi,
      update_time: new Date().toISOString()
    },
    timestamp: Date.now()
  });
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
  console.log(`🚀 Haze Detection Backend Server running on http://localhost:${PORT}`);
  console.log(`📍 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
