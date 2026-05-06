// 主程序文件

// DOM 元素缓存
const elements = {
  locateBtn: document.getElementById('locateBtn'),
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

/**
 * 初始化
 */
function init() {
  console.log('🚀 应用初始化...');

  // 绑定事件
  elements.locateBtn.addEventListener('click', handleLocate);

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

    const geo = await reverseGeocodeWithBaidu(location.lat, location.lon);
    console.log('🏙️ 解析到城市信息:', geo);

    // 发送到后端
    const locationResult = await fetchLocation(location.lat, location.lon, geo);

    if (locationResult.code === 0) {
      currentCity = locationResult.data.city;
      elements.cityName.textContent = currentCity;
      elements.cityName.classList.add('fade-in');

      showNotification(`定位成功: ${currentCity}`, 'success');

      // 加载新城市的天气数据
      await loadWeatherData(currentCity);
    } else {
      showNotification('定位失败', 'error');
    }
  } catch (error) {
    console.error('定位错误:', error);
    showNotification('定位出错', 'error');
  } finally {
    showLoading(elements.locateBtn, false);
    elements.locateBtn.textContent = '📍 获取定位';
  }
}

/**
 * 加载天气数据
 */
async function loadWeatherData(city) {
  try {
    console.log(`📊 加载城市 ${city} 的数据...`);

    const data = await fetchWeatherAndAQI(city);
    updateWeatherDisplay(data.weather);
    updateAQIDisplay(data.aqi);
    updatePollutantsDisplay(data.weather.pollutants);
    updateChart(data.weather);
    updateTimestamp();

    console.log('✅ 数据更新完成');
  } catch (error) {
    console.error('加载数据错误:', error);
    showNotification('数据加载失败，请刷新页面', 'error');
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
function updateChart(weatherData) {
  if (!chart) {
    initChart();
  }

  // 生成模拟的历史数据
  const historyData = generateMockHistoryData();
  const dates = historyData.map(item => item.date);
  const temps = historyData.map(item => item.temp);
  const humidities = historyData.map(item => item.humidity);

  const option = {
    title: {
      text: '温度 & 湿度趋势图',
      left: 'center'
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
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
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
