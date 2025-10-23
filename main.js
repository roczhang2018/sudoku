'use strict';

// 游戏配置
const GRID_WIDTH = 40; // 宽度扩大一倍
const GRID_HEIGHT = 20; // 高度保持不变
const CANVAS_WIDTH = 800; // 宽度扩大一倍
const CANVAS_HEIGHT = 400; // 高度保持不变
const CELL_SIZE = 20; // 每个格子大小

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
let snake = [{ x: 10, y: 10 }]; // 玩家蛇
let aiSnake = [{ x: 30, y: 10 }]; // AI蛇
let aiDirection = DIRECTIONS.LEFT;
let aiNextDirection = DIRECTIONS.LEFT;
let foods = []; // 多个食物数组
let score = 0;
let aiScore = 0;
let highScore = 0;
let currentSpeed = 120;
let difficulty = 'medium';
let snakeColor = '#4CAF50'; // 玩家蛇身颜色
let aiSnakeColor = '#FF5722'; // AI蛇身颜色
let colorIndex = 0; // 颜色索引
let lives = 3; // 生命数

// 音频系统
let audioContext = null;
let musicEnabled = true;
let soundEnabled = true;
let backgroundMusic = null;
let musicGain = null;
let soundGain = null;

// 游戏模式
let infiniteMode = true; // 无限循环模式

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
const aiScoreEl = document.getElementById('aiScore');
const highScoreEl = document.getElementById('highScore');
const livesEl = document.getElementById('lives');
const statusEl = document.getElementById('status');
const musicToggle = document.getElementById('musicToggle');
const soundToggle = document.getElementById('soundToggle');
const infiniteToggle = document.getElementById('infiniteToggle');

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
  infiniteToggle.addEventListener('click', toggleInfiniteMode);
  
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

// 切换无限循环模式
function toggleInfiniteMode() {
  infiniteMode = !infiniteMode;
  infiniteToggle.textContent = infiniteMode ? '🔄 无限循环: 开' : '🔄 无限循环: 关';
  infiniteToggle.classList.toggle('active', infiniteMode);
  
  // 更新状态提示
  updateStatusText();
}

// 更新状态文本
function updateStatusText() {
  const modeText = infiniteMode ? '边界可循环穿越！' : '经典模式，撞墙会死亡！';
  
    switch (gameState) {
      case GAME_STATES.NOT_STARTED:
        statusEl.textContent = `欢迎来到贪吃蛇对战！音乐已开始播放，按开始游戏开始，使用方向键控制。与AI蛇比赛！棋盘上有3-5个食物，全部吃完后重新分配！${modeText}`;
        break;
      case GAME_STATES.PLAYING:
        statusEl.textContent = `游戏进行中，使用方向键控制，空格键暂停。与AI蛇比赛！当前有${foods.length}个食物！${modeText}`;
        break;
    case GAME_STATES.PAUSED:
      if (lives < 3) {
        statusEl.textContent = `失去一条生命！剩余生命：${lives}，点击继续重新开始。与AI蛇比赛！${modeText}`;
      } else {
        statusEl.textContent = `游戏已暂停，点击继续或按空格键继续。与AI蛇比赛！${modeText}`;
      }
      break;
    case GAME_STATES.GAME_OVER:
      const winner = score > aiScore ? '玩家获胜！' : score < aiScore ? 'AI获胜！' : '平局！';
      statusEl.textContent = `游戏结束！${winner} 玩家：${score}，AI：${aiScore}，最高分：${highScore}。${modeText}`;
      break;
  }
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
  snake = [{ x: 10, y: 10 }]; // 玩家蛇在左侧
  aiSnake = [{ x: 30, y: 10 }]; // AI蛇在右侧
  currentDirection = DIRECTIONS.RIGHT;
  nextDirection = DIRECTIONS.RIGHT;
  aiDirection = DIRECTIONS.LEFT;
  aiNextDirection = DIRECTIONS.LEFT;
  score = 0;
  aiScore = 0;
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
  foods = []; // 清空现有食物
  
  // 生成3-5个食物
  const foodCount = Math.floor(Math.random() * 3) + 3; // 3-5个食物
  
  for (let i = 0; i < foodCount; i++) {
    let newFood;
    let attempts = 0;
    const maxAttempts = 100; // 防止无限循环
    
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
        id: Date.now() + i // 给每个食物一个唯一ID
      };
      attempts++;
    } while (
      attempts < maxAttempts && (
        // 检查是否与蛇身重叠
        snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        aiSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
        // 检查是否与其他食物重叠
        foods.some(food => food.x === newFood.x && food.y === newFood.y)
      )
    );
    
    if (attempts < maxAttempts) {
      foods.push(newFood);
    }
  }
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

// AI蛇移动逻辑
function moveAISnake() {
  // 简单的AI逻辑：朝向最近的食物移动
  const currentAiHead = aiSnake[0];
  
  // 找到最近的食物
  let nearestFood = null;
  let minDistance = Infinity;
  
  foods.forEach(food => {
    const distance = Math.abs(food.x - currentAiHead.x) + Math.abs(food.y - currentAiHead.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearestFood = food;
    }
  });
  
  if (!nearestFood) return; // 没有食物时不动
  
  const dx = nearestFood.x - currentAiHead.x;
  const dy = nearestFood.y - currentAiHead.y;
  
  // 选择移动方向
  if (Math.abs(dx) > Math.abs(dy)) {
    // 水平移动
    if (dx > 0 && aiDirection !== DIRECTIONS.LEFT) {
      aiNextDirection = DIRECTIONS.RIGHT;
    } else if (dx < 0 && aiDirection !== DIRECTIONS.RIGHT) {
      aiNextDirection = DIRECTIONS.LEFT;
    }
  } else {
    // 垂直移动
    if (dy > 0 && aiDirection !== DIRECTIONS.UP) {
      aiNextDirection = DIRECTIONS.DOWN;
    } else if (dy < 0 && aiDirection !== DIRECTIONS.DOWN) {
      aiNextDirection = DIRECTIONS.UP;
    }
  }
  
  // 更新AI方向
  aiDirection = aiNextDirection;
  
  // 计算AI新头部位置
  const newAiHead = { ...aiSnake[0] };
  newAiHead.x += aiDirection.x;
  newAiHead.y += aiDirection.y;
  
  // 根据无限循环模式处理AI边界
  if (infiniteMode) {
    if (newAiHead.x < 0) {
      newAiHead.x = GRID_WIDTH - 1;
    } else if (newAiHead.x >= GRID_WIDTH) {
      newAiHead.x = 0;
    }
    
    if (newAiHead.y < 0) {
      newAiHead.y = GRID_HEIGHT - 1;
    } else if (newAiHead.y >= GRID_HEIGHT) {
      newAiHead.y = 0;
    }
  } else {
    // 经典模式 - AI撞墙会重置位置
    if (newAiHead.x < 0 || newAiHead.x >= GRID_WIDTH || newAiHead.y < 0 || newAiHead.y >= GRID_HEIGHT) {
      aiSnake = [{ x: 30, y: 10 }];
      return;
    }
  }
  
  // 检查AI自身碰撞
  if (aiSnake.some(segment => segment.x === newAiHead.x && segment.y === newAiHead.y)) {
    aiSnake = [{ x: 30, y: 10 }];
    return;
  }
  
  // 添加AI新头部
  aiSnake.unshift(newAiHead);
  
  // 检查AI是否吃到食物
  const eatenFoodIndex = foods.findIndex(food => food.x === newAiHead.x && food.y === newAiHead.y);
  if (eatenFoodIndex !== -1) {
    aiScore += 10;
    foods.splice(eatenFoodIndex, 1); // 移除被吃掉的食物
    
    // 如果所有食物都被吃掉，生成新食物
    if (foods.length === 0) {
      generateFood();
    }
  } else {
    // 移除AI尾部
    aiSnake.pop();
  }
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
  
  // 根据无限循环模式处理边界
  if (infiniteMode) {
    // 无限循环模式 - 从一边出来从另一边进入
    if (head.x < 0) {
      head.x = GRID_WIDTH - 1; // 从右边出来
    } else if (head.x >= GRID_WIDTH) {
      head.x = 0; // 从左边出来
    }
    
    if (head.y < 0) {
      head.y = GRID_HEIGHT - 1; // 从下边出来
    } else if (head.y >= GRID_HEIGHT) {
      head.y = 0; // 从上边出来
    }
    
    // 只检查自身碰撞
    if (checkSelfCollision(head)) {
      gameOver();
      return;
    }
  } else {
    // 经典模式 - 检查边界碰撞
    if (checkCollision(head)) {
      gameOver();
      return;
    }
  }
  
  // 添加新头部
  snake.unshift(head);
  
  // 检查是否吃到食物
  const eatenFoodIndex = foods.findIndex(food => food.x === head.x && food.y === head.y);
  if (eatenFoodIndex !== -1) {
    score += 10;
    updateScore();
    changeSnakeColor(); // 改变蛇身颜色
    playSound(800, 0.2, 'square'); // 吃到食物音效
    foods.splice(eatenFoodIndex, 1); // 移除被吃掉的食物
    
    // 如果所有食物都被吃掉，生成新食物
    if (foods.length === 0) {
      generateFood();
    }
    
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
  
  // 移动AI蛇
  moveAISnake();
  
  render();
}

// 检查碰撞（经典模式）
function checkCollision(head) {
  // 检查墙壁碰撞
  if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
    return true;
  }
  
  // 检查自身碰撞
  return snake.some(segment => segment.x === head.x && segment.y === head.y);
}

// 检查自身碰撞（无限循环模式）
function checkSelfCollision(head) {
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
    aiSnake = [{ x: 30, y: 10 }];
    currentDirection = DIRECTIONS.RIGHT;
    nextDirection = DIRECTIONS.RIGHT;
    aiDirection = DIRECTIONS.LEFT;
    aiNextDirection = DIRECTIONS.LEFT;
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
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // 绘制网格
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  
  // 绘制垂直网格线
  for (let i = 0; i <= GRID_WIDTH; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, CANVAS_HEIGHT);
    ctx.stroke();
  }
  
  // 绘制水平网格线
  for (let i = 0; i <= GRID_HEIGHT; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(CANVAS_WIDTH, pos);
    ctx.stroke();
  }
  
  // 只在无限循环模式下绘制循环边界指示箭头
  if (infiniteMode) {
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#4CAF50';
    
    // 左右边界箭头
    const arrowSize = 8;
    for (let i = 0; i < GRID_HEIGHT; i += 4) {
      const y = i * CELL_SIZE + CELL_SIZE / 2;
      
      // 左边界箭头 (→)
      ctx.beginPath();
      ctx.moveTo(5, y);
      ctx.lineTo(5 + arrowSize, y - arrowSize/2);
      ctx.lineTo(5 + arrowSize, y + arrowSize/2);
      ctx.closePath();
      ctx.fill();
      
      // 右边界箭头 (←)
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH - 5, y);
      ctx.lineTo(CANVAS_WIDTH - 5 - arrowSize, y - arrowSize/2);
      ctx.lineTo(CANVAS_WIDTH - 5 - arrowSize, y + arrowSize/2);
      ctx.closePath();
      ctx.fill();
    }
    
    // 上下边界箭头
    for (let i = 0; i < GRID_WIDTH; i += 8) {
      const x = i * CELL_SIZE + CELL_SIZE / 2;
      
      // 上边界箭头 (↓)
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.lineTo(x - arrowSize/2, 5 + arrowSize);
      ctx.lineTo(x + arrowSize/2, 5 + arrowSize);
      ctx.closePath();
      ctx.fill();
      
      // 下边界箭头 (↑)
      ctx.beginPath();
      ctx.moveTo(x, CANVAS_HEIGHT - 5);
      ctx.lineTo(x - arrowSize/2, CANVAS_HEIGHT - 5 - arrowSize);
      ctx.lineTo(x + arrowSize/2, CANVAS_HEIGHT - 5 - arrowSize);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // 绘制玩家蛇
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
  
  // 绘制AI蛇
  aiSnake.forEach((segment, index) => {
    if (index === 0) {
      // AI蛇头 - 使用更深的颜色
      const aiHeadColor = darkenColor(aiSnakeColor, 0.3);
      ctx.fillStyle = aiHeadColor;
    } else {
      // AI蛇身 - 使用AI颜色
      ctx.fillStyle = aiSnakeColor;
    }
    
    ctx.fillRect(
      segment.x * CELL_SIZE + 1,
      segment.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    );
  });
  
  // 绘制多个食物
  foods.forEach((food, index) => {
    // 使用不同颜色区分食物
    const colors = ['#FF9800', '#FF5722', '#4CAF50', '#2196F3', '#9C27B0'];
    const foodColor = colors[index % colors.length];
    
    ctx.fillStyle = foodColor;
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    );
  });
}

// 更新分数
function updateScore() {
  currentScoreEl.textContent = score;
  aiScoreEl.textContent = aiScore;
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
  
  // 更新分数显示
  currentScoreEl.textContent = score;
  aiScoreEl.textContent = aiScore;
  highScoreEl.textContent = highScore;
  livesEl.textContent = lives;
  
  // 更新状态文本
  updateStatusText();
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