'use strict';

const jwt = require('jsonwebtoken');
const FileStorageManager = require('../storage/FileStorageManager');

const JWT_SECRET = process.env.JWT_SECRET || 'snake-game-super-secret-key-2024';

/**
 * JWT认证中间件
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 验证会话是否有效
    const storageManager = new FileStorageManager();
    const session = await storageManager.getSession(decoded.sessionId);
    
    if (!session || new Date(session.expires) < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session expired'
      });
    }

    // 获取用户信息
    const user = await storageManager.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.session = session;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * 可选的认证中间件（不强制要求登录）
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const storageManager = new FileStorageManager();
      const session = await storageManager.getSession(decoded.sessionId);
      
      if (session && new Date(session.expires) > new Date()) {
        const user = await storageManager.getUser(decoded.userId);
        if (user) {
          req.user = user;
          req.session = session;
        }
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续处理请求
    next();
  }
};

/**
 * 从请求中提取token
 */
function extractToken(req) {
  // 从Authorization header提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从cookie提取
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // 从query参数提取
  if (req.query && req.query.token) {
    return req.query.token;
  }
  
  return null;
}

/**
 * 生成JWT token
 */
function generateToken(userId, sessionId) {
  return jwt.sign(
    { 
      userId, 
      sessionId,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * 验证token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  verifyToken
};
