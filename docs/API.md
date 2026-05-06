# 雾霾探测系统 - API 接口文档

## 基本信息

- **基础 URL**: `http://localhost:3000/api`
- **请求格式**: JSON
- **响应格式**: JSON
- **认证**: 无（演示版）

## 响应格式标准

所有 API 响应遵循以下格式：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "timestamp": 1620316200
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | 状态码，0=成功，>0=错误 |
| `message` | string | 状态信息 |
| `data` | object | 响应数据 |
| `timestamp` | number | Unix 时间戳 |

---

## API 端点

### 1. 获取定位 POST `/location`

保存用户的定位信息，获取对应的城市。

**请求:**
```json
{
  "lat": 39.9042,
  "lon": 116.4074
}
```

**参数说明:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `lat` | number | ✓ | 纬度 |
| `lon` | number | ✓ | 经度 |

**响应 (200 OK):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "district": "朝阳区",
    "address": "北京市朝阳区建国门外大街1号",
    "lat": 39.9042,
    "lon": 116.4074
  },
  "timestamp": 1620316200
}
```

**错误响应:**
```json
{
  "code": 400,
  "message": "Invalid coordinates",
  "data": null,
  "timestamp": 1620316200
}
```

---

### 2. 获取天气 GET `/weather`

获取指定城市的天气信息。

**请求:**
```
GET /weather?city=北京市&lang=zh-CN
```

**查询参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `city` | string | ✓ | 城市名称 |
| `lang` | string | ✗ | 语言，默认 zh-CN |

**响应 (200 OK):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "temp": 25,
    "feels_like": 24,
    "humidity": 65,
    "weather": "晴",
    "weather_icon": "sunny",
    "wind_speed": 3.2,
    "wind_direction": "北风",
    "pressure": 1013,
    "visibility": 10,
    "uv_index": 7,
    "aqi": 85,
    "aqi_level": "良",
    "primary_pollutant": "PM2.5",
    "pollutants": {
      "PM2.5": 35,
      "PM10": 52,
      "O3": 120,
      "NO2": 45,
      "SO2": 12,
      "CO": 0.8
    },
    "update_time": "2026-05-06T14:30:00Z",
    "source": "baidu"
  },
  "timestamp": 1620316200
}
```

**字段说明:**
| 字段 | 类型 | 说明 |
|------|------|------|
| `temp` | number | 温度（摄氏度） |
| `humidity` | number | 湿度（%） |
| `weather` | string | 天气描述 |
| `wind_speed` | number | 风速（m/s） |
| `aqi` | number | 空气质量指数 |
| `aqi_level` | string | AQI 等级（优/良/轻度污染/中度污染/重度污染/严重污染） |
| `pollutants` | object | 污染物浓度 |

---

### 3. 获取 AQI GET `/aqi`

获取指定城市的空气质量指数详情。

**请求:**
```
GET /aqi?city=北京市
```

**查询参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `city` | string | ✓ | 城市名称 |

**响应 (200 OK):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "aqi": 85,
    "level": "良",
    "level_cn": "良好",
    "color": "#90EE90",
    "primary_pollutant": "PM2.5",
    "health_implications": "空气质量良好，各类人群都可以正常活动。",
    "suggestions": "继续保持良好的户外活动习惯。",
    "pollutants": {
      "PM2.5": {
        "concentration": 35,
        "unit": "μg/m³",
        "limit": 35,
        "status": "达标"
      },
      "PM10": {
        "concentration": 52,
        "unit": "μg/m³",
        "limit": 70,
        "status": "达标"
      }
    },
    "update_time": "2026-05-06T14:30:00Z"
  },
  "timestamp": 1620316200
}
```

---

### 4. 获取历史数据 GET `/history`

获取指定城市指定时间段的天气和 AQI 历史数据。

**请求:**
```
GET /history?city=北京市&start_date=2026-05-01&end_date=2026-05-06
```

**查询参数:**
| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `city` | string | ✓ | 城市名称 |
| `start_date` | string | ✓ | 开始日期（YYYY-MM-DD） |
| `end_date` | string | ✓ | 结束日期（YYYY-MM-DD） |

**响应 (200 OK):**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "period": "2026-05-01 to 2026-05-06",
    "records": [
      {
        "date": "2026-05-06",
        "temp_avg": 25,
        "temp_min": 18,
        "temp_max": 28,
        "humidity_avg": 65,
        "aqi_avg": 85,
        "weather": "晴"
      },
      {
        "date": "2026-05-05",
        "temp_avg": 23,
        "temp_min": 16,
        "temp_max": 26,
        "humidity_avg": 70,
        "aqi_avg": 92,
        "weather": "多云"
      }
    ]
  },
  "timestamp": 1620316200
}
```

---

## 错误代码

| 代码 | 含义 | 说明 |
|------|------|------|
| 0 | SUCCESS | 请求成功 |
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权 |
| 404 | NOT_FOUND | 资源不存在 |
| 429 | RATE_LIMIT | 请求过于频繁 |
| 500 | SERVER_ERROR | 服务器错误 |
| 503 | SERVICE_UNAVAILABLE | 服务不可用 |

---

## 请求示例

### cURL

```bash
# 获取定位
curl -X POST http://localhost:3000/api/location \
  -H "Content-Type: application/json" \
  -d '{"lat": 39.9042, "lon": 116.4074}'

# 获取天气
curl -X GET "http://localhost:3000/api/weather?city=北京市"

# 获取 AQI
curl -X GET "http://localhost:3000/api/aqi?city=北京市"
```

### JavaScript

```javascript
// 获取天气
async function getWeather(city) {
  const response = await fetch(`/api/weather?city=${city}`);
  const result = await response.json();
  if (result.code === 0) {
    console.log(result.data);
  }
}

// 发送定位
async function sendLocation(lat, lon) {
  const response = await fetch('/api/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon })
  });
  const result = await response.json();
  return result.data.city;
}
```

---

## 速率限制

- 限制：每 IP 每分钟 **60 请求**
- 超过限制返回 `429` 状态码
- 重试建议：使用指数退避策略

---

## 缓存策略

- 天气数据：**1 小时**
- AQI 数据：**30 分钟**
- 定位数据：**不缓存**（实时保存）
