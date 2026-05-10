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
- 通过和风天气 API 获取实时数据
- 服务器端数据缓存和管理
- 支持多城市查询

### 4. 数据展示
- 温度、湿度折线图
- AQI 等级提示
- 污染物浓度展示

## 项目结构

```
Haze2/
├── backend/               # 后端 API 服务
│   ├── server.js          # 主服务文件
│   ├── package.json       # 依赖与脚本
│   ├── package-lock.json  # 依赖锁定文件
│   ├── .env.example       # 环境变量模板
│   └── .env               # 本地环境变量（不提交）
├── frontend/              # 前端页面
│   ├── index.html         # 主页面
│   ├── css/
│   │   └── style.css      # 样式文件
│   └── js/
│       ├── api.js         # API 调用与定位封装
│       ├── main.js        # 页面主逻辑
│       └── utils.js       # 工具函数
├── docs/                  # 项目文档
│   ├── DESIGN.md          # 设计文档
│   └── API.md             # API 接口文档
├── QUICKSTART.md          # 快速启动说明
└── README.md              # 项目说明
```

## 技术栈

- **后端**：Node.js + Express
- **前端**：HTML5 + CSS3 + JavaScript
- **地图**：百度地图 API
- **天气数据**：和风天气 API（QWeather）
- **图表**：ECharts
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
- 和风天气 API Key

详见 `backend/.env.example`

## 实现进度

- [x] 项目初始化
- [x] 后端 API 实现
- [x] 前端页面设计
- [x] 数据集成
- [x] 核心功能验证
- [ ] 部署

## 当前状态

项目核心功能已完成并可本地运行：定位、天气、AQI、逐小时趋势图、城市手动切换，以及真实百度/和风数据接入均已实现。当前未完成项主要是正式部署、性能压测和更系统的自动化测试。

## 贡献者

- 张三 (方案设计、环境搭建)

## 参考资源

- [百度地图 API 文档](https://lbsyun.baidu.com/)
- [和风天气 API 文档](https://www.qweather.com/)
