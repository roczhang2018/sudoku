# 🖥️ 后端设计文档

## 📋 概述

贪吃蛇游戏后端采用Node.js + Express架构，提供RESTful API和WebSocket实时通信服务，支持用户认证、游戏状态同步和数据持久化。

## 🏗️ 架构设计

### 整体架构
```
客户端请求层 (Client Layer)
├── HTTP请求 (REST API)
├── WebSocket连接 (Real-time)
└── 静态文件服务 (Static Files)

应用服务层 (Application Layer)
├── Express服务器 (HTTP Server)
├── Socket.IO服务器 (WebSocket Server)
├── 路由管理 (Route Management)
└── 中间件处理 (Middleware)

业务逻辑层 (Business Logic Layer)
├── 用户认证 (Authentication)
├── 游戏管理 (Game Management)
├── 数据存储 (Data Storage)
└── 实时通信 (Real-time Communication)

数据持久层 (Data Persistence Layer)
├── 文件存储 (File Storage)
├── 内存缓存 (Memory Cache)
└── 会话管理 (Session Management)
```

### 目录结构
```
src/
├── routes/              # API路由
│   ├── auth.js         # 认证相关API
│   ├── game.js         # 游戏相关API
│   └── user.js         # 用户相关API
├── middleware/          # 中间件
│   ├── auth.js         # 认证中间件
│   ├── cors.js         # 跨域中间件
│   └── error.js        # 错误处理中间件
├── storage/             # 存储管理
│   └── FileStorageManager.js
├── websocket/           # WebSocket处理
│   ├── gameHandler.js  # 游戏WebSocket处理
│   └── connectionManager.js
├── utils/               # 工具函数
│   ├── logger.js       # 日志工具
│   ├── validator.js    # 数据验证
│   └── crypto.js       # 加密工具
└── config/              # 配置管理
    ├── database.js     # 数据库配置
    └── server.js       # 服务器配置
```

## 🚀 核心服务

### 1. HTTP服务器 (Express)

#### 服务器配置
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 压缩中间件
app.use(compression());

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/user', userRoutes);

// 健康检查
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const cacheStats = storageManager.getCacheStats();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    memory: memoryUsage,
    cache: cacheStats
  });
});

// SPA路由处理
app.get('*', (req, res) => {
  // 排除API和WebSocket路径
  if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
    return res.status(404).json({ error: 'Not Found' });
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

### 2. WebSocket服务器 (Socket.IO)

#### 连接管理
```javascript
// websocket/connectionManager.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/auth');

class ConnectionManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });
    
    this.connections = new Map();
    this.gameRooms = new Map();
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }
  
  setupMiddleware() {
    // 认证中间件
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.username = decoded.username;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`用户连接: ${socket.username} (${socket.id})`);
      
      // 存储连接信息
      this.connections.set(socket.id, {
        userId: socket.userId,
        username: socket.username,
        connectedAt: new Date(),
        gameRoom: null
      });
      
      // 游戏相关事件
      socket.on('join-game', (data) => this.handleJoinGame(socket, data));
      socket.on('leave-game', () => this.handleLeaveGame(socket));
      socket.on('game-action', (data) => this.handleGameAction(socket, data));
      socket.on('game-state-update', (data) => this.handleGameStateUpdate(socket, data));
      
      // 断开连接
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }
}
```

#### 游戏状态同步
```javascript
// websocket/gameHandler.js
class GameHandler {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.gameStates = new Map();
  }
  
  handleJoinGame(socket, data) {
    const { gameId, gameMode } = data;
    
    // 加入游戏房间
    socket.join(gameId);
    
    // 初始化游戏状态
    if (!this.gameStates.has(gameId)) {
      this.gameStates.set(gameId, {
        id: gameId,
        mode: gameMode,
        players: new Map(),
        gameState: 'waiting',
        createdAt: new Date()
      });
    }
    
    const gameState = this.gameStates.get(gameId);
    gameState.players.set(socket.userId, {
      socketId: socket.id,
      username: socket.username,
      score: 0,
      lives: 3,
      connected: true
    });
    
    // 通知房间内其他玩家
    socket.to(gameId).emit('player-joined', {
      userId: socket.userId,
      username: socket.username
    });
    
    // 发送当前游戏状态
    socket.emit('game-state', gameState);
  }
  
  handleGameStateUpdate(socket, data) {
    const { gameId, gameData } = data;
    
    if (!this.gameStates.has(gameId)) {
      return;
    }
    
    const gameState = this.gameStates.get(gameId);
    
    // 更新游戏数据
    if (gameState.players.has(socket.userId)) {
      const player = gameState.players.get(socket.userId);
      player.score = gameData.score || player.score;
      player.lives = gameData.lives || player.lives;
    }
    
    // 广播给房间内所有玩家
    this.connectionManager.io.to(gameId).emit('game-state-updated', {
      gameId,
      gameData,
      timestamp: new Date()
    });
  }
}
```

### 3. 数据存储 (FileStorageManager)

#### 文件存储架构
```javascript
// storage/FileStorageManager.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileStorageManager {
  constructor() {
    this.dataDir = process.env.DATA_DIR || './data';
    this.backupDir = process.env.BACKUP_DIR || './backups';
    
    // 内存缓存
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0
    };
    
    this.initializeDirectories();
  }
  
  async initializeDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'users'),
      path.join(this.dataDir, 'sessions'),
      path.join(this.dataDir, 'games'),
      path.join(this.dataDir, 'records'),
      this.backupDir
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`创建目录失败: ${dir}`, error);
      }
    }
  }
  
  // 用户数据管理
  async saveUser(userData) {
    const userId = userData.id;
    const filePath = path.join(this.dataDir, 'users', `${userId}.json`);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
      this.cache.set(`user:${userId}`, userData);
      return true;
    } catch (error) {
      console.error('保存用户数据失败:', error);
      return false;
    }
  }
  
  async getUser(userId) {
    // 先检查缓存
    const cacheKey = `user:${userId}`;
    if (this.cache.has(cacheKey)) {
      this.cacheStats.hits++;
      return this.cache.get(cacheKey);
    }
    
    // 从文件读取
    const filePath = path.join(this.dataDir, 'users', `${userId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const userData = JSON.parse(data);
      
      // 更新缓存
      this.cache.set(cacheKey, userData);
      this.cacheStats.misses++;
      
      return userData;
    } catch (error) {
      this.cacheStats.misses++;
      return null;
    }
  }
  
  // 游戏记录管理
  async saveGameRecord(recordData) {
    const recordId = recordData.id || this.generateId();
    const filePath = path.join(this.dataDir, 'records', `${recordId}.json`);
    
    try {
      const record = {
        id: recordId,
        ...recordData,
        createdAt: new Date().toISOString()
      };
      
      await fs.writeFile(filePath, JSON.stringify(record, null, 2));
      return recordId;
    } catch (error) {
      console.error('保存游戏记录失败:', error);
      return null;
    }
  }
  
  async getGameRecords(userId, limit = 50) {
    const recordsDir = path.join(this.dataDir, 'records');
    
    try {
      const files = await fs.readdir(recordsDir);
      const records = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(recordsDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const record = JSON.parse(data);
        
        if (record.userId === userId) {
          records.push(record);
        }
      }
      
      // 按时间排序并限制数量
      return records
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error('获取游戏记录失败:', error);
      return [];
    }
  }
  
  // 缓存管理
  getCacheStats() {
    return {
      ...this.cacheStats,
      size: this.cache.size,
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };
  }
  
  clearCache() {
    this.cache.clear();
    this.cacheStats = { hits: 0, misses: 0, size: 0 };
  }
  
  // 数据备份
  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    
    try {
      await fs.mkdir(backupPath, { recursive: true });
      
      // 复制数据目录
      await this.copyDirectory(this.dataDir, backupPath);
      
      console.log(`备份完成: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('备份失败:', error);
      return null;
    }
  }
  
  async copyDirectory(src, dest) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}
```

## 🔐 认证系统

### 1. JWT认证

#### 认证中间件
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '访问令牌缺失' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的访问令牌' });
  }
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  authMiddleware,
  generateToken,
  hashPassword,
  comparePassword
};
```

### 2. 用户认证API

#### 认证路由
```javascript
// routes/auth.js
const express = require('express');
const { generateToken, hashPassword, comparePassword } = require('../middleware/auth');
const storageManager = require('../storage/FileStorageManager');

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码不能为空' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }
    
    // 检查用户是否已存在
    const existingUser = await storageManager.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }
    
    // 创建新用户
    const userId = storageManager.generateId();
    const hashedPassword = await hashPassword(password);
    
    const userData = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      gameStats: {
        totalGames: 0,
        totalScore: 0,
        highScore: 0,
        wins: 0,
        losses: 0
      }
    };
    
    // 保存用户数据
    const saved = await storageManager.saveUser(userData);
    if (!saved) {
      return res.status(500).json({ error: '用户注册失败' });
    }
    
    // 生成访问令牌
    const token = generateToken(userData);
    
    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }
    
    // 查找用户
    const user = await storageManager.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 验证密码
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString();
    await storageManager.saveUser(user);
    
    // 生成访问令牌
    const token = generateToken(user);
    
    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        gameStats: user.gameStats
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 令牌验证
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.userId,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router;
```

## 🎮 游戏管理

### 1. 游戏状态管理

#### 游戏API
```javascript
// routes/game.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const storageManager = require('../storage/FileStorageManager');

const router = express.Router();

// 保存游戏记录
router.post('/save-record', authMiddleware, async (req, res) => {
  try {
    const { gameMode, duration, score, aiScore, lives, won } = req.body;
    const userId = req.user.userId;
    
    const recordData = {
      userId,
      gameMode,
      duration,
      score,
      aiScore,
      lives,
      won,
      playedAt: new Date().toISOString()
    };
    
    const recordId = await storageManager.saveGameRecord(recordData);
    
    if (recordId) {
      // 更新用户游戏统计
      await updateUserGameStats(userId, score, won);
      
      res.json({
        message: '游戏记录保存成功',
        recordId
      });
    } else {
      res.status(500).json({ error: '保存游戏记录失败' });
    }
  } catch (error) {
    console.error('保存游戏记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取游戏记录
router.get('/records', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    
    const records = await storageManager.getGameRecords(userId, limit);
    
    res.json({
      records,
      total: records.length
    });
  } catch (error) {
    console.error('获取游戏记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取排行榜
router.get('/leaderboard', async (req, res) => {
  try {
    const mode = req.query.mode || 'all';
    const limit = parseInt(req.query.limit) || 100;
    
    const leaderboard = await storageManager.getLeaderboard(mode, limit);
    
    res.json({
      leaderboard,
      mode,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新用户游戏统计
async function updateUserGameStats(userId, score, won) {
  try {
    const user = await storageManager.getUser(userId);
    if (!user) return;
    
    user.gameStats.totalGames += 1;
    user.gameStats.totalScore += score;
    
    if (score > user.gameStats.highScore) {
      user.gameStats.highScore = score;
    }
    
    if (won) {
      user.gameStats.wins += 1;
    } else {
      user.gameStats.losses += 1;
    }
    
    await storageManager.saveUser(user);
  } catch (error) {
    console.error('更新用户统计错误:', error);
  }
}

module.exports = router;
```

## 🔧 工具和中间件

### 1. 日志系统

#### 日志配置
```javascript
// utils/logger.js
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'snake-game-backend' },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 综合日志
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 2. 错误处理

#### 错误处理中间件
```javascript
// middleware/error.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('服务器错误:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
  
  // 生产环境返回通用错误信息
  res.status(500).json({
    error: '服务器内部错误'
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: '请求的资源不存在'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
```

## 📊 性能优化

### 1. 缓存策略

#### 内存缓存
```javascript
// 缓存配置
const cacheConfig = {
  maxSize: 1000,           // 最大缓存条目数
  ttl: 300000,            // 缓存生存时间 (5分钟)
  checkPeriod: 60000      // 清理检查周期 (1分钟)
};

// 缓存实现
class MemoryCache {
  constructor(config) {
    this.cache = new Map();
    this.timers = new Map();
    this.config = config;
    
    // 定期清理过期缓存
    setInterval(() => {
      this.cleanup();
    }, this.config.checkPeriod);
  }
  
  set(key, value, ttl = this.config.ttl) {
    // 清除现有定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // 设置缓存
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // 设置过期定时器
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
    
    // 检查缓存大小
    if (this.cache.size > this.config.maxSize) {
      this.evictOldest();
    }
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    return item.value;
  }
  
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.config.ttl) {
        this.delete(key);
      }
    }
  }
  
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
}
```

### 2. 连接池管理

#### WebSocket连接池
```javascript
// websocket/connectionPool.js
class ConnectionPool {
  constructor() {
    this.connections = new Map();
    this.rooms = new Map();
    this.maxConnections = 1000;
    this.connectionTimeout = 60000; // 1分钟
  }
  
  addConnection(socket) {
    if (this.connections.size >= this.maxConnections) {
      socket.disconnect(true);
      return false;
    }
    
    this.connections.set(socket.id, {
      socket,
      userId: socket.userId,
      username: socket.username,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });
    
    return true;
  }
  
  removeConnection(socketId) {
    const connection = this.connections.get(socketId);
    if (connection) {
      // 从所有房间中移除
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.has(socketId)) {
          room.delete(socketId);
          if (room.size === 0) {
            this.rooms.delete(roomId);
          }
        }
      }
      
      this.connections.delete(socketId);
    }
  }
  
  joinRoom(socketId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(socketId);
  }
  
  leaveRoom(socketId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(socketId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }
  
  getRoomMembers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }
  
  updateActivity(socketId) {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }
  
  // 清理不活跃连接
  cleanupInactiveConnections() {
    const now = Date.now();
    for (const [socketId, connection] of this.connections.entries()) {
      if (now - connection.lastActivity > this.connectionTimeout) {
        connection.socket.disconnect(true);
        this.removeConnection(socketId);
      }
    }
  }
}
```

## 🔒 安全措施

### 1. 输入验证

#### 数据验证器
```javascript
// utils/validator.js
const validator = {
  // 用户名验证
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: '用户名不能为空' };
    }
    
    if (username.length < 3 || username.length > 20) {
      return { valid: false, error: '用户名长度必须在3-20个字符之间' };
    }
    
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return { valid: false, error: '用户名只能包含字母、数字、下划线和中文' };
    }
    
    return { valid: true };
  },
  
  // 邮箱验证
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: '邮箱不能为空' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: '邮箱格式不正确' };
    }
    
    return { valid: true };
  },
  
  // 密码验证
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: '密码不能为空' };
    }
    
    if (password.length < 6) {
      return { valid: false, error: '密码长度至少6位' };
    }
    
    if (password.length > 128) {
      return { valid: false, error: '密码长度不能超过128位' };
    }
    
    return { valid: true };
  },
  
  // 游戏数据验证
  validateGameData(gameData) {
    const { score, aiScore, lives, duration } = gameData;
    
    if (typeof score !== 'number' || score < 0) {
      return { valid: false, error: '分数必须是非负数' };
    }
    
    if (typeof aiScore !== 'number' || aiScore < 0) {
      return { valid: false, error: 'AI分数必须是非负数' };
    }
    
    if (typeof lives !== 'number' || lives < 0 || lives > 3) {
      return { valid: false, error: '生命值必须在0-3之间' };
    }
    
    if (typeof duration !== 'number' || duration < 0) {
      return { valid: false, error: '游戏时长必须是非负数' };
    }
    
    return { valid: true };
  }
};

module.exports = validator;
```

### 2. 速率限制

#### 请求限制中间件
```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// 登录限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    error: '登录尝试次数过多，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 注册限制
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 最多3次注册
  message: {
    error: '注册次数过多，请1小时后再试'
  }
});

// API限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter
};
```

## 📈 监控和诊断

### 1. 健康检查

#### 系统监控
```javascript
// utils/monitor.js
const os = require('os');
const fs = require('fs').promises;

class SystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }
  
  getSystemInfo() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid
    };
  }
  
  getDiskUsage() {
    return new Promise(async (resolve) => {
      try {
        const stats = await fs.stat('.');
        resolve({
          available: true,
          path: process.cwd()
        });
      } catch (error) {
        resolve({
          available: false,
          error: error.message
        });
      }
    });
  }
  
  incrementRequestCount() {
    this.requestCount++;
  }
  
  incrementErrorCount() {
    this.errorCount++;
  }
  
  getStats() {
    return {
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0
    };
  }
}

module.exports = new SystemMonitor();
```

### 2. 性能指标

#### 性能监控
```javascript
// middleware/performance.js
const monitor = require('../utils/monitor');

const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // 监控请求计数
  monitor.incrementRequestCount();
  
  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // 记录慢请求
    if (duration > 1000) {
      console.warn(`慢请求: ${req.method} ${req.url} - ${duration}ms`);
    }
    
    // 记录错误
    if (res.statusCode >= 400) {
      monitor.incrementErrorCount();
    }
  });
  
  next();
};

module.exports = performanceMiddleware;
```

## 🚀 部署和运维

### 1. 环境配置

#### 配置管理
```javascript
// config/environment.js
const config = {
  development: {
    port: 3000,
    host: 'localhost',
    corsOrigin: 'http://localhost:3000',
    logLevel: 'debug',
    jwtSecret: 'dev-secret-key',
    jwtExpiresIn: '24h'
  },
  
  production: {
    port: process.env.PORT || 80,
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    logLevel: process.env.LOG_LEVEL || 'info',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

const environment = process.env.NODE_ENV || 'development';
module.exports = config[environment];
```

### 2. 进程管理

#### PM2配置
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'snake-game',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80
    },
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

---

**注意**: 本文档会随着系统更新持续维护，请定期查看最新版本。
