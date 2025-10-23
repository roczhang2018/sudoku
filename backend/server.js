'use strict';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const winston = require('winston');

// 导入自定义模块
const FileStorageManager = require('./src/storage/FileStorageManager');
const authRoutes = require('./src/routes/auth');
const gameRoutes = require('./src/routes/game');
const userRoutes = require('./src/routes/user');
const WebSocketManager = require('./src/websocket/WebSocketManager');
const { authMiddleware } = require('./src/middleware/auth');

// 配置日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'snake-game-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 创建应用
const app = express();
const server = http.createServer(app);

// 初始化存储管理器
const storageManager = new FileStorageManager('./data');

// 配置Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8000", "http://127.0.0.1:8000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: false, // 禁用CSP以支持Socket.IO
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: ["http://localhost:8000", "http://127.0.0.1:8000"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: storageManager.getCacheStats()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/game', authMiddleware, gameRoutes);
app.use('/api/user', authMiddleware, userRoutes);

// 静态文件服务（可选）
app.use('/static', express.static(path.join(__dirname, 'public')));

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// 初始化WebSocket管理器
const wsManager = new WebSocketManager(io, storageManager, logger);

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Data directory: ${storageManager.dataDir}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// 未捕获的异常处理
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io, storageManager, wsManager };
