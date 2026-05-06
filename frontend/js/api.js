// API 接口调用模块

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * 获取定位
 */
async function fetchLocation(lat, lon, geo = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lat,
        lon,
        city: geo.city,
        district: geo.district,
        province: geo.province,
        address: geo.address
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
}

/**
 * 获取天气
 */
async function fetchWeather(city) {
  try {
    const response = await fetch(`${API_BASE_URL}/weather?city=${encodeURIComponent(city)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

/**
 * 获取 AQI
 */
async function fetchAQI(city) {
  try {
    const response = await fetch(`${API_BASE_URL}/aqi?city=${encodeURIComponent(city)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching AQI:', error);
    throw error;
  }
}

/**
 * 获取定位（用户地理位置）
 */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // 返回默认位置（北京）
          resolve({
            lat: 39.9042,
            lon: 116.4074
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // 不支持地理定位，返回默认位置
      resolve({
        lat: 39.9042,
        lon: 116.4074
      });
    }
  });
}

/**
 * 同时获取天气和 AQI
 */
async function fetchWeatherAndAQI(city) {
  try {
    const [weatherResult, aqiResult] = await Promise.all([
      fetchWeather(city),
      fetchAQI(city)
    ]);

    return {
      weather: weatherResult.data,
      aqi: aqiResult.data
    };
  } catch (error) {
    console.error('Error fetching weather and AQI:', error);
    throw error;
  }
}

/**
 * 使用百度地图 JS SDK 进行逆地理编码
 */
function reverseGeocodeWithBaidu(lat, lon) {
  return new Promise((resolve, reject) => {
    if (!window.BMap || !window.BMap.Geocoder) {
      reject(new Error('Baidu Maps SDK is not loaded'));
      return;
    }

    const geocoder = new window.BMap.Geocoder();
    geocoder.getLocation(new window.BMap.Point(lon, lat), (result) => {
      if (!result || !result.addressComponents) {
        reject(new Error('Unable to reverse geocode location'));
        return;
      }

      const components = result.addressComponents;
      resolve({
        city: components.city || components.province || '未知城市',
        district: components.district || '',
        province: components.province || '',
        address: result.address || ''
      });
    });
  });
}
