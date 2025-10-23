# 后端服务设置指南

## 🚀 快速启动

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 3. 测试服务

```bash
# 运行测试脚本
node test-server.js
```

### 4. 启动前端

```bash
# 在项目根目录
python3 -m http.server 8000
```

## 📡 服务地址

- **后端API**: http://localhost:3000
- **前端游戏**: http://localhost:8000
- **健康检查**: http://localhost:3000/health

## 🔧 配置说明

### 环境变量

创建 `.env` 文件（可选）：

```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=http://localhost:8000
```

### 默认配置

配置文件位于 `backend/config/default.json`：

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "jwt": {
    "secret": "snake-game-super-secret-key-2024",
    "expiresIn": "24h"
  },
  "storage": {
    "dataDir": "./data",
    "backupDir": "./backups"
  },
  "cors": {
    "origin": ["http://localhost:8000", "http://127.0.0.1:8000"],
    "credentials": true
  }
}
```

## 📁 数据存储

数据存储在 `backend/data/` 目录：

```
data/
├── users/          # 用户数据
├── games/          # 游戏状态
├── sessions/       # 会话数据
└── records/        # 游戏记录
```

## 🔌 API接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/verify` - 验证token

### 游戏接口

- `POST /api/game/create` - 创建游戏
- `GET /api/game/:id` - 获取游戏状态
- `PUT /api/game/:id` - 更新游戏状态
- `DELETE /api/game/:id` - 删除游戏
- `POST /api/game/:id/record` - 保存游戏记录

### 用户接口

- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息
- `GET /api/user/records` - 获取游戏记录
- `GET /api/user/stats` - 获取统计信息

## 🔌 WebSocket接口

### 连接认证

```javascript
socket.emit('authenticate', { token: 'jwt-token' });
```

### 游戏房间

```javascript
// 加入游戏
socket.emit('join-game', { gameId: 'game-uuid' });

// 离开游戏
socket.emit('leave-game', { gameId: 'game-uuid' });
```

### 实时同步

```javascript
// 发送游戏状态更新
socket.emit('game-state-update', {
  gameId: 'game-uuid',
  gameState: { /* 游戏状态 */ }
});

// 接收游戏状态更新
socket.on('game-state-updated', (data) => {
  console.log('Game updated:', data);
});
```

## 🧪 测试

### 运行测试

```bash
# 测试后端服务
node test-server.js

# 测试特定功能
npm test
```

### 测试覆盖

- ✅ 健康检查
- ✅ 用户注册/登录
- ✅ Token验证
- ✅ 游戏创建/更新
- ✅ 游戏记录保存
- ✅ 用户统计

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口使用
   lsof -i :3000
   
   # 杀死进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存
   npm cache clean --force
   
   # 重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **WebSocket连接失败**
   - 检查防火墙设置
   - 确认CORS配置正确
   - 检查网络连接

4. **数据存储问题**
   ```bash
   # 检查数据目录权限
   ls -la data/
   
   # 重新创建数据目录
   rm -rf data/
   mkdir -p data/{users,games,sessions,records}
   ```

### 日志查看

```bash
# 查看错误日志
tail -f logs/error.log

# 查看综合日志
tail -f logs/combined.log
```

## 📊 监控

### 健康检查

```bash
curl http://localhost:3000/health
```

### 连接统计

WebSocket连接统计可通过日志查看。

## 🚀 部署

### 生产环境

1. 设置环境变量
2. 安装生产依赖
3. 启动服务

```bash
NODE_ENV=production npm start
```

### PM2部署

```bash
npm install -g pm2
pm2 start server.js --name snake-game-backend
pm2 startup
pm2 save
```

## 📝 开发说明

### 代码结构

- `server.js` - 主服务器文件
- `src/routes/` - API路由
- `src/websocket/` - WebSocket处理
- `src/storage/` - 数据存储
- `src/middleware/` - 中间件
- `src/utils/` - 工具函数

### 添加新功能

1. 在 `src/routes/` 添加新路由
2. 在 `src/storage/` 添加存储方法
3. 更新API文档
4. 添加测试用例

## 🔒 安全注意事项

- 生产环境请修改JWT密钥
- 配置HTTPS
- 设置防火墙规则
- 定期备份数据
- 监控异常访问

## 📞 支持

如有问题，请检查：

1. 服务器日志
2. 网络连接
3. 配置文件
4. 依赖版本

---

*最后更新: 2024年1月*
