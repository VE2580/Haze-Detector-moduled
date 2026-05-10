// 后端服务器主文件
// 路由配置、中间件设置、API 端点实现

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { PORT, BAIDU_MAP_API_KEY, QWEATHER_API_KEY, QWEATHER_API_HOST } = require('./config');
const locationRouter = require('./routes/location');
const weatherRouter = require('./routes/weather');
const aqiRouter = require('./routes/aqi');
const trendRouter = require('./routes/trend');
const debugRouter = require('./routes/debug');

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/api', locationRouter);
app.use('/api', weatherRouter);
app.use('/api', aqiRouter);
app.use('/api', trendRouter);
app.use('/api', debugRouter);

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

app.listen(PORT, () => {
  checkRequiredKeys();
  console.log(`🚀 Haze Detection Backend Server running on http://localhost:${PORT}`);
  console.log(`📍 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
