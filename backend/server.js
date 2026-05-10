// 后端服务器主文件
// 路由配置、中间件设置、API 端点实现

const axios = require('axios');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
// 监听端口，优先读取环境变量，便于本地开发和部署时切换。
const PORT = process.env.PORT || 3000;
// 百度地图 Key，用于逆地理编码或定位相关能力。
const BAIDU_MAP_API_KEY = process.env.BAIDU_MAP_API_KEY;
// 百度地图接口白名单来源页地址，避免接口被来源校验拦截。
const BAIDU_MAP_REFERER = process.env.BAIDU_MAP_REFERER || 'http://localhost:8000/';
// 和风天气 Key，用于城市查询、实时天气、空气质量和逐小时预报。
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY;
// 和风天气 API 主机名，当前项目使用自定义域名而不是默认主机。
const QWEATHER_API_HOST = process.env.QWEATHER_API_HOST || 'devapi.qweather.com';
// 天气缓存的存活时间，单位是秒。
const CACHE_TTL_WEATHER = Number(process.env.CACHE_TTL_WEATHER || 3600);
// AQI 缓存的存活时间，单位是秒。
const CACHE_TTL_AQI = Number(process.env.CACHE_TTL_AQI || 1800);
// 天气和 AQI 共用一份缓存时，取更短的有效期，避免一边过期一边继续复用。
const CACHE_TTL_SECONDS = Math.min(CACHE_TTL_WEATHER, CACHE_TTL_AQI);

// 中间件
// 允许跨域请求，方便前端页面和后端 API 分端口访问。
app.use(cors());
// 打印 HTTP 访问日志，便于调试接口请求和响应。
app.use(morgan('combined'));
// 让 Express 自动解析 JSON 请求体，例如 /api/location 的 POST body。
app.use(express.json());

// 数据存储（演示用，实际应使用数据库）
// 存定位结果的内存对象，key 为“经纬度字符串”，value 为定位信息。
const locationStore = {};
// 存天气和 AQI 的内存缓存，key 为城市名，value 为缓存时间和数据包。
const weatherCache = {};

function normalizeCityName(rawCity) {
  // 防御式判断：空值或非字符串直接返回空字符串，避免后续报错。
  if (!rawCity || typeof rawCity !== 'string') {
    return '';
  }
  // 统一去掉末尾“市”，让“北京”和“北京市”可以命中同一份缓存。
  return rawCity.replace(/市$/, '').trim();
}

function mapAqiLevel(aqi) {
  // 把 AQI 数字转换成中文等级，便于前端直接展示。
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
  // 启动时做环境变量检查，只提醒，不阻止服务启动。
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
  // 统一拼接和风天气接口地址，避免到处手写 host。
  return `https://${QWEATHER_API_HOST}${pathname}`;
}

async function reverseGeocodeByBaidu(lat, lon) {
  // 没有百度 Key 就直接抛错，避免继续发无效请求。
  if (!BAIDU_MAP_API_KEY) {
    throw new Error('BAIDU_MAP_API_KEY is not configured');
  }

  // 调用百度逆地理编码接口，把经纬度转换成城市、区县和详细地址。
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
  // 没有和风 Key 就直接抛错，后续天气、AQI、趋势接口都依赖它。
  if (!QWEATHER_API_KEY) {
    throw new Error('QWEATHER_API_KEY is not configured');
  }

  // 先用城市名查询和风的 location id，再用 id 去取实时天气和逐小时预报。
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
  // 实时天气接口，返回当前温度、湿度、风向、天气现象等。
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
  // 逐小时预报接口，用于前端折线图展示 24 小时趋势。
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
  // 当前空气质量接口，需要经纬度来获取附近站点的空气质量数据。
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
  // options 目前只使用 bypassCache，用于手动切城市时强制刷新。
  const { bypassCache = false } = options;
  // 统一城市名，避免“北京”和“北京市”被当成两个缓存 key。
  const normalizedCity = normalizeCityName(city);
  // 取出该城市对应的缓存记录。
  const cached = weatherCache[normalizedCity];
  // 当前时间戳，用来和缓存时间比较是否过期。
  const nowMs = Date.now();

  // 如果没有强制刷新，并且缓存存在且未过期，就直接复用缓存。
  if (!bypassCache && cached && nowMs - cached.cachedAt < CACHE_TTL_SECONDS * 1000) {
    return cached.data;
  }

  // 缓存不存在或已过期时，重新查询和风的城市信息。
  const location = await getQWeatherLocation(normalizedCity);
  // 实时天气和空气质量可以并发请求，减少等待时间。
  const [weatherNow, airNow] = await Promise.all([
    fetchQWeatherNow(location.id),
    fetchQWeatherAirNow(location.lat, location.lon)
  ]);

  // 取空气质量数组中的第一项作为当前主指标。
  const primaryIndex = airNow.indexes[0] || {};
  // 把和风返回的污染物数组整理成一个更适合前端读取的 key-value 对象。
  const pollutantMap = {};
  for (const pollutant of airNow.pollutants || []) {
    pollutantMap[pollutant.name || pollutant.code] = Number(pollutant?.concentration?.value);
  }

  // 组装天气数据，统一成项目自己的返回格式。
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

  // 组装 AQI 数据，前端可以直接展示等级、污染物和健康建议。
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

  // 把天气和 AQI 打包成一个缓存对象，一次请求得到的结果一起缓存。
  const payload = { weather, aqi };
  // 写入内存缓存：key 是城市名，value 是缓存时间和数据。
  weatherCache[normalizedCity] = {
    cachedAt: nowMs,
    data: payload
  };

  return payload;
}

async function getWeatherTrendByCity(city) {
  // 趋势图不走缓存，直接按城市去和风拿 24 小时预报。
  const normalizedCity = normalizeCityName(city);
  const location = await getQWeatherLocation(normalizedCity);
  const hourly = await fetchQWeatherHourly(location.id);

  // 只保留前 24 条，并且整理成前端图表更好消费的结构。
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
  // 从请求体里读取经纬度和可选的城市信息。
  const { lat, lon, city, district, province, address } = req.body;

  // 经纬度必须存在，否则直接返回 400。
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
  // 进一步校验经纬度必须是可用数字。
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({
      code: 400,
      message: 'Invalid latitude or longitude',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    // 如果前端已经给了 city，就直接使用；否则后端自己调百度逆地理编码。
    const geo = city
      ? {
          city,
          district: district || '',
          province: province || '',
          address: address || ''
        }
      : await reverseGeocodeByBaidu(latitude, longitude);
    // 把定位结果整理成统一对象，方便前端直接展示。
    const location = {
      city: geo.city,
      district: geo.district,
      province: geo.province,
      address: geo.address,
      lat: latitude,
      lon: longitude,
      timestamp: new Date().toISOString()
    };

    // 存到内存对象里，key 用“经纬度字符串”标识一次定位。
    locationStore[`${latitude},${longitude}`] = location;

    // 成功时把定位结果返回给前端。
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
  // 从 query 中读取城市和是否强制刷新缓存的标记。
  const { city, forceRefresh } = req.query;

  // 城市名是必需参数。
  if (!city) {
    return res.status(400).json({
      code: 400,
      message: 'Missing city parameter',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    // 调用统一的数据聚合函数，天气接口只返回 weather 部分。
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
  // 读取城市和强制刷新参数。
  const { city, forceRefresh } = req.query;

  // 城市名是必需参数。
  if (!city) {
    return res.status(400).json({
      code: 400,
      message: 'Missing city parameter',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    // 仍然复用同一份天气+AQI 聚合结果，只是返回 aqi 部分。
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
  // 趋势图只需要城市名。
  const { city } = req.query;

  // 城市名缺失时返回 400。
  if (!city) {
    return res.status(400).json({
      code: 400,
      message: 'Missing city parameter',
      data: null,
      timestamp: Date.now()
    });
  }

  try {
    // 直接去和风拿逐小时预报，不经过 weatherCache。
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
  // 这个接口只用来确认服务是否存活。
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
  // 所有未匹配到的路径统一返回 404 JSON，避免前端看到 HTML 错误页。
  res.status(404).json({
    code: 404,
    message: 'Not found',
    data: null,
    timestamp: Date.now()
  });
});

// 启动服务器
app.listen(PORT, () => {
  // 启动前先提醒缺失的环境变量，方便排查配置问题。
  checkRequiredKeys();
  // 输出启动信息，方便在终端里确认服务已经起来。
  console.log(`🚀 Haze Detection Backend Server running on http://localhost:${PORT}`);
  console.log(`📍 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
