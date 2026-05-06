# 快速开始指南

## 项目结构

```
haze-detection-system/
├── backend/              # Node.js 后端服务
├── frontend/             # HTML5 前端页面
├── docs/                 # 项目文档
├── .gitignore
├── README.md
└── CLAUDE.md            # 项目约定（此项目的规范）
```

## 前置要求

- Node.js 14+ 和 npm
- 现代浏览器（Chrome、Firefox、Safari、Edge）

## 后端启动

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，填入你的 API Key
# BAIDU_MAP_API_KEY=你的百度地图key
# QWEATHER_API_KEY=你的和风天气key
# 编辑后保存
```

### 3. 启动服务器

```bash
npm start
```

服务器将运行在 `http://localhost:3000`

**开发模式**（自动重启）：
```bash
npm run dev
```

## 前端打开

### 方式 1：使用本地服务器（推荐）

```bash
cd frontend
python -m http.server 8000
# 或 npm install -g http-server
# http-server
```

然后打开 `http://localhost:8000`

### 方式 2：直接打开文件

```bash
# Windows
start frontend/index.html

# macOS
open frontend/index.html

# Linux
xdg-open frontend/index.html
```

## API 端点（服务器运行时）

### 本地 API
- 定位：`POST http://localhost:3000/api/location`
- 天气：`GET http://localhost:3000/api/weather?city=北京市`
- AQI：`GET http://localhost:3000/api/aqi?city=北京市`
- 健康检查：`GET http://localhost:3000/health`

### 快速验证（PowerShell）
```powershell
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/location' -ContentType 'application/json' -Body '{"lat":39.9042,"lon":116.4074}'
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/weather?city=北京市'
Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/api/aqi?city=北京市'
```

详见 `docs/API.md`

## 常见问题

### Q: 前端无法连接到后端
**A:** 确保：
1. 后端服务运行在 `localhost:3000`
2. 浏览器允许跨域请求 (CORS)
3. 没有防火墙阻止

### Q: 天气数据为模拟数据
**A:** 这是演示版本。实际生产需：
1. 申请百度地图 API Key
2. 申请天气 API (和风/百度/墨迹)
3. 在 `backend/config` 中配置真实 API

### Q: 定位功能不工作
**A:** 确保：
1. 在 HTTPS 下使用（本地 localhost 除外）
2. 允许浏览器访问地理位置权限
3. 浏览器支持 Geolocation API

## 开发工作流

### 1. 新建功能分支
```bash
git checkout -b feature/your-feature-name
```

### 2. 开发和测试
```bash
# 后端测试
cd backend && npm test

# 前端开发
cd frontend
# 使用本地服务器并实时刷新
```

### 3. 提交代码
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### 4. 合并到 main
```bash
git checkout main
git merge feature/your-feature-name
```

## 部署

### 后端部署（示例：Heroku）
```bash
heroku create your-app-name
git push heroku main
```

### 前端部署（示例：GitHub Pages）
```bash
cd frontend
# 构建（如需）
# 上传到 docs/ 文件夹或使用 GitHub Actions
```

## 监控和日志

后端日志输出到控制台，可在 `backend/logs` 目录查看详细日志。

## 联系方式

遇到问题？
- 查看 `docs/` 目录的完整文档
- 提交 Issue 或 PR

## 许可证

MIT License

---

**准备好开始了吗？** 🚀

```bash
# 一键启动脚本（Windows）
cd backend && npm install && npm start
```

```bash
# 一键启动脚本（macOS/Linux）
cd backend && npm install && npm start &
cd ../frontend && python -m http.server 8000
```
