const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.warn(`[WARN] dotenv failed to load ${envPath}: ${dotenvResult.error.message}`);
}

const PORT = process.env.PORT || 3000;
const BAIDU_MAP_API_KEY = process.env.BAIDU_MAP_API_KEY;
const BAIDU_MAP_REFERER = process.env.BAIDU_MAP_REFERER || 'http://localhost:8000/';
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY;
const QWEATHER_API_HOST = process.env.QWEATHER_API_HOST || 'devapi.qweather.com';
const CACHE_TTL_WEATHER = Number(process.env.CACHE_TTL_WEATHER || 3600);
const CACHE_TTL_AQI = Number(process.env.CACHE_TTL_AQI || 1800);
const CACHE_TTL_SECONDS = Math.min(CACHE_TTL_WEATHER, CACHE_TTL_AQI);

module.exports = {
  PORT,
  BAIDU_MAP_API_KEY,
  BAIDU_MAP_REFERER,
  QWEATHER_API_KEY,
  QWEATHER_API_HOST,
  CACHE_TTL_WEATHER,
  CACHE_TTL_AQI,
  CACHE_TTL_SECONDS
};
