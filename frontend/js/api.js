// API 接口调用模块

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

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
async function fetchWeather(city, options = {}) {
  try {
    const params = new URLSearchParams({ city });
    if (options.forceRefresh) {
      params.set('forceRefresh', '1');
    }

    const response = await fetch(`${API_BASE_URL}/weather?${params.toString()}`);

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
async function fetchAQI(city, options = {}) {
  try {
    const params = new URLSearchParams({ city });
    if (options.forceRefresh) {
      params.set('forceRefresh', '1');
    }

    const response = await fetch(`${API_BASE_URL}/aqi?${params.toString()}`);

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
 * 获取逐小时趋势
 */
async function fetchTrend(city, options = {}) {
  try {
    const params = new URLSearchParams({ city });
    if (options.forceRefresh) {
      params.set('forceRefresh', '1');
    }

    const response = await fetch(`${API_BASE_URL}/trend?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching trend:', error);
    throw error;
  }
}

/**
 * 获取趋势数据
 */
/**
 * 等待百度地图 JS API 加载完成
 */
function waitForBMapReady(timeoutMs = 5000, intervalMs = 100) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const timer = setInterval(() => {
      if (window.BMap && window.BMap.Geolocation) {
        clearInterval(timer);
        resolve();
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(timer);
        reject(new Error('百度地图加载超时，请手动选择城市'));
      }
    }, intervalMs);
  });
}

/**
 * 使用百度地图 JS SDK 获取定位
 */
async function getUserLocation() {
  await waitForBMapReady();

  return new Promise((resolve, reject) => {
    try {
      const geolocation = new window.BMap.Geolocation();
      geolocation.getCurrentPosition((position) => {
        if (geolocation.getStatus() !== window.BMAP_STATUS_SUCCESS) {
          reject(new Error('百度地图定位失败，请手动选择城市'));
          return;
        }

        const latitude = position?.point?.lat;
        const longitude = position?.point?.lng;
        const city = position?.address?.city || position?.addressComponent?.city || '';

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(new Error('百度地图定位结果无效，请手动选择城市'));
          return;
        }

        resolve({
          lat: latitude,
          lon: longitude,
          city
        });
      }, {
        enableHighAccuracy: true
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 同时获取天气和 AQI
 */
async function fetchWeatherAndAQI(city, options = {}) {
  try {
    const [weatherResult, aqiResult] = await Promise.all([
      fetchWeather(city, options),
      fetchAQI(city, options)
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
