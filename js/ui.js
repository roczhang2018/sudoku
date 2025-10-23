'use strict';

import { GAME_STATES, DIRECTIONS, DIFFICULTY_CONFIG } from './config.js';

// UI管理器类
export class UIManager {
  constructor() {
    this.elements = this.initializeElements();
  }

  // 初始化DOM元素
  initializeElements() {
    return {
      startBtn: document.getElementById('start'),
      pauseBtn: document.getElementById('pause'),
      restartBtn: document.getElementById('restart'),
      difficultySelect: document.getElementById('difficulty'),
      speedSlider: document.getElementById('speedSlider'),
      speedValue: document.getElementById('speedValue'),
      currentScoreEl: document.getElementById('currentScore'),
      aiScoreEl: document.getElementById('aiScore'),
      highScoreEl: document.getElementById('highScore'),
      livesEl: document.getElementById('lives'),
      statusEl: document.getElementById('status'),
      musicToggle: document.getElementById('musicToggle'),
      soundToggle: document.getElementById('soundToggle'),
      infiniteToggle: document.getElementById('infiniteToggle')
    };
  }

  // 更新按钮状态
  updateButtonStates(gameState) {
    const { startBtn, pauseBtn, restartBtn } = this.elements;
    
    switch (gameState) {
      case GAME_STATES.NOT_STARTED:
        startBtn.textContent = '开始游戏';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;
      case GAME_STATES.PLAYING:
        startBtn.textContent = '游戏中';
        startBtn.disabled = true;
        pauseBtn.textContent = '暂停';
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
        break;
      case GAME_STATES.PAUSED:
        startBtn.textContent = '继续';
        startBtn.disabled = false;
        pauseBtn.textContent = '已暂停';
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;
      case GAME_STATES.GAME_OVER:
        startBtn.textContent = '重新开始';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = false;
        break;
    }
  }

  // 更新分数显示
  updateScore(score, aiScore, highScore, lives) {
    this.elements.currentScoreEl.textContent = score;
    this.elements.aiScoreEl.textContent = aiScore;
    this.elements.highScoreEl.textContent = highScore;
    this.elements.livesEl.textContent = lives;
  }

  // 更新状态文本
  updateStatusText(gameState, infiniteMode, lives, score, aiScore, foodCount) {
    const modeText = infiniteMode ? '边界可循环穿越！' : '经典模式，撞墙会死亡！';
    
    switch (gameState) {
      case GAME_STATES.NOT_STARTED:
        this.elements.statusEl.textContent = `欢迎来到贪吃蛇对战！音乐已开始播放，按开始游戏开始，使用方向键控制。与AI蛇比赛！棋盘上有3-5个食物，全部吃完后重新分配！${modeText}`;
        break;
      case GAME_STATES.PLAYING:
        this.elements.statusEl.textContent = `游戏进行中，使用方向键控制，空格键暂停。与AI蛇比赛！当前有${foodCount}个食物！${modeText}`;
        break;
      case GAME_STATES.PAUSED:
        if (lives < 3) {
          this.elements.statusEl.textContent = `失去一条生命！剩余生命：${lives}，点击继续重新开始。与AI蛇比赛！${modeText}`;
        } else {
          this.elements.statusEl.textContent = `游戏已暂停，点击继续或按空格键继续。与AI蛇比赛！${modeText}`;
        }
        break;
      case GAME_STATES.GAME_OVER:
        const winner = score > aiScore ? '玩家获胜！' : score < aiScore ? 'AI获胜！' : '平局！';
        this.elements.statusEl.textContent = `游戏结束！${winner} 玩家：${score}，AI：${aiScore}，最高分：${highScore}。${modeText}`;
        break;
    }
  }

  // 更新速度显示
  updateSpeedDisplay(speed) {
    this.elements.speedValue.textContent = speed + 'ms';
  }

  // 更新音乐按钮
  updateMusicButton(enabled) {
    this.elements.musicToggle.textContent = enabled ? '🎵 Family Song: 开' : '🎵 Family Song: 关';
    this.elements.musicToggle.classList.toggle('active', enabled);
  }

  // 更新音效按钮
  updateSoundButton(enabled) {
    this.elements.soundToggle.textContent = enabled ? '🔊 音效: 开' : '🔊 音效: 关';
    this.elements.soundToggle.classList.toggle('active', enabled);
  }

  // 更新无限循环按钮
  updateInfiniteButton(enabled) {
    this.elements.infiniteToggle.textContent = enabled ? '🔄 无限循环: 开' : '🔄 无限循环: 关';
    this.elements.infiniteToggle.classList.toggle('active', enabled);
  }

  // 设置难度
  setDifficulty(difficulty) {
    this.elements.difficultySelect.value = difficulty;
    const config = DIFFICULTY_CONFIG[difficulty];
    this.elements.speedSlider.value = config.baseSpeed;
    this.updateSpeedDisplay(config.baseSpeed);
  }

  // 获取当前难度
  getDifficulty() {
    return this.elements.difficultySelect.value;
  }

  // 获取当前速度
  getSpeed() {
    return parseInt(this.elements.speedSlider.value, 10);
  }

  // 绑定事件
  bindEvents(game) {
    const { startBtn, pauseBtn, restartBtn, difficultySelect, speedSlider, musicToggle, soundToggle, infiniteToggle } = this.elements;
    
    // 按钮事件
    startBtn.addEventListener('click', () => game.startGame());
    pauseBtn.addEventListener('click', () => game.togglePause());
    restartBtn.addEventListener('click', () => game.restartGame());
    difficultySelect.addEventListener('change', () => game.changeDifficulty());
    speedSlider.addEventListener('input', () => game.changeSpeed());
    musicToggle.addEventListener('click', () => game.toggleMusic());
    soundToggle.addEventListener('click', () => game.toggleSound());
    infiniteToggle.addEventListener('click', () => game.toggleInfiniteMode());
    
    // 键盘事件
    document.addEventListener('keydown', (e) => this.handleKeyPress(e, game));
    
    // 防止方向键滚动页面
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  // 处理键盘输入
  handleKeyPress(e, game) {
    if (game.gameState.getState() !== GAME_STATES.PLAYING && game.gameState.getState() !== GAME_STATES.PAUSED) return;
    
    switch (e.code) {
      case 'ArrowUp':
        game.playerSnake.setDirection(DIRECTIONS.UP);
        break;
      case 'ArrowDown':
        game.playerSnake.setDirection(DIRECTIONS.DOWN);
        break;
      case 'ArrowLeft':
        game.playerSnake.setDirection(DIRECTIONS.LEFT);
        break;
      case 'ArrowRight':
        game.playerSnake.setDirection(DIRECTIONS.RIGHT);
        break;
      case 'Space':
        e.preventDefault();
        if (game.gameState.getState() === GAME_STATES.PLAYING) {
          game.togglePause();
        } else if (game.gameState.getState() === GAME_STATES.PAUSED) {
          game.startGame();
        }
        break;
    }
  }
}
