'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const FileStorageManager = require('../storage/FileStorageManager');
const { generateToken } = require('../middleware/auth');

const router = express.Router();
const storageManager = new FileStorageManager();

// 验证模式
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

/**
 * 用户注册
 */
router.post('/register', async (req, res) => {
  try {
    // 验证输入
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { username, email, password } = value;

    // 检查用户名是否已存在
    const existingUser = await storageManager.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username already exists'
      });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const user = await storageManager.saveUser({
      username,
      email,
      passwordHash,
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      createdAt: new Date().toISOString()
    });

    // 创建会话
    const sessionId = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时
    await storageManager.saveSession(sessionId, {
      userId: user.id,
      username: user.username,
      expires: expires.toISOString()
    });

    // 生成token
    const token = generateToken(user.id, sessionId);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        highScore: user.highScore,
        gamesPlayed: user.gamesPlayed,
        totalScore: user.totalScore
      },
      token,
      expires: expires.toISOString()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

/**
 * 用户登录
 */
router.post('/login', async (req, res) => {
  try {
    // 验证输入
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const { username, password } = value;

    // 查找用户
    const user = await storageManager.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      });
    }

    // 创建会话
    const sessionId = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时
    await storageManager.saveSession(sessionId, {
      userId: user.id,
      username: user.username,
      expires: expires.toISOString()
    });

    // 更新最后登录时间
    await storageManager.updateUser(user.id, {
      lastLogin: new Date().toISOString()
    });

    // 生成token
    const token = generateToken(user.id, sessionId);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        highScore: user.highScore,
        gamesPlayed: user.gamesPlayed,
        totalScore: user.totalScore
      },
      token,
      expires: expires.toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

/**
 * 用户登出
 */
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const { verifyToken } = require('../middleware/auth');
      const decoded = verifyToken(token);
      
      // 删除会话
      await storageManager.deleteSession(decoded.sessionId);
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
});

/**
 * 验证token
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    // 验证会话
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

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        highScore: user.highScore,
        gamesPlayed: user.gamesPlayed,
        totalScore: user.totalScore
      }
    });

  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
});

/**
 * 刷新token
 */
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    // 验证会话
    const session = await storageManager.getSession(decoded.sessionId);
    if (!session || new Date(session.expires) < new Date()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session expired'
      });
    }

    // 生成新token
    const newToken = generateToken(decoded.userId, decoded.sessionId);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      expires: session.expires
    });

  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
});

module.exports = router;
