const { QWEATHER_API_HOST } = require('../config');

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

function buildQWeatherUrl(pathname) {
  return `https://${QWEATHER_API_HOST}${pathname}`;
}

module.exports = {
  normalizeCityName,
  mapAqiLevel,
  buildQWeatherUrl
};
