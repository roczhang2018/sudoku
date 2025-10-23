'use strict';

import { GAME_STATES, DIRECTIONS, DIFFICULTY_CONFIG } from './config.js';
import { GameState } from './gameState.js';
import { AudioManager } from './audio.js';
import { Snake, AISnake } from './snake.js';
import { FoodManager } from './food.js';
import { Renderer } from './renderer.js';
import { UIManager } from './ui.js';

// 主游戏类
export class SnakeGame {
  constructor(authManager, currentUser = null) {
    this.authManager = authManager;
    this.currentUser = currentUser;
    this.isGuest = !currentUser; // 是否为游客模式
    this.gameState = new GameState();
    this.audioManager = new AudioManager();
    this.playerSnake = new Snake(10, 10, '#4CAF50');
    this.aiSnake = new AISnake(30, 10, '#FF5722');
    this.foodManager = new FoodManager();
    this.renderer = new Renderer(document.getElementById('gameCanvas'));
    this.uiManager = new UIManager();
  }

  // 初始化游戏
  init() {
    // 显示用户信息
    this.updateUserInfo();
    
    // 加载用户最高分（仅登录用户）
    if (!this.isGuest && this.currentUser) {
      this.gameState.highScore = this.currentUser.highScore || 0;
    } else {
      // 游客模式，从本地存储加载临时最高分
      this.gameState.highScore = parseInt(localStorage.getItem('guestHighScore') || '0', 10);
    }
    
    // 加载游戏记录
    this.gameState.loadGameRecords();
    
    this.audioManager.init();
    this.uiManager.bindEvents(this);
    
    // 初始化速度控制器
    const config = DIFFICULTY_CONFIG[this.gameState.getDifficulty()];
    this.gameState.setSpeed(config.baseSpeed);
    this.uiManager.setDifficulty(this.gameState.getDifficulty());
    
    // 生成初始食物
    this.foodManager.generateFood(this.playerSnake, this.gameState.getInfiniteMode() ? this.aiSnake : null);
    
    // 初始化UI状态
    this.uiManager.updateMusicButton(this.audioManager.isMusicEnabled());
    this.uiManager.updateSoundButton(this.audioManager.isSoundEnabled());
    this.uiManager.updateInfiniteButton(this.gameState.getInfiniteMode());
    
    this.updateUI();
    this.renderer.render(this.playerSnake, this.aiSnake, this.foodManager.getFoods(), this.gameState.getInfiniteMode());
    
    // 页面加载完成后自动开始播放音乐
    setTimeout(() => {
      if (this.audioManager.isMusicEnabled()) {
        this.audioManager.startBackgroundMusic();
      }
    }, 1000); // 延迟1秒开始播放，确保音频系统完全初始化
  }

  // 开始游戏
  startGame() {
    const currentState = this.gameState.getState();
    
    if (currentState === GAME_STATES.NOT_STARTED || currentState === GAME_STATES.GAME_OVER) {
      this.resetGame();
      this.gameState.setState(GAME_STATES.PLAYING);
      this.gameState.startGameRecord(); // 开始游戏记录
      this.startGameLoop();
      this.audioManager.playSound(440, 0.3, 'sine'); // 游戏开始音效
      if (this.audioManager.isMusicEnabled()) this.audioManager.startBackgroundMusic();
      this.updateUI();
    } else if (currentState === GAME_STATES.PAUSED) {
      this.gameState.setState(GAME_STATES.PLAYING);
      this.startGameLoop();
      if (this.audioManager.isMusicEnabled()) this.audioManager.startBackgroundMusic();
      this.updateUI();
    }
  }

  // 暂停/继续
  togglePause() {
    if (this.gameState.getState() === GAME_STATES.PLAYING) {
      this.gameState.setState(GAME_STATES.PAUSED);
      this.gameState.clearGameLoop();
      this.audioManager.stopBackgroundMusic();
      this.updateUI();
    } else if (this.gameState.getState() === GAME_STATES.PAUSED) {
      this.startGame();
    }
  }

  // 重新开始
  restartGame() {
    this.gameState.clearGameLoop();
    this.resetGame();
    this.gameState.setState(GAME_STATES.NOT_STARTED);
    this.updateUI();
  }

  // 改变难度
  changeDifficulty() {
    const difficulty = this.uiManager.getDifficulty();
    this.gameState.setDifficulty(difficulty);
    const config = DIFFICULTY_CONFIG[difficulty];
    this.gameState.setSpeed(config.baseSpeed);
    this.uiManager.setDifficulty(difficulty);
    
    if (this.gameState.getState() === GAME_STATES.PLAYING) {
      this.gameState.clearGameLoop();
      this.startGameLoop();
    }
  }

  // 改变速度
  changeSpeed() {
    const speed = this.uiManager.getSpeed();
    this.gameState.setSpeed(speed);
    this.uiManager.updateSpeedDisplay(speed);
    
    if (this.gameState.getState() === GAME_STATES.PLAYING) {
      this.gameState.clearGameLoop();
      this.startGameLoop();
    }
  }

  // 切换音乐
  toggleMusic() {
    const enabled = this.audioManager.toggleMusic();
    this.uiManager.updateMusicButton(enabled);
    
    if (enabled && this.gameState.getState() === GAME_STATES.PLAYING) {
      this.audioManager.startBackgroundMusic();
    } else {
      this.audioManager.stopBackgroundMusic();
    }
  }

  // 切换音效
  toggleSound() {
    const enabled = this.audioManager.toggleSound();
    this.uiManager.updateSoundButton(enabled);
  }

  // 切换无限循环模式
  toggleInfiniteMode() {
    this.gameState.toggleInfiniteMode();
    this.uiManager.updateInfiniteButton(this.gameState.getInfiniteMode());
    
    // 清理棋盘并重新生成食物
    this.clearBoard();
    
    this.updateUI();
  }

  // 开始游戏循环
  startGameLoop() {
    const loop = setInterval(() => this.gameStep(), this.gameState.getSpeed());
    this.gameState.setGameLoop(loop);
  }

  // 游戏主循环
  gameStep() {
    if (this.gameState.getState() !== GAME_STATES.PLAYING) return;
    
    const infiniteMode = this.gameState.getInfiniteMode();
    
    // 移动玩家蛇
    const newHead = this.playerSnake.move(infiniteMode);
    
    // 检查碰撞
    if (infiniteMode) {
      // 无限循环模式 - 只检查自身碰撞
      if (this.playerSnake.checkSelfCollision(newHead)) {
        this.gameOver();
        return;
      }
    } else {
      // 经典模式 - 检查边界和自身碰撞
      if (this.playerSnake.checkWallCollision(newHead) || this.playerSnake.checkSelfCollision(newHead)) {
        this.gameOver();
        return;
      }
    }
    
    // 检查是否吃到食物
    const eatenFoodIndex = this.playerSnake.checkFoodCollision(this.foodManager.getFoods());
    if (eatenFoodIndex !== -1) {
      this.gameState.addScore(10);
      this.gameState.changeSnakeColor();
      this.audioManager.playSound(800, 0.2, 'square'); // 吃到食物音效
      this.foodManager.removeFood(eatenFoodIndex);
      
      // 如果所有食物都被吃掉，生成新食物
      if (this.foodManager.shouldGenerateNewFood()) {
        this.foodManager.generateFood(this.playerSnake, this.gameState.getInfiniteMode() ? this.aiSnake : null);
      }
      
      // 增加速度（基于当前速度设置）
      const config = DIFFICULTY_CONFIG[this.gameState.getDifficulty()];
      const baseSpeed = this.uiManager.getSpeed();
      const minSpeed = Math.max(baseSpeed * 0.2, 20);
      
      if (this.gameState.getSpeed() > minSpeed) {
        const newSpeed = Math.max(this.gameState.getSpeed() - config.speedIncrease, minSpeed);
        this.gameState.setSpeed(newSpeed);
        this.gameState.clearGameLoop();
        this.startGameLoop();
      }
    } else {
      // 移除尾部
      this.playerSnake.removeTail();
    }
    
    // 只在无限循环模式下移动AI蛇
    if (infiniteMode) {
      const aiResult = this.aiSnake.moveAI(this.foodManager.getFoods(), infiniteMode);
      if (aiResult && aiResult.type === 'eat') {
        this.gameState.addAiScore(10);
        this.foodManager.removeFood(aiResult.foodIndex);
        
        // 如果所有食物都被吃掉，生成新食物
        if (this.foodManager.shouldGenerateNewFood()) {
          this.foodManager.generateFood(this.playerSnake, this.gameState.getInfiniteMode() ? this.aiSnake : null);
        }
      }
    }
    
    this.updateUI();
    this.renderer.render(this.playerSnake, infiniteMode ? this.aiSnake : null, this.foodManager.getFoods(), infiniteMode);
  }

  // 游戏结束
  gameOver() {
    this.gameState.loseLife();
    
    if (this.gameState.hasLives()) {
      // 还有生命，重新开始这一轮
      this.gameState.setState(GAME_STATES.PAUSED);
      this.gameState.clearGameLoop();
      
      // 重置蛇的位置和方向
      this.playerSnake.reset(10, 10);
      this.aiSnake.reset(30, 10);
      this.foodManager.generateFood(this.playerSnake, this.gameState.getInfiniteMode() ? this.aiSnake : null);
      
      // 重置颜色
      this.gameState.colorIndex = 0;
      this.gameState.snakeColor = '#4CAF50';
      this.playerSnake.color = '#4CAF50';
      
      this.updateUI();
      this.renderer.render(this.playerSnake, this.aiSnake, this.foodManager.getFoods(), this.gameState.getInfiniteMode());
    } else {
      // 没有生命了，游戏真正结束
      this.gameState.setState(GAME_STATES.GAME_OVER);
      this.gameState.endGameRecord(); // 结束游戏记录
      this.gameState.clearGameLoop();
      this.audioManager.playSound(200, 0.5, 'sawtooth'); // 游戏结束音效
      this.audioManager.stopBackgroundMusic();
      
      // 创建并保存游戏记录
      const gameRecord = this.gameState.createGameRecord();
      if (gameRecord) {
        this.gameState.saveGameRecords();
        console.log('游戏记录已保存:', gameRecord);
      }
      
      // 更新最高分
      this.gameState.updateHighScore();
      
      // 更新用户数据
      this.updateUserStats();
      
      this.updateUI();
    }
  }

  // 清理棋盘（切换模式时使用）
  clearBoard() {
    // 清理所有食物
    this.foodManager.clearAllFoods();
    // 重新生成食物（根据当前模式）
    this.foodManager.generateFood(this.playerSnake, this.gameState.getInfiniteMode() ? this.aiSnake : null);
  }

  // 重置游戏
  resetGame() {
    this.playerSnake.reset(10, 10);
    this.aiSnake.reset(30, 10);
    this.gameState.reset();
    this.foodManager.generateFood(this.playerSnake, this.gameState.getInfiniteMode() ? this.aiSnake : null);
    
    const config = DIFFICULTY_CONFIG[this.gameState.getDifficulty()];
    this.gameState.setSpeed(config.baseSpeed);
    this.uiManager.setDifficulty(this.gameState.getDifficulty());
  }

  // 更新用户信息显示
  updateUserInfo() {
    const welcomeText = document.getElementById('welcomeText');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (this.isGuest) {
      // 游客模式
      if (welcomeText) {
        welcomeText.textContent = '欢迎，游客';
      }
      if (loginBtn) {
        loginBtn.style.display = 'inline-block';
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
    } else {
      // 登录用户模式
      if (welcomeText) {
        welcomeText.textContent = `欢迎，${this.currentUser.username}`;
      }
      if (loginBtn) {
        loginBtn.style.display = 'none';
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
      }
    }
  }

  // 更新用户统计数据
  updateUserStats() {
    if (this.isGuest) {
      // 游客模式，保存到本地存储
      localStorage.setItem('guestHighScore', this.gameState.highScore.toString());
    } else if (this.currentUser) {
      // 登录用户，更新用户数据
      const userStats = {
        highScore: this.gameState.highScore,
        gamesPlayed: (this.currentUser.gamesPlayed || 0) + 1,
        totalScore: (this.currentUser.totalScore || 0) + this.gameState.score
      };
      
      this.authManager.updateUser(userStats);
      this.currentUser = this.authManager.getCurrentUser();
    }
  }

  // 更新UI
  updateUI() {
    this.uiManager.updateButtonStates(this.gameState.getState());
    this.uiManager.updateScore(
      this.gameState.score,
      this.gameState.aiScore,
      this.gameState.highScore,
      this.gameState.lives,
      this.gameState.getInfiniteMode()
    );
    this.uiManager.updateStatusText(
      this.gameState.getState(),
      this.gameState.getInfiniteMode(),
      this.gameState.lives,
      this.gameState.score,
      this.gameState.aiScore,
      this.foodManager.getFoodCount(),
      this.isGuest
    );
  }
}
