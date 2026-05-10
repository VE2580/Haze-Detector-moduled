## 雾霾探测系统项目约定

根据 Claude Code 工程纪律，本文档定义项目规范。

### 项目信息
- **名称**：雾霾探测系统
- **类型**：全栈 Web 应用
- **技术栈**：Node.js + Express + HTML5/CSS/JS
- **目标**：学习实验项目

### 代码组织

#### 后端 (`backend/`)
- `server.js` - 主服务入口
- `package.json` - 依赖管理
- `.env.example` - 环境变量模板
- 路由/控制器/配置按需扩展

#### 前端 (`frontend/`)
- `index.html` - 主页面
- `js/` - JavaScript 模块（utils、api、main）
- `css/` - 样式表
- `assets/` - 图片资源

#### 文档 (`docs/`)
- `DESIGN.md` - 系统设计文档
- `API.md` - API 接口文档

### 开发流程

1. **新功能开发**
   - 创建特性分支：`git checkout -b feature/xxx`
   - 开发完成后运行测试
   - 提交 PR 前自我检查

2. **代码提交**
   - 规范提交信息：`feat: xxx` / `fix: xxx` / `docs: xxx`
   - 每次提交应该是完整的功能单元
   - 不提交 `.env`、`node_modules`、build 文件

3. **测试**
   - 后端：`npm test`
   - 前端：浏览器开发者工具
   - 端到端：手动测试主要流程

### 命名约定

- **文件**：kebab-case（`temp-chart.js`）
- **变量/函数**：camelCase（`getCurrentCity()`）
- **常量**：UPPER_SNAKE_CASE（`API_BASE_URL`）
- **类/组件**：PascalCase（`WeatherCard`）

### Git 规范

- `main` - 稳定版本
- `develop` - 开发分支
- `feature/*` - 功能分支
- `bugfix/*` - 缺陷修复分支

### 环境管理

- 敏感信息（API Key）使用 `.env` 存储
- `.env` 不进版本控制
- 提供 `.env.example` 作为参考

### 错误处理

- 后端 API 统一返回格式：`{ code, message, data, timestamp }`
- 前端捕获异常并显示用户友好的提示
- 不注释报错，找根本原因

### 文档维护

- 修改功能时同时更新相关文档
- API 变更必须更新 `docs/API.md`
- 大改动前先在 `docs/DESIGN.md` 更新设计

### 禁止事项 ⛔

- ❌ 删除文件或目录（除非明确说明）
- ❌ 修改 `.env` 中的敏感信息后提交
- ❌ `git push --force` 或 `git rebase` 主分支
- ❌ 为了让代码跑起来而注释掉报错
- ❌ 提交密钥、token、密码

### 改动验证

所有改动完成后必须运行验证：

**后端**：
```bash
cd backend
npm install  # 如有新依赖
npm test     # 运行测试
npm start    # 检查服务启动
```

**前端**：
- 在浏览器中打开 `http://localhost:8000`
- 检查控制台无错误
- 测试核心功能（定位、天气查询等）

### 当前进度

- [x] 项目初始化
- [x] 后端 API 框架
- [x] 前端页面框架
- [x] 真实 API 集成
- [x] 内存缓存与定位存储
- [ ] 完整测试用例
- [ ] 部署

### 当前结论

项目核心功能已经完成，当前文档仅保留未完成的部署和完整自动化测试项。

---

最后更新：2026-05-06

遵循规范，保持项目质量。
