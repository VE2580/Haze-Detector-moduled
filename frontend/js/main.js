// 主程序文件

// DOM 元素缓存
const elements = {
  locateBtn: document.getElementById('locateBtn'),
  citySelect: document.getElementById('citySelect'),
  cityName: document.getElementById('cityName'),
  temperature: document.getElementById('temperature'),
  weatherType: document.getElementById('weatherType'),
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('windSpeed'),
  feelsLike: document.getElementById('feelsLike'),
  aqiScore: document.getElementById('aqiScore'),
  aqiLevel: document.getElementById('aqiLevel'),
  primaryPollutant: document.getElementById('primaryPollutant'),
  aqiAdvice: document.getElementById('aqiAdvice'),
  pm25: document.getElementById('pm25'),
  pm10: document.getElementById('pm10'),
  o3: document.getElementById('o3'),
  no2: document.getElementById('no2'),
  so2: document.getElementById('so2'),
  co: document.getElementById('co'),
  updateTime: document.getElementById('updateTime'),
  chartContainer: document.getElementById('tempHumidityChart')
};

// 全局状态
let currentCity = '北京市';
let chart = null;
let currentTrendData = [];

const MANUAL_CITIES = [
  '北京市',
  '上海市',
  '广州市',
  '深圳市',
  '杭州市',
  '成都市',
  '武汉市',
  '西安市',
  '重庆市',
  '南京市'
];

/**
 * 归一化城市名，便于和下拉框选项匹配
 */
function normalizeCityName(city) {
  return (city || '').replace(/市$/, '').trim();
}

/**
 * 初始化
 */
function init() {
  console.log('🚀 应用初始化...');

  // 绑定事件
  elements.locateBtn.addEventListener('click', handleLocate);
  elements.citySelect.addEventListener('change', handleCitySelectChange);

  syncCityDisplay(currentCity);

  // 初始加载
  loadWeatherData(currentCity);

  // 定期刷新数据（每30秒）
  setInterval(() => {
    loadWeatherData(currentCity);
  }, 30000);

  console.log('✅ 初始化完成');
}

/**
 * 处理定位
 */
async function handleLocate() {
  try {
    showLoading(elements.locateBtn);
    elements.locateBtn.textContent = '定位中...';

    // 获取用户位置
    const location = await getUserLocation();
    console.log('📍 获取到位置:', location);

    const cityName = (location.city || '').replace(/市$/, '').trim();
    const geo = cityName
      ? { city: cityName, district: '', province: '', address: '' }
      : await reverseGeocodeWithBaidu(location.lat, location.lon);
    console.log('🏙️ 解析到城市信息:', geo);

    // 发送到后端
    const locationResult = await fetchLocation(location.lat, location.lon, geo);

    if (locationResult.code === 0) {
      currentCity = locationResult.data.city;
      syncCityDisplay(currentCity);

      showNotification(`定位成功: ${currentCity}`, 'success');

      // 加载新城市的天气数据
      await loadWeatherData(currentCity, { forceRefresh: true });
    } else {
      showNotification('定位失败', 'error');
    }
  } catch (error) {
    console.error('定位错误:', error);
    showNotification(error.message || '定位出错，请手动选择城市', 'error');
    elements.citySelect.focus();
  } finally {
    showLoading(elements.locateBtn, false);
    elements.locateBtn.textContent = '📍 获取定位';
  }
}

/**
 * 处理手动选择城市
 */
async function handleCitySelectChange(event) {
  const selectedCity = event.target.value;
  if (!selectedCity) {
    return;
  }

  currentCity = selectedCity;
  syncCityDisplay(currentCity);
  await loadWeatherData(currentCity, { forceRefresh: true });
}

/**
 * 加载天气数据
 */
async function loadWeatherData(city, options = {}) {
  try {
    console.log(`📊 加载城市 ${city} 的数据...`);

    const [data, trendResult] = await Promise.all([
      fetchWeatherAndAQI(city, options),
      fetchTrend(city, options)
    ]);

    updateWeatherDisplay(data.weather);
    updateAQIDisplay(data.aqi);
    updatePollutantsDisplay(data.weather.pollutants);
    currentTrendData = trendResult.data.trend || [];
    updateChart(currentTrendData);
    updateTimestamp();

    console.log('✅ 数据更新完成');
  } catch (error) {
    console.error('加载数据错误:', error);
    showNotification('数据加载失败，请刷新页面', 'error');
  }
}

/**
 * 同步城市名称展示和下拉框状态
 */
function syncCityDisplay(city) {
  elements.cityName.textContent = city;
  elements.cityName.classList.add('fade-in');

  const normalizedCity = normalizeCityName(city);
  const matchedOption = Array.from(elements.citySelect.options).find((option) => {
    return normalizeCityName(option.value) === normalizedCity;
  });

  if (matchedOption) {
    elements.citySelect.value = matchedOption.value;
  }
}

/**
 * 更新天气显示
 */
function updateWeatherDisplay(weather) {
  elements.temperature.textContent = `${weather.temp}`;
  elements.weatherType.textContent = weather.weather;
  elements.humidity.textContent = `${weather.humidity}%`;
  elements.windSpeed.textContent = `${weather.wind_speed}`;
  elements.feelsLike.textContent = `${weather.feels_like}`;
}

/**
 * 更新 AQI 显示
 */
function updateAQIDisplay(aqi) {
  elements.aqiScore.textContent = aqi.aqi;
  elements.aqiScore.style.color = getAQIColor(aqi.aqi);

  elements.aqiLevel.textContent = aqi.level;
  elements.aqiLevel.style.backgroundColor = getAQIColor(aqi.aqi);

  elements.primaryPollutant.textContent = aqi.primary_pollutant;

  elements.aqiAdvice.textContent = aqi.health_implications;
}

/**
 * 更新污染物显示
 */
function updatePollutantsDisplay(pollutants) {
  elements.pm25.textContent = `${pollutants['PM2.5']} μg/m³`;
  elements.pm10.textContent = `${pollutants['PM10']} μg/m³`;
  elements.o3.textContent = `${pollutants['O3']} μg/m³`;
  elements.no2.textContent = `${pollutants['NO2']} μg/m³`;
  elements.so2.textContent = `${pollutants['SO2']} μg/m³`;
  elements.co.textContent = `${pollutants['CO']} mg/m³`;
}

/**
 * 更新时间戳
 */
function updateTimestamp() {
  elements.updateTime.textContent = formatDateTime();
}

/**
 * 初始化图表
 */
function initChart() {
  if (chart) {
    chart.dispose();
  }

  chart = echarts.init(elements.chartContainer);
}

/**
 * 更新图表数据
 */
function updateChart(trendData) {
  if (!chart) {
    initChart();
  }

  const dates = trendData.map(item => formatTrendTimeLabel(item.fxTime));
  const temps = trendData.map(item => item.temp);
  const humidities = trendData.map(item => item.humidity);

  const option = {
    title: {
      text: '逐小时温度 & 湿度趋势图',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#777',
      borderWidth: 1,
      textStyle: {
        color: '#fff'
      }
    },
    legend: {
      data: ['温度', '湿度'],
      top: 42,
      left: 'center'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '22%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '温度(°C)',
        position: 'left',
        axisLabel: {
          formatter: '{value}°C'
        }
      },
      {
        type: 'value',
        name: '湿度(%)',
        position: 'right',
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '温度',
        data: temps,
        type: 'line',
        yAxisIndex: 0,
        stroke: 2,
        smooth: true,
        itemStyle: {
          color: '#ff006e'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 0, 110, 0.5)' },
            { offset: 1, color: 'rgba(255, 0, 110, 0.1)' }
          ])
        }
      },
      {
        name: '湿度',
        data: humidities,
        type: 'line',
        yAxisIndex: 1,
        stroke: 2,
        smooth: true,
        itemStyle: {
          color: '#00b4d8'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 180, 216, 0.5)' },
            { offset: 1, color: 'rgba(0, 180, 216, 0.1)' }
          ])
        }
      }
    ]
  };

  chart.setOption(option);
}

/**
 * 处理窗口大小改变
 */
window.addEventListener('resize', () => {
  if (chart) {
    chart.resize();
  }
});

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('📱 雾霾探测系统已加载');
