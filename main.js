'use strict';

// 游戏配置
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// 游戏状态
const GAME_STATES = {
  NOT_STARTED: 'not_started',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

// 方向
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

// 难度配置
const DIFFICULTY_CONFIG = {
  easy: { baseSpeed: 200, speedIncrease: 5 },
  medium: { baseSpeed: 150, speedIncrease: 8 },
  hard: { baseSpeed: 120, speedIncrease: 10 }
};

// 游戏变量
let gameState = GAME_STATES.NOT_STARTED;
let gameLoop = null;
let currentDirection = DIRECTIONS.RIGHT;
let nextDirection = DIRECTIONS.RIGHT;
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let score = 0;
let highScore = 0;
let currentSpeed = 120;
let difficulty = 'medium';
let snakeColor = '#4CAF50'; // 当前蛇身颜色
let colorIndex = 0; // 颜色索引
let lives = 3; // 生命数

// 音频系统
let audioContext = null;
let musicEnabled = true;
let soundEnabled = true;
let backgroundMusic = null;
let musicGain = null;
let soundGain = null;

// 蛇身颜色数组
const SNAKE_COLORS = [
  '#4CAF50', // 绿色
  '#2196F3', // 蓝色
  '#FF9800', // 橙色
  '#9C27B0', // 紫色
  '#F44336', // 红色
  '#00BCD4', // 青色
  '#FFEB3B', // 黄色
  '#795548', // 棕色
  '#607D8B', // 蓝灰色
  '#E91E63'  // 粉红色
];

// DOM 元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const restartBtn = document.getElementById('restart');
const difficultySelect = document.getElementById('difficulty');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const currentScoreEl = document.getElementById('currentScore');
const highScoreEl = document.getElementById('highScore');
const livesEl = document.getElementById('lives');
const statusEl = document.getElementById('status');
const musicToggle = document.getElementById('musicToggle');
const soundToggle = document.getElementById('soundToggle');

// 初始化
function init() {
  loadHighScore();
  initAudio();
  bindEvents();
  updateUI();
  render();
  
  // 初始化速度控制器
  const config = DIFFICULTY_CONFIG[difficulty];
  speedSlider.value = config.baseSpeed;
  speedValue.textContent = config.baseSpeed + 'ms';
  
  // 页面加载完成后自动开始播放音乐
  setTimeout(() => {
    if (musicEnabled) {
      startBackgroundMusic();
    }
  }, 1000); // 延迟1秒开始播放，确保音频系统完全初始化
}

// 初始化音频系统
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 创建音频节点
    musicGain = audioContext.createGain();
    soundGain = audioContext.createGain();
    
    musicGain.connect(audioContext.destination);
    soundGain.connect(audioContext.destination);
    
    // 设置音量
    musicGain.gain.value = 0.3; // 背景音乐音量
    soundGain.gain.value = 0.5; // 音效音量
  } catch (e) {
    console.log('音频初始化失败:', e);
  }
}

// 绑定事件
function bindEvents() {
  // 按钮事件
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', restartGame);
  difficultySelect.addEventListener('change', changeDifficulty);
  speedSlider.addEventListener('input', changeSpeed);
  musicToggle.addEventListener('click', toggleMusic);
  soundToggle.addEventListener('click', toggleSound);
  
  // 键盘事件
  document.addEventListener('keydown', handleKeyPress);
  
  // 防止方向键滚动页面
  document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.code)) {
      e.preventDefault();
    }
  });
}

// 开始游戏
function startGame() {
  if (gameState === GAME_STATES.NOT_STARTED || gameState === GAME_STATES.GAME_OVER) {
    resetGame();
    gameState = GAME_STATES.PLAYING;
    gameLoop = setInterval(gameStep, currentSpeed);
    playSound(440, 0.3, 'sine'); // 游戏开始音效
    if (musicEnabled) startBackgroundMusic();
    updateUI();
  } else if (gameState === GAME_STATES.PAUSED) {
    gameState = GAME_STATES.PLAYING;
    gameLoop = setInterval(gameStep, currentSpeed);
    if (musicEnabled) startBackgroundMusic();
    updateUI();
  }
}

// 暂停/继续
function togglePause() {
  if (gameState === GAME_STATES.PLAYING) {
    gameState = GAME_STATES.PAUSED;
    clearInterval(gameLoop);
    stopBackgroundMusic();
    updateUI();
  } else if (gameState === GAME_STATES.PAUSED) {
    startGame();
  }
}

// 重新开始
function restartGame() {
  clearInterval(gameLoop);
  resetGame();
  gameState = GAME_STATES.NOT_STARTED;
  updateUI();
}

// 改变难度
function changeDifficulty() {
  difficulty = difficultySelect.value;
  const config = DIFFICULTY_CONFIG[difficulty];
  currentSpeed = config.baseSpeed;
  speedSlider.value = currentSpeed;
  speedValue.textContent = currentSpeed + 'ms';
  
  if (gameState === GAME_STATES.PLAYING) {
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, currentSpeed);
  }
}

// 改变速度
function changeSpeed() {
  currentSpeed = parseInt(speedSlider.value, 10);
  speedValue.textContent = currentSpeed + 'ms';
  
  if (gameState === GAME_STATES.PLAYING) {
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, currentSpeed);
  }
}

// 切换音乐
function toggleMusic() {
  musicEnabled = !musicEnabled;
  musicToggle.textContent = musicEnabled ? '🎵 Family Song: 开' : '🎵 Family Song: 关';
  musicToggle.classList.toggle('active', musicEnabled);
  
  if (musicEnabled && gameState === GAME_STATES.PLAYING) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
}

// 切换音效
function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? '🔊 音效: 开' : '🔊 音效: 关';
  soundToggle.classList.toggle('active', soundEnabled);
}

// 播放音效
function playSound(frequency, duration, type = 'sine') {
  if (!soundEnabled || !audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(soundGain);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.log('音效播放失败:', e);
  }
}

// 播放背景音乐 - "You and me we are family"
function startBackgroundMusic() {
  if (!musicEnabled || !audioContext) return;
  
  try {
    // "You and me we are family" 完整旋律
    const playFamilySong = () => {
      if (!musicEnabled) return;
      
      // 主旋律 - "You and me we are family"
      const mainMelody = [
        // "You and me"
        { freq: 523.25, duration: 0.3, delay: 0 },      // C5
        { freq: 659.25, duration: 0.3, delay: 300 },      // E5
        { freq: 783.99, duration: 0.5, delay: 600 },     // G5
        
        // "we are"
        { freq: 698.46, duration: 0.25, delay: 1100 },     // F5
        { freq: 659.25, duration: 0.25, delay: 1350 },     // E5
        
        // "family"
        { freq: 523.25, duration: 0.3, delay: 1600 },   // C5
        { freq: 587.33, duration: 0.3, delay: 1900 },     // D5
        { freq: 659.25, duration: 0.5, delay: 2200 },     // E5
        { freq: 523.25, duration: 0.7, delay: 2700 },     // C5 (长音)
        
        // 间奏
        { freq: 0, duration: 0, delay: 3400 },           // 静音
        
        // 重复主旋律
        { freq: 523.25, duration: 0.3, delay: 4000 },     // C5
        { freq: 659.25, duration: 0.3, delay: 4300 },      // E5
        { freq: 783.99, duration: 0.5, delay: 4600 },     // G5
        
        { freq: 698.46, duration: 0.25, delay: 5100 },     // F5
        { freq: 659.25, duration: 0.25, delay: 5350 },     // E5
        
        { freq: 523.25, duration: 0.3, delay: 5600 },     // C5
        { freq: 587.33, duration: 0.3, delay: 5900 },     // D5
        { freq: 659.25, duration: 0.5, delay: 6200 },     // E5
        { freq: 523.25, duration: 1.0, delay: 6700 },      // C5 (更长音)
      ];
      
      // 和声部分
      const harmony = [
        // 低音和声
        { freq: 261.63, duration: 0.8, delay: 0 },       // C4
        { freq: 329.63, duration: 0.8, delay: 800 },      // E4
        { freq: 392.00, duration: 0.8, delay: 1600 },     // G4
        { freq: 349.23, duration: 0.8, delay: 2400 },     // F4
        { freq: 261.63, duration: 1.2, delay: 3200 },     // C4 (长音)
        
        // 重复和声
        { freq: 261.63, duration: 0.8, delay: 4400 },    // C4
        { freq: 329.63, duration: 0.8, delay: 5200 },     // E4
        { freq: 392.00, duration: 0.8, delay: 6000 },     // G4
        { freq: 349.23, duration: 0.8, delay: 6800 },     // F4
        { freq: 261.63, duration: 1.5, delay: 7600 },     // C4 (更长音)
      ];
      
      // 播放主旋律
      mainMelody.forEach((note) => {
        setTimeout(() => {
          if (musicEnabled && note.freq > 0) {
            playMelodyNote(note.freq, note.duration, 'sine');
          }
        }, note.delay);
      });
      
      // 播放和声
      harmony.forEach((note) => {
        setTimeout(() => {
          if (musicEnabled && note.freq > 0) {
            playMelodyNote(note.freq, note.duration, 'triangle', 0.15);
          }
        }, note.delay);
      });
      
      // 循环播放整首歌
      setTimeout(playFamilySong, 9200); // 约9.2秒后重复
    };
    
    playFamilySong();
  } catch (e) {
    console.log('背景音乐播放失败:', e);
  }
}

// 播放旋律音符
function playMelodyNote(frequency, duration, waveType = 'sine', volume = 0.2) {
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(musicGain);
    
    oscillator.frequency.value = frequency;
    oscillator.type = waveType;
    
    // 更柔和的音量包络
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.log('音符播放失败:', e);
  }
}

// 停止背景音乐
function stopBackgroundMusic() {
  // 简单的背景音乐停止（实际实现中可能需要更复杂的控制）
}

// 重置游戏
function resetGame() {
  snake = [{ x: 10, y: 10 }];
  currentDirection = DIRECTIONS.RIGHT;
  nextDirection = DIRECTIONS.RIGHT;
  score = 0;
  lives = 3; // 重置生命数
  colorIndex = 0;
  snakeColor = SNAKE_COLORS[0]; // 重置为第一个颜色
  generateFood();
  
  const config = DIFFICULTY_CONFIG[difficulty];
  currentSpeed = config.baseSpeed;
  speedSlider.value = currentSpeed;
  speedValue.textContent = currentSpeed + 'ms';
}

// 生成食物
function generateFood() {
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// 改变蛇身颜色
function changeSnakeColor() {
  colorIndex = (colorIndex + 1) % SNAKE_COLORS.length;
  snakeColor = SNAKE_COLORS[colorIndex];
}

// 颜色变暗函数
function darkenColor(color, amount) {
  // 移除 # 号
  const hex = color.replace('#', '');
  
  // 转换为 RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 变暗
  const newR = Math.floor(r * (1 - amount));
  const newG = Math.floor(g * (1 - amount));
  const newB = Math.floor(b * (1 - amount));
  
  // 转换回十六进制
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// 游戏主循环
function gameStep() {
  if (gameState !== GAME_STATES.PLAYING) return;
  
  // 更新方向
  currentDirection = nextDirection;
  
  // 计算新头部位置
  const head = { ...snake[0] };
  head.x += currentDirection.x;
  head.y += currentDirection.y;
  
  // 检查碰撞
  if (checkCollision(head)) {
    gameOver();
    return;
  }
  
  // 添加新头部
  snake.unshift(head);
  
  // 检查是否吃到食物
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    updateScore();
    changeSnakeColor(); // 改变蛇身颜色
    playSound(800, 0.2, 'square'); // 吃到食物音效
    generateFood();
    
    // 增加速度（基于当前速度设置）
    const config = DIFFICULTY_CONFIG[difficulty];
    const baseSpeed = parseInt(speedSlider.value, 10);
    const minSpeed = Math.max(baseSpeed * 0.2, 20);
    
    if (currentSpeed > minSpeed) {
      currentSpeed = Math.max(currentSpeed - config.speedIncrease, minSpeed);
      clearInterval(gameLoop);
      gameLoop = setInterval(gameStep, currentSpeed);
    }
  } else {
    // 移除尾部
    snake.pop();
  }
  
  render();
}

// 检查碰撞
function checkCollision(head) {
  // 检查墙壁碰撞
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return true;
  }
  
  // 检查自身碰撞
  return snake.some(segment => segment.x === head.x && segment.y === head.y);
}

// 游戏结束
function gameOver() {
  lives--;
  
  if (lives > 0) {
    // 还有生命，重新开始这一轮
    gameState = GAME_STATES.PAUSED;
    clearInterval(gameLoop);
    
    // 重置蛇的位置和方向
    snake = [{ x: 10, y: 10 }];
    currentDirection = DIRECTIONS.RIGHT;
    nextDirection = DIRECTIONS.RIGHT;
    generateFood();
    
    // 重置颜色
    colorIndex = 0;
    snakeColor = SNAKE_COLORS[0];
    
    updateUI();
    render();
  } else {
    // 没有生命了，游戏真正结束
    gameState = GAME_STATES.GAME_OVER;
    clearInterval(gameLoop);
    playSound(200, 0.5, 'sawtooth'); // 游戏结束音效
    stopBackgroundMusic();
    
    // 更新最高分
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    
    updateUI();
  }
}

// 处理键盘输入
function handleKeyPress(e) {
  if (gameState !== GAME_STATES.PLAYING && gameState !== GAME_STATES.PAUSED) return;
  
  switch (e.code) {
    case 'ArrowUp':
      if (currentDirection !== DIRECTIONS.DOWN) {
        nextDirection = DIRECTIONS.UP;
      }
      break;
    case 'ArrowDown':
      if (currentDirection !== DIRECTIONS.UP) {
        nextDirection = DIRECTIONS.DOWN;
      }
      break;
    case 'ArrowLeft':
      if (currentDirection !== DIRECTIONS.RIGHT) {
        nextDirection = DIRECTIONS.LEFT;
      }
      break;
    case 'ArrowRight':
      if (currentDirection !== DIRECTIONS.LEFT) {
        nextDirection = DIRECTIONS.RIGHT;
      }
      break;
    case 'Space':
      e.preventDefault();
      if (gameState === GAME_STATES.PLAYING) {
        togglePause();
      } else if (gameState === GAME_STATES.PAUSED) {
        startGame();
      }
      break;
  }
}

// 渲染游戏
function render() {
  // 清空画布
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  // 绘制网格
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS_SIZE);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS_SIZE, pos);
    ctx.stroke();
  }
  
  // 绘制蛇
  snake.forEach((segment, index) => {
    if (index === 0) {
      // 蛇头 - 使用更深的颜色
      const headColor = darkenColor(snakeColor, 0.3);
      ctx.fillStyle = headColor;
    } else {
      // 蛇身 - 使用当前颜色
      ctx.fillStyle = snakeColor;
    }
    
    ctx.fillRect(
      segment.x * CELL_SIZE + 1,
      segment.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );
  });
  
  // 绘制食物
  ctx.fillStyle = '#FF5722';
  ctx.fillRect(
    food.x * CELL_SIZE + 2,
    food.y * CELL_SIZE + 2,
    CELL_SIZE - 4,
    CELL_SIZE - 4
  );
}

// 更新分数
function updateScore() {
  currentScoreEl.textContent = score;
}

// 更新UI
function updateUI() {
  // 更新按钮状态
  switch (gameState) {
    case GAME_STATES.NOT_STARTED:
      startBtn.textContent = '开始游戏';
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      restartBtn.disabled = false;
      statusEl.textContent = '欢迎来到贪吃蛇！音乐已开始播放，按开始游戏开始，使用方向键控制';
      break;
    case GAME_STATES.PLAYING:
      startBtn.textContent = '游戏中';
      startBtn.disabled = true;
      pauseBtn.textContent = '暂停';
      pauseBtn.disabled = false;
      restartBtn.disabled = false;
      statusEl.textContent = '游戏进行中，使用方向键控制，空格键暂停';
      break;
    case GAME_STATES.PAUSED:
      startBtn.textContent = '继续';
      startBtn.disabled = false;
      pauseBtn.textContent = '已暂停';
      pauseBtn.disabled = true;
      restartBtn.disabled = false;
      if (lives < 3) {
        statusEl.textContent = `失去一条生命！剩余生命：${lives}，点击继续重新开始`;
      } else {
        statusEl.textContent = '游戏已暂停，点击继续或按空格键继续';
      }
      break;
    case GAME_STATES.GAME_OVER:
      startBtn.textContent = '重新开始';
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      restartBtn.disabled = false;
      statusEl.textContent = `游戏结束！最终分数：${score}，最高分：${highScore}`;
      break;
  }
  
  // 更新分数显示
  currentScoreEl.textContent = score;
  highScoreEl.textContent = highScore;
  livesEl.textContent = lives;
}

// 保存最高分
function saveHighScore() {
  localStorage.setItem('snakeHighScore', highScore.toString());
}

// 加载最高分
function loadHighScore() {
  const saved = localStorage.getItem('snakeHighScore');
  highScore = saved ? parseInt(saved, 10) : 0;
}

// 初始化游戏
init();