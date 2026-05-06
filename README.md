# 雾霾探测系统设计

## 项目概述
基于百度地图和天气 API 的移动端雾霾探测系统。用户可以通过定位自动获取所在城市的天气信息、空气质量指数（AQI）和相关污染指标。

## 核心功能

### 1. 定位功能
- 集成百度地图 API 获取用户位置
- 自动识别所在城市
- 定位信息保存到服务器

### 2. 界面设计
- 响应式 HTML5 页面
- 实时天气动态显示
- 空气质量指数可视化

### 3. 数据获取
- 通过百度/和风天气 API 获取实时数据
- 服务器端数据缓存和管理
- 支持多城市查询

### 4. 数据展示
- 温度、湿度折线图
- AQI 等级提示
- 污染物浓度展示

## 项目结构

```
haze-detection-system/
├── backend/              # 后端 API 服务
│   ├── server.js         # 主服务文件
│   ├── package.json      # 依赖配置
│   ├── routes/           # 路由模块
│   ├── controllers/       # 业务逻辑
│   └── config/           # 配置文件
├── frontend/             # 前端页面
│   ├── index.html        # 主页面
│   ├── css/              # 样式文件
│   ├── js/               # 脚本文件
│   └── assets/           # 图片资源
├── docs/                 # 项目文档
│   ├── DESIGN.md         # 设计文档
│   └── API.md            # API 接口文档
└── README.md             # 项目说明
```

## 技术栈

- **后端**：Node.js + Express
- **前端**：HTML5 + CSS3 + JavaScript
- **地图**：百度地图 API
- **天气数据**：百度/和风天气 API
- **图表**：ECharts / Chart.js
- **版本控制**：Git

## 快速开始

### 后端
```bash
cd backend
npm install
npm start
```

### 前端
```bash
cd frontend
# 使用本地服务器或直接打开 index.html
```

## 环境配置

需要配置以下 API Key：
- 百度地图 API Key
- 百度/和风天气 API Key

详见 `backend/config/config.example.js`

## 实现进度

- [ ] 项目初始化
- [ ] 后端 API 实现
- [ ] 前端页面设计
- [ ] 数据集成
- [ ] 测试与部署

## 贡献者

- 张三 (方案设计、环境搭建)

## 参考资源

- [百度地图 API 文档](https://lbsyun.baidu.com/)
- [和风天气 API 文档](https://www.qweather.com/)
