'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const FileStorageManager = require('../storage/FileStorageManager');

const router = express.Router();
const storageManager = new FileStorageManager();

// 验证模式
const gameStateSchema = Joi.object({
  gameState: Joi.string().valid('not_started', 'playing', 'paused', 'game_over').required(),
  playerSnake: Joi.array().items(
    Joi.object({
      x: Joi.number().integer().min(0).required(),
      y: Joi.number().integer().min(0).required()
    })
  ).required(),
  aiSnake: Joi.array().items(
    Joi.object({
      x: Joi.number().integer().min(0).required(),
      y: Joi.number().integer().min(0).required()
    })
  ).required(),
  foods: Joi.array().items(
    Joi.object({
      x: Joi.number().integer().min(0).required(),
      y: Joi.number().integer().min(0).required(),
      color: Joi.string().required()
    })
  ).required(),
  score: Joi.number().integer().min(0).required(),
  aiScore: Joi.number().integer().min(0).required(),
  lives: Joi.number().integer().min(0).max(3).required(),
  infiniteMode: Joi.boolean().required(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
  speed: Joi.number().integer().min(50).max(500).required(),
  currentDirection: Joi.object({
    x: Joi.number().integer().valid(-1, 0, 1).required(),
    y: Joi.number().integer().valid(-1, 0, 1).required()
  }).required(),
  aiDirection: Joi.object({
    x: Joi.number().integer().valid(-1, 0, 1).required(),
    y: Joi.number().integer().valid(-1, 0, 1).required()
  }).required()
});

/**
 * 创建新游戏
 */
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = uuidv4();

    // 创建初始游戏状态
    const initialGameState = {
      userId,
      gameState: 'not_started',
      playerSnake: [{ x: 10, y: 10 }],
      aiSnake: [{ x: 30, y: 10 }],
      foods: [],
      score: 0,
      aiScore: 0,
      lives: 3,
      infiniteMode: true,
      difficulty: 'medium',
      speed: 120,
      currentDirection: { x: 1, y: 0 },
      aiDirection: { x: -1, y: 0 },
      gameStartTime: null,
      gameEndTime: null
    };

    await storageManager.saveGameState(gameId, initialGameState);

    res.status(201).json({
      message: 'Game created successfully',
      gameId,
      gameState: initialGameState
    });

  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create game'
    });
  }
});

/**
 * 获取游戏状态
 */
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    const gameState = await storageManager.getGameState(gameId);
    
    if (!gameState) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }

    // 验证游戏所有权
    if (gameState.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    res.json({
      gameId,
      gameState
    });

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get game'
    });
  }
});

/**
 * 更新游戏状态
 */
router.put('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // 验证输入
    const { error, value } = gameStateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // 检查游戏是否存在
    const existingGame = await storageManager.getGameState(gameId);
    if (!existingGame) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }

    // 验证游戏所有权
    if (existingGame.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    // 更新游戏状态
    const updatedGameState = {
      ...existingGame,
      ...value,
      userId, // 确保userId不被覆盖
      lastUpdated: new Date().toISOString()
    };

    await storageManager.updateGameState(gameId, updatedGameState);

    res.json({
      message: 'Game state updated successfully',
      gameId,
      gameState: updatedGameState
    });

  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update game'
    });
  }
});

/**
 * 删除游戏
 */
router.delete('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // 检查游戏是否存在
    const gameState = await storageManager.getGameState(gameId);
    if (!gameState) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }

    // 验证游戏所有权
    if (gameState.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied'
      });
    }

    await storageManager.deleteGameState(gameId);

    res.json({
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete game'
    });
  }
});

/**
 * 获取用户的所有游戏
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const games = await storageManager.getUserGames(userId);
    
    // 分页
    const paginatedGames = games.slice(offset, offset + parseInt(limit));

    res.json({
      games: paginatedGames,
      total: games.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user games'
    });
  }
});

/**
 * 保存游戏记录
 */
router.post('/:gameId/record', async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    const recordSchema = Joi.object({
      startTime: Joi.string().isoDate().required(),
      endTime: Joi.string().isoDate().required(),
      duration: Joi.object({
        total: Joi.number().integer().min(0).required(),
        seconds: Joi.number().integer().min(0).required(),
        formatted: Joi.string().required()
      }).required(),
      mode: Joi.string().required(),
      difficulty: Joi.string().required(),
      playerScore: Joi.number().integer().min(0).required(),
      aiScore: Joi.number().integer().min(0).required(),
      winner: Joi.string().required(),
      livesUsed: Joi.number().integer().min(0).max(3).required(),
      isWin: Joi.boolean().required()
    });

    const { error, value } = recordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // 检查游戏是否存在
    const gameState = await storageManager.getGameState(gameId);
    if (!gameState || gameState.userId !== userId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }

    // 保存游戏记录
    const record = await storageManager.saveGameRecord(userId, {
      ...value,
      gameId
    });

    // 更新用户统计
    const user = await storageManager.getUser(userId);
    if (user) {
      const updates = {
        gamesPlayed: (user.gamesPlayed || 0) + 1,
        totalScore: (user.totalScore || 0) + value.playerScore
      };

      if (value.playerScore > (user.highScore || 0)) {
        updates.highScore = value.playerScore;
      }

      await storageManager.updateUser(userId, updates);
    }

    res.status(201).json({
      message: 'Game record saved successfully',
      record
    });

  } catch (error) {
    console.error('Save game record error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to save game record'
    });
  }
});

/**
 * 获取游戏记录
 */
router.get('/:gameId/records', async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    // 检查游戏是否存在
    const gameState = await storageManager.getGameState(gameId);
    if (!gameState || gameState.userId !== userId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Game not found'
      });
    }

    const records = await storageManager.getGameRecords(userId);
    const gameRecords = records.filter(record => record.gameId === gameId);

    res.json({
      records: gameRecords
    });

  } catch (error) {
    console.error('Get game records error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get game records'
    });
  }
});

module.exports = router;
