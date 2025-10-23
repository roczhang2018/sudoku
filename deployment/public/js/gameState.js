'use strict';

import { DIRECTIONS, SNAKE_COLORS } from './config.js';

// 游戏状态管理类
export class GameState {
  constructor() {
    this.gameState = 'not_started';
    this.gameLoop = null;
    this.currentDirection = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
    this.snake = [{ x: 10, y: 10 }]; // 玩家蛇
    this.aiSnake = [{ x: 30, y: 10 }]; // AI蛇
    this.aiDirection = DIRECTIONS.LEFT;
    this.aiNextDirection = DIRECTIONS.LEFT;
    this.score = 0;
    this.aiScore = 0;
    this.highScore = 0;
    this.currentSpeed = 120;
    this.difficulty = 'medium';
    this.snakeColor = '#4CAF50'; // 玩家蛇身颜色
    this.aiSnakeColor = '#FF5722'; // AI蛇身颜色
    this.colorIndex = 0; // 颜色索引
    this.lives = 3; // 生命数
    this.infiniteMode = true; // 无限循环模式
    
    // 游戏记录相关
    this.gameStartTime = null; // 游戏开始时间
    this.gameEndTime = null; // 游戏结束时间
    this.gameRecords = []; // 游戏记录数组
  }

  // 重置游戏状态
  reset() {
    this.snake = [{ x: 10, y: 10 }]; // 玩家蛇在左侧
    this.aiSnake = [{ x: 30, y: 10 }]; // AI蛇在右侧
    this.currentDirection = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
    this.aiDirection = DIRECTIONS.LEFT;
    this.aiNextDirection = DIRECTIONS.LEFT;
    this.score = 0;
    this.aiScore = 0;
    this.lives = 3; // 重置生命数
    this.colorIndex = 0;
    this.snakeColor = SNAKE_COLORS[0]; // 重置为第一个颜色
  }

  // 改变蛇身颜色
  changeSnakeColor() {
    this.colorIndex = (this.colorIndex + 1) % SNAKE_COLORS.length;
    this.snakeColor = SNAKE_COLORS[this.colorIndex];
  }

  // 设置游戏状态
  setState(newState) {
    this.gameState = newState;
  }

  // 获取游戏状态
  getState() {
    return this.gameState;
  }

  // 减少生命
  loseLife() {
    this.lives--;
  }

  // 检查是否还有生命
  hasLives() {
    return this.lives > 0;
  }

  // 增加玩家分数
  addScore(points = 10) {
    this.score += points;
  }

  // 增加AI分数
  addAiScore(points = 10) {
    this.aiScore += points;
  }

  // 更新最高分
  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  // 保存最高分到本地存储
  saveHighScore() {
    localStorage.setItem('snakeHighScore', this.highScore.toString());
  }

  // 从本地存储加载最高分
  loadHighScore() {
    const saved = localStorage.getItem('snakeHighScore');
    this.highScore = saved ? parseInt(saved, 10) : 0;
  }

  // 设置游戏循环
  setGameLoop(loop) {
    this.gameLoop = loop;
  }

  // 清除游戏循环
  clearGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  // 设置速度
  setSpeed(speed) {
    this.currentSpeed = speed;
  }

  // 获取速度
  getSpeed() {
    return this.currentSpeed;
  }

  // 设置难度
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  // 获取难度
  getDifficulty() {
    return this.difficulty;
  }

  // 切换无限循环模式
  toggleInfiniteMode() {
    this.infiniteMode = !this.infiniteMode;
  }

  // 获取无限循环模式状态
  getInfiniteMode() {
    return this.infiniteMode;
  }

  // 开始游戏记录
  startGameRecord() {
    this.gameStartTime = Date.now();
  }

  // 结束游戏记录
  endGameRecord() {
    this.gameEndTime = Date.now();
  }

  // 创建游戏记录
  createGameRecord() {
    if (!this.gameStartTime || !this.gameEndTime) {
      return null;
    }

    const duration = this.gameEndTime - this.gameStartTime;
    const durationSeconds = Math.floor(duration / 1000);
    const durationMinutes = Math.floor(durationSeconds / 60);
    const remainingSeconds = durationSeconds % 60;

    const record = {
      id: Date.now().toString(),
      startTime: new Date(this.gameStartTime).toLocaleString('zh-CN'),
      endTime: new Date(this.gameEndTime).toLocaleString('zh-CN'),
      duration: {
        total: duration,
        seconds: durationSeconds,
        formatted: `${durationMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
      },
      mode: this.infiniteMode ? '无限循环' : '经典模式',
      difficulty: this.difficulty,
      playerScore: this.score,
      aiScore: this.aiScore,
      winner: this.score > this.aiScore ? '玩家' : this.score < this.aiScore ? 'AI' : '平局',
      livesUsed: 3 - this.lives,
      isWin: this.score > this.aiScore
    };

    this.gameRecords.unshift(record); // 添加到开头，最新的在前面
    
    // 只保留最近50条记录
    if (this.gameRecords.length > 50) {
      this.gameRecords = this.gameRecords.slice(0, 50);
    }

    return record;
  }

  // 获取游戏记录
  getGameRecords() {
    return this.gameRecords;
  }

  // 清空游戏记录
  clearGameRecords() {
    this.gameRecords = [];
  }

  // 保存游戏记录到本地存储
  saveGameRecords() {
    localStorage.setItem('snakeGameRecords', JSON.stringify(this.gameRecords));
  }

  // 从本地存储加载游戏记录
  loadGameRecords() {
    try {
      const records = localStorage.getItem('snakeGameRecords');
      this.gameRecords = records ? JSON.parse(records) : [];
    } catch (error) {
      this.gameRecords = [];
    }
  }
}
