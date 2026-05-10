# 雾霾探测系统 - API 接口文档

## 基本信息

- 基础 URL: http://localhost:3000
- API 前缀: /api
- 请求格式: JSON
- 响应格式: JSON
- 认证: 无（课程实验项目）

## 响应格式标准

所有接口统一返回以下结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": 1715000000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 状态码，0 为成功 |
| message | string | 状态信息 |
| data | object/null | 业务数据 |
| timestamp | number | 毫秒时间戳 |

---

## 1. 保存定位信息

- 方法: POST
- 路径: /api/location

### 请求体

```json
{
  "lat": 39.9042,
  "lon": 116.4074,
  "city": "北京市",
  "district": "朝阳区",
  "province": "北京市",
  "address": "北京市朝阳区"
}
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lat | number | 是 | 纬度 |
| lon | number | 是 | 经度 |
| city | string | 否 | 城市名称（前端可直接传入） |
| district | string | 否 | 区县 |
| province | string | 否 | 省份 |
| address | string | 否 | 详细地址 |

### 成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "district": "朝阳区",
    "province": "北京市",
    "address": "北京市朝阳区",
    "lat": 39.9042,
    "lon": 116.4074,
    "timestamp": "2026-05-10T10:00:00.000Z"
  },
  "timestamp": 1715000000000
}
```

### 常见错误

- 400: 缺少或非法的 lat/lon
- 502: 百度地图服务调用失败

---

## 2. 获取实时天气

- 方法: GET
- 路径: /api/weather

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| city | string | 是 | 城市名称 |
| forceRefresh | string | 否 | 传 1 或 true 时绕过缓存 |

### 请求示例

```bash
curl "http://localhost:3000/api/weather?city=北京市"
curl "http://localhost:3000/api/weather?city=上海市&forceRefresh=1"
```

### 成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "temp": 20,
    "feels_like": 15,
    "humidity": 18,
    "weather": "阴",
    "wind_speed": 11,
    "wind_direction": "西北风",
    "aqi": 57,
    "aqi_level": "良",
    "primary_pollutant": "PM 10",
    "pollutants": {
      "PM2.5": 26.57,
      "PM10": 63.71,
      "O3": 78.29,
      "NO2": 16.71,
      "SO2": 3.86,
      "CO": 0.49
    },
    "update_time": "2026-05-10T10:00:00.000Z",
    "source": "qweather"
  },
  "timestamp": 1715000000000
}
```

---

## 3. 获取 AQI 详情

- 方法: GET
- 路径: /api/aqi

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| city | string | 是 | 城市名称 |
| forceRefresh | string | 否 | 传 1 或 true 时绕过缓存 |

### 成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "aqi": 57,
    "level": "良",
    "level_cn": "良",
    "primary_pollutant": "PM 10",
    "health_implications": "空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响。",
    "suggestions": "极少数异常敏感人群应减少户外活动。",
    "pollutants": {
      "PM2.5": 26.57,
      "PM10": 63.71,
      "O3": 78.29,
      "NO2": 16.71,
      "SO2": 3.86,
      "CO": 0.49
    },
    "update_time": "2026-05-10T10:00:00.000Z"
  },
  "timestamp": 1715000000000
}
```

---

## 4. 获取逐小时趋势

- 方法: GET
- 路径: /api/trend

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| city | string | 是 | 城市名称 |

### 成功响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "city": "北京市",
    "trend": [
      {
        "fxTime": "2026-05-10T10:00+08:00",
        "temp": 20,
        "humidity": 35,
        "text": "阴"
      }
    ]
  },
  "timestamp": 1715000000000
}
```

说明：trend 默认返回未来 24 小时数据。

---

## 5. 健康检查

- 方法: GET
- 路径: /health

### 成功响应示例

```json
{
  "code": 0,
  "message": "Server is running",
  "timestamp": 1715000000000
}
```

---

## 错误码说明

| 代码 | 含义 | 常见场景 |
|------|------|------|
| 0 | SUCCESS | 请求成功 |
| 400 | BAD_REQUEST | 缺少参数或参数格式错误 |
| 404 | NOT_FOUND | 路由不存在 |
| 502 | UPSTREAM_ERROR | 第三方服务异常（百度/和风） |

---

## 缓存说明

- weather 与 aqi 使用内存缓存，默认有效期由后端环境变量控制。
- trend 为逐小时预报，按城市实时拉取。
- 当 forceRefresh=1 或 true 时，weather/aqi 会绕过缓存。
