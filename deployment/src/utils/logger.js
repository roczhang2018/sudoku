'use strict';

const winston = require('winston');
const path = require('path');

// 确保日志目录存在
const logDir = 'logs';
require('fs').mkdirSync(logDir, { recursive: true });

/**
 * 创建日志记录器
 */
function createLogger(service = 'snake-game-backend') {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service },
    transports: [
      // 错误日志文件
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }),
      // 综合日志文件
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }),
      // 控制台输出
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
}

/**
 * 创建请求日志中间件
 */
function createRequestLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      };
      
      if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
    });
    
    next();
  };
}

/**
 * 创建WebSocket日志中间件
 */
function createWebSocketLogger(logger) {
  return (socket, next) => {
    const originalEmit = socket.emit;
    
    socket.emit = function(event, ...args) {
      logger.debug(`WebSocket emit: ${event}`, {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username
      });
      return originalEmit.apply(this, [event, ...args]);
    };
    
    next();
  };
}

module.exports = {
  createLogger,
  createRequestLogger,
  createWebSocketLogger
};
