'use strict';

const express = require('express');
const Joi = require('joi');
const FileStorageManager = require('../storage/FileStorageManager');

const router = express.Router();
const storageManager = new FileStorageManager();

// 验证模式
const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  highScore: Joi.number().integer().min(0).optional(),
  gamesPlayed: Joi.number().integer().min(0).optional(),
  totalScore: Joi.number().integer().min(0).optional()
});

/**
 * 获取当前用户信息
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await storageManager.getUser(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // 返回用户信息（不包含敏感数据）
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      highScore: user.highScore || 0,
      gamesPlayed: user.gamesPlayed || 0,
      totalScore: user.totalScore || 0,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.json({
      user: userProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
});

/**
 * 更新用户信息
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    // 验证输入
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // 检查用户是否存在
    const existingUser = await storageManager.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // 更新用户信息
    const updatedUser = await storageManager.updateUser(userId, value);

    // 返回更新后的用户信息（不包含敏感数据）
    const userProfile = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      highScore: updatedUser.highScore || 0,
      gamesPlayed: updatedUser.gamesPlayed || 0,
      totalScore: updatedUser.totalScore || 0,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin
    };

    res.json({
      message: 'User profile updated successfully',
      user: userProfile
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user profile'
    });
  }
});

/**
 * 获取用户游戏记录
 */
router.get('/records', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const records = await storageManager.getGameRecords(userId);
    
    // 分页
    const paginatedRecords = records.slice(offset, offset + parseInt(limit));

    res.json({
      records: paginatedRecords,
      total: records.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Get user records error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user records'
    });
  }
});

/**
 * 清空用户游戏记录
 */
router.delete('/records', async (req, res) => {
  try {
    const userId = req.user.id;

    await storageManager.clearGameRecords(userId);

    res.json({
      message: 'Game records cleared successfully'
    });

  } catch (error) {
    console.error('Clear user records error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to clear user records'
    });
  }
});

/**
 * 获取用户统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await storageManager.getUser(userId);
    const records = await storageManager.getGameRecords(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // 计算统计信息
    const totalGames = records.length;
    const wins = records.filter(r => r.isWin).length;
    const losses = records.filter(r => !r.isWin && r.winner === 'AI').length;
    const ties = records.filter(r => r.winner === '平局').length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const avgScore = totalGames > 0 ? Math.round(records.reduce((sum, r) => sum + r.playerScore, 0) / totalGames) : 0;
    const bestScore = Math.max(...records.map(r => r.playerScore), 0);
    const totalTime = records.reduce((sum, r) => sum + r.duration.seconds, 0);
    const avgTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0;

    const stats = {
      totalGames,
      wins,
      losses,
      ties,
      winRate,
      highScore: user.highScore || 0,
      bestScore,
      avgScore,
      totalScore: user.totalScore || 0,
      avgTime,
      totalTime,
      gamesPlayed: user.gamesPlayed || 0
    };

    res.json({
      stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user stats'
    });
  }
});

/**
 * 获取用户活跃游戏
 */
router.get('/active-games', async (req, res) => {
  try {
    const userId = req.user.id;
    const games = await storageManager.getUserGames(userId);
    
    // 过滤出活跃游戏（playing 或 paused 状态）
    const activeGames = games.filter(game => 
      game.gameState === 'playing' || game.gameState === 'paused'
    );

    res.json({
      activeGames: activeGames.slice(0, 5) // 最多返回5个活跃游戏
    });

  } catch (error) {
    console.error('Get active games error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get active games'
    });
  }
});

/**
 * 删除用户账户
 */
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;

    // 删除用户相关的所有数据
    await storageManager.deleteUser(userId);
    
    // 删除用户的游戏状态
    const games = await storageManager.getUserGames(userId);
    for (const game of games) {
      await storageManager.deleteGameState(game.id);
    }
    
    // 删除用户的游戏记录
    await storageManager.clearGameRecords(userId);

    res.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete account'
    });
  }
});

module.exports = router;
