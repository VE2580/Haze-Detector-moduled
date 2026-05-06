// 工具函数库

/**
 * 格式化日期时间
 */
function formatDateTime(date) {
  if (!date) date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取 AQI 等级对应的颜色
 */
function getAQIColor(aqi) {
  if (aqi <= 50) return '#06ffa5'; // 优 - 绿色
  if (aqi <= 100) return '#90ee90'; // 良 - 浅绿
  if (aqi <= 150) return '#ffff00'; // 轻度污染 - 黄色
  if (aqi <= 200) return '#ff8c00'; // 中度污染 - 橙色
  if (aqi <= 300) return '#ff0000'; // 重度污染 - 红色
  return '#8b0000'; // 严重污染 - 深红
}

/**
 * 获取 AQI 等级文字
 */
function getAQILevel(aqi) {
  if (aqi <= 50) return '优';
  if (aqi <= 100) return '良';
  if (aqi <= 150) return '轻度污染';
  if (aqi <= 200) return '中度污染';
  if (aqi <= 300) return '重度污染';
  return '严重污染';
}

/**
 * 获取 AQI 建议
 */
function getAQIAdvice(aqi) {
  if (aqi <= 50) {
    return '空气质量优秀，适宜所有人群户外活动。';
  }
  if (aqi <= 100) {
    return '空气质量良好，各类人群都可以正常活动。';
  }
  if (aqi <= 150) {
    return '易感人群应减少户外活动，一般人群可正常活动。';
  }
  if (aqi <= 200) {
    return '儿童、老年人、心脏病和呼吸病患者应减少户外活动。';
  }
  if (aqi <= 300) {
    return '儿童、老年人、心脏病和呼吸病患者应避免户外活动。';
  }
  return '所有人群应避免户外活动，室外活动需采取防护措施。';
}

/**
 * 生成模拟的历史数据
 */
function generateMockHistoryData() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('zh-CN').slice(5),
      temp: Math.round(Math.random() * 15 + 18),
      humidity: Math.round(Math.random() * 30 + 50)
    });
  }
  return data;
}

/**
 * 显示加载状态
 */
function showLoading(element, show = true) {
  if (show) {
    element.classList.add('loading');
  } else {
    element.classList.remove('loading');
  }
}

/**
 * 显示提示信息
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    ${type === 'success' ? 'background: #06ffa5;' : ''}
    ${type === 'error' ? 'background: #ef476f;' : ''}
    ${type === 'info' ? 'background: #00b4d8;' : ''}
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * 防抖函数
 */
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 */
function throttle(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn(...args);
      lastTime = now;
    }
  };
}
