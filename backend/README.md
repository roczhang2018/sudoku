# Snake Game Backend

贪吃蛇游戏后端服务，提供实时游戏状态同步、用户认证和数据存储功能。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 访问服务

- 服务器地址: http://localhost:3000
- 健康检查: http://localhost:3000/health
- API文档: http://localhost:3000/api

## 📁 项目结构

```
backend/
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── config/                # 配置文件
│   └── default.json       # 默认配置
├── data/                  # 数据存储目录
│   ├── users/            # 用户数据
│   ├── games/            # 游戏状态
│   ├── sessions/         # 会话数据
│   └── records/          # 游戏记录
├── src/
│   ├── routes/           # API路由
│   │   ├── auth.js       # 认证路由
│   │   ├── game.js       # 游戏路由
│   │   └── user.js       # 用户路由
│   ├── websocket/        # WebSocket处理
│   │   └── WebSocketManager.js
│   ├── storage/          # 存储管理
│   │   └── FileStorageManager.js
│   ├── middleware/       # 中间件
│   │   └── auth.js       # 认证中间件
│   └── utils/            # 工具函数
│       └── logger.js     # 日志工具
└── scripts/              # 脚本文件
    └── start.js          # 启动脚本
```

## 🔧 配置

### 环境变量

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# 文件存储配置
DATA_DIR=./data
BACKUP_DIR=./backups

# WebSocket配置
WS_HEARTBEAT_INTERVAL=30000
WS_CONNECTION_TIMEOUT=60000

# CORS配置
CORS_ORIGIN=http://localhost:8000
```

### 配置文件

配置文件位于 `config/default.json`，包含：

- 服务器配置
- JWT设置
- 存储配置
- WebSocket设置
- CORS配置
- 日志配置

## 📡 API接口

### 认证接口

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "password123"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "password123"
}
```

#### 验证Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

### 游戏接口

#### 创建游戏
```http
POST /api/game/create
Authorization: Bearer <token>
```

#### 获取游戏状态
```http
GET /api/game/:gameId
Authorization: Bearer <token>
```

#### 更新游戏状态
```http
PUT /api/game/:gameId
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameState": "playing",
  "playerSnake": [...],
  "aiSnake": [...],
  "foods": [...],
  "score": 10,
  "aiScore": 8,
  "lives": 3,
  "infiniteMode": true,
  "difficulty": "medium",
  "speed": 120
}
```

#### 保存游戏记录
```http
POST /api/game/:gameId/record
Authorization: Bearer <token>
Content-Type: application/json

{
  "startTime": "2024-01-15T14:30:00Z",
  "endTime": "2024-01-15T14:32:00Z",
  "duration": {
    "total": 120000,
    "seconds": 120,
    "formatted": "2:00"
  },
  "mode": "无限循环",
  "difficulty": "medium",
  "playerScore": 25,
  "aiScore": 18,
  "winner": "玩家",
  "livesUsed": 1,
  "isWin": true
}
```

### 用户接口

#### 获取用户信息
```http
GET /api/user/profile
Authorization: Bearer <token>
```

#### 获取游戏记录
```http
GET /api/user/records
Authorization: Bearer <token>
```

#### 获取统计信息
```http
GET /api/user/stats
Authorization: Bearer <token>
```

## 🔌 WebSocket接口

### 连接认证

```javascript
socket.emit('authenticate', {
  token: 'your-jwt-token'
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});
```

### 加入游戏房间

```javascript
socket.emit('join-game', {
  gameId: 'game-uuid'
});

socket.on('game-state', (data) => {
  console.log('Game state:', data);
});
```

### 游戏状态同步

```javascript
socket.emit('game-state-update', {
  gameId: 'game-uuid',
  gameState: {
    // 游戏状态数据
  }
});

socket.on('game-state-updated', (data) => {
  console.log('Game state updated:', data);
});
```

### 游戏操作

```javascript
socket.emit('game-action', {
  gameId: 'game-uuid',
  action: 'move',
  payload: { direction: 'up' }
});

socket.on('game-action', (data) => {
  console.log('Game action:', data);
});
```

## 💾 数据存储

### 文件存储结构

- **用户数据**: `data/users/{userId}.json`
- **游戏状态**: `data/games/{gameId}.json`
- **会话数据**: `data/sessions/{sessionId}.json`
- **游戏记录**: `data/records/{userId}.json`

### 数据格式

#### 用户数据
```json
{
  "id": "user-uuid",
  "username": "player1",
  "email": "player1@example.com",
  "passwordHash": "hashed-password",
  "highScore": 150,
  "gamesPlayed": 25,
  "totalScore": 3000,
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-01-15T14:30:00Z"
}
```

#### 游戏状态
```json
{
  "id": "game-uuid",
  "userId": "user-uuid",
  "gameState": "playing",
  "playerSnake": [{"x": 10, "y": 10}],
  "aiSnake": [{"x": 30, "y": 10}],
  "foods": [{"x": 15, "y": 15, "color": "#FF0000"}],
  "score": 5,
  "aiScore": 3,
  "lives": 3,
  "infiniteMode": true,
  "difficulty": "medium",
  "speed": 120,
  "lastUpdated": "2024-01-15T14:30:00Z"
}
```

## 🛠️ 开发

### 开发模式

```bash
npm run dev
```

使用nodemon自动重启服务器。

### 测试

```bash
npm test
```

### 日志

日志文件位于 `logs/` 目录：

- `error.log` - 错误日志
- `combined.log` - 综合日志

### 数据备份

```bash
npm run backup
```

## 🚀 部署

### 生产环境

1. 设置环境变量
2. 安装依赖: `npm install --production`
3. 启动服务: `npm start`

### Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 进程管理

推荐使用PM2管理进程：

```bash
npm install -g pm2
pm2 start server.js --name snake-game-backend
```

## 📊 监控

### 健康检查

```http
GET /health
```

返回服务器状态信息。

### 连接统计

WebSocket连接统计可通过日志查看。

## 🔒 安全

- JWT token认证
- 密码bcrypt加密
- CORS配置
- 输入验证
- 错误处理

## 📚 相关文档

- **设置指南**: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **架构设计**: [doc/architecture.md](./doc/architecture.md)
- **API参考**: [doc/api-reference.md](./doc/api-reference.md)
- **用户指南**: [doc/user-guide.md](./doc/user-guide.md)
- **开发指南**: [doc/development-guide.md](./doc/development-guide.md)

## 📝 许可证

MIT License
