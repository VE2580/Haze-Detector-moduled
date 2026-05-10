const axios = require('axios');
const { QWEATHER_API_KEY, CACHE_TTL_SECONDS } = require('../config');
const { normalizeCityName, mapAqiLevel, buildQWeatherUrl } = require('../utils/qweather');

const weatherCache = {};

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

module.exports = {
  getWeatherAndAqiByCity,
  getWeatherTrendByCity
};
