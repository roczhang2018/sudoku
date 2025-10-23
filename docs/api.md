# 📚 贪吃蛇游戏API文档

## 🌐 基础信息

- **基础URL**: `http://your-domain.com`
- **API版本**: v1
- **认证方式**: JWT Token
- **数据格式**: JSON

## 🔐 认证API

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "highScore": 0,
    "gamesPlayed": 0,
    "totalScore": 0
  },
  "token": "string",
  "expires": "2024-01-01T00:00:00.000Z"
}
```

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "highScore": 100,
    "gamesPlayed": 5,
    "totalScore": 500
  },
  "token": "string",
  "expires": "2024-01-01T00:00:00.000Z"
}
```

## 🎮 游戏API

### 创建游戏
```http
POST /api/game/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "mode": "single" | "multiplayer",
  "difficulty": "easy" | "medium" | "hard"
}
```

### 获取游戏状态
```http
GET /api/game/{gameId}
Authorization: Bearer <token>
```

### 更新游戏状态
```http
PUT /api/game/{gameId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 100,
  "lives": 2,
  "gameState": "playing" | "paused" | "gameOver"
}
```

### 保存游戏记录
```http
POST /api/game/{gameId}/record
Authorization: Bearer <token>
Content-Type: application/json

{
  "score": 100,
  "duration": 300,
  "mode": "single",
  "difficulty": "medium",
  "winner": "player" | "ai",
  "livesUsed": 1
}
```

## 👤 用户API

### 获取用户信息
```http
GET /api/user/profile
Authorization: Bearer <token>
```

### 更新用户信息
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "new-email@example.com",
  "highScore": 150
}
```

### 获取游戏记录
```http
GET /api/user/records?limit=10&offset=0
Authorization: Bearer <token>
```

### 获取用户统计
```http
GET /api/user/stats
Authorization: Bearer <token>
```

## 🔌 WebSocket API

### 连接WebSocket
```javascript
const socket = io('http://your-domain.com', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 事件列表

#### 客户端发送事件

**加入游戏房间**
```javascript
socket.emit('join-game', {
  gameId: 'game-id'
});
```

**发送游戏操作**
```javascript
socket.emit('game-action', {
  gameId: 'game-id',
  action: 'move',
  payload: {
    direction: 'up'
  }
});
```

**更新游戏状态**
```javascript
socket.emit('game-state-update', {
  gameId: 'game-id',
  gameState: {
    score: 100,
    lives: 2
  }
});
```

#### 服务器发送事件

**游戏状态更新**
```javascript
socket.on('game-state-updated', (data) => {
  console.log('Game state updated:', data);
});
```

**用户加入游戏**
```javascript
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
});
```

**游戏操作**
```javascript
socket.on('game-action', (data) => {
  console.log('Game action:', data);
});
```

## 📊 健康检查

### 服务健康状态
```http
GET /health
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 47828992,
    "heapTotal": 13766656,
    "heapUsed": 12302696
  },
  "cache": {
    "size": 0,
    "keys": []
  }
}
```

## ❌ 错误处理

### 错误响应格式
```json
{
  "error": "Error Type",
  "message": "Error description",
  "code": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 常见错误码

- `400` - 请求参数错误
- `401` - 未授权访问
- `403` - 禁止访问
- `404` - 资源不存在
- `500` - 服务器内部错误

### 认证错误
```json
{
  "error": "Unauthorized",
  "message": "Invalid token",
  "code": 401
}
```

### 验证错误
```json
{
  "error": "Validation Error",
  "message": "Username is required",
  "code": 400,
  "details": {
    "field": "username",
    "message": "Username is required"
  }
}
```

## 🔒 安全说明

### 认证流程
1. 用户注册/登录获取JWT Token
2. 在请求头中携带Token: `Authorization: Bearer <token>`
3. 服务器验证Token有效性
4. 返回请求结果

### 权限控制
- 公开接口: 注册、登录、健康检查
- 需要认证: 游戏相关、用户相关接口
- 管理员接口: 系统管理功能

### 数据验证
- 所有输入数据都经过验证
- 使用Joi进行参数验证
- 防止SQL注入和XSS攻击

## 📝 使用示例

### JavaScript客户端示例

```javascript
// 用户注册
const registerUser = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// 获取用户信息
const getUserProfile = async (token) => {
  const response = await fetch('/api/user/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// WebSocket连接
const connectWebSocket = (token) => {
  const socket = io('/', {
    auth: { token }
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  return socket;
};
```

### cURL示例

```bash
# 用户注册
curl -X POST http://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'

# 用户登录
curl -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 获取用户信息
curl -X GET http://your-domain.com/api/user/profile \
  -H "Authorization: Bearer your-jwt-token"
```

---

**注意**: 所有API请求都应该包含适当的错误处理，生产环境中建议使用HTTPS。
