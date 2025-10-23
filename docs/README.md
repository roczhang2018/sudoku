# 📚 贪吃蛇游戏文档

欢迎来到贪吃蛇游戏项目文档中心！

## 📋 文档概览

### 🚀 部署相关
- [部署指南](./deployment.md) - 完整的部署方案和步骤
- [API文档](./api.md) - 详细的API接口说明

### 🏗️ 设计文档
- [系统架构](./architecture.md) - 整体系统架构设计
- [前端设计](./frontend-design.md) - 前端架构和实现细节
- [后端设计](./backend-design.md) - 后端架构和实现细节
- [技术栈对比](./tech-stack.md) - 技术选型对比和分析

### 🏗️ 架构说明

本项目采用Node.js统一服务架构，前后端整合在一个服务中：

```
用户请求 → Node.js(80) → 内部路由分发
├── 静态文件 (HTML, CSS, JS)
├── API请求 (/api/*)
└── WebSocket (/socket.io/*)
```

### 🎯 快速开始

#### 1. 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 2. 生产部署
```bash
# 生成部署包
npm run deploy

# 上传到服务器并启动
./start.sh
```

#### 3. 服务管理
```bash
# 启动服务
npm run service:start

# 停止服务
npm run service:stop

# 重启服务
npm run service:restart

# 查看状态
npm run service:status
```

## 🔧 技术栈

### 后端技术
- **Node.js** - 服务器运行时
- **Express** - Web框架
- **Socket.IO** - WebSocket通信
- **JWT** - 用户认证
- **Winston** - 日志管理
- **文件存储** - 数据持久化

### 前端技术
- **HTML5 Canvas** - 游戏渲染
- **ES6 Modules** - 模块化开发
- **Web Audio API** - 音效处理
- **Socket.IO Client** - 实时通信

## 📁 项目结构

```
snake-game/
├── server.js                 # 统一服务器入口
├── package.json              # 项目配置
├── env.example               # 环境变量示例
├── public/                   # 前端静态文件
│   ├── index.html
│   ├── login.html
│   ├── style.css
│   └── js/
├── src/                      # 后端源码
│   ├── routes/              # API路由
│   ├── middleware/          # 中间件
│   ├── storage/             # 存储管理
│   ├── websocket/           # WebSocket处理
│   └── utils/               # 工具函数
├── config/                   # 配置文件
├── scripts/                  # 部署和启动脚本
├── data/                     # 数据存储目录
├── logs/                     # 日志目录
└── docs/                     # 文档目录
```

## 🚀 部署方案

### 方案特点
- **最少依赖** - 只需要Node.js
- **配置简单** - 一个命令启动
- **功能完整** - 支持所有现有功能
- **易于维护** - 单一进程管理

### 部署方式
1. **自动部署** - 使用部署脚本生成部署包
2. **手动部署** - 直接上传代码到服务器
3. **容器部署** - 使用Docker容器化部署

## 🔒 安全特性

- **JWT认证** - 安全的用户认证机制
- **CORS配置** - 跨域请求控制
- **输入验证** - 防止恶意输入
- **错误处理** - 统一的错误处理机制

## 📊 监控和维护

### 日志管理
- 应用日志：`logs/combined.log`
- 错误日志：`logs/error.log`
- 服务日志：`logs/service.log`

### 数据备份
```bash
# 手动备份
npm run backup

# 自动备份（crontab）
0 2 * * * cd /opt/snake-game && npm run backup
```

### 性能监控
- 健康检查：`GET /health`
- 进程监控：PM2或系统工具
- 资源监控：CPU、内存、磁盘使用率

## 🆘 故障排除

### 常见问题
1. **端口占用** - 检查80端口是否被占用
2. **权限问题** - 确保有权限绑定80端口
3. **依赖问题** - 重新安装Node.js依赖
4. **配置问题** - 检查环境变量配置

### 获取帮助
- 查看日志文件
- 检查配置文件
- 验证网络连接
- 提交GitHub Issue

## 📈 性能优化

### 系统优化
- 增加文件描述符限制
- 优化内核参数
- 配置防火墙规则

### 应用优化
- 启用Gzip压缩
- 设置静态文件缓存
- 使用PM2集群模式
- 配置连接池

## 🔄 版本更新

### 更新流程
1. 备份现有数据
2. 停止服务
3. 更新代码
4. 安装新依赖
5. 重启服务
6. 验证功能

### 回滚方案
1. 停止服务
2. 恢复备份数据
3. 回滚代码版本
4. 重启服务

## 📞 技术支持

如遇到问题，请按以下顺序寻求帮助：

1. **查看文档** - 仔细阅读相关文档
2. **检查日志** - 查看错误日志和访问日志
3. **搜索问题** - 在GitHub Issues中搜索类似问题
4. **提交Issue** - 如果问题仍未解决，提交新的Issue

---

**注意**: 本文档会持续更新，请定期查看最新版本。
