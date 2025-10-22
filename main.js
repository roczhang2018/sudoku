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
const statusEl = document.getElementById('status');

// 初始化
function init() {
  loadHighScore();
  bindEvents();
  updateUI();
  render();
  
  // 初始化速度控制器
  const config = DIFFICULTY_CONFIG[difficulty];
  speedSlider.value = config.baseSpeed;
  speedValue.textContent = config.baseSpeed + 'ms';
}

// 绑定事件
function bindEvents() {
  // 按钮事件
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', restartGame);
  difficultySelect.addEventListener('change', changeDifficulty);
  speedSlider.addEventListener('input', changeSpeed);
  
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
    updateUI();
  } else if (gameState === GAME_STATES.PAUSED) {
    gameState = GAME_STATES.PLAYING;
    gameLoop = setInterval(gameStep, currentSpeed);
    updateUI();
  }
}

// 暂停/继续
function togglePause() {
  if (gameState === GAME_STATES.PLAYING) {
    gameState = GAME_STATES.PAUSED;
    clearInterval(gameLoop);
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

// 重置游戏
function resetGame() {
  snake = [{ x: 10, y: 10 }];
  currentDirection = DIRECTIONS.RIGHT;
  nextDirection = DIRECTIONS.RIGHT;
  score = 0;
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
  gameState = GAME_STATES.GAME_OVER;
  clearInterval(gameLoop);
  
  // 更新最高分
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }
  
  updateUI();
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
  ctx.fillStyle = '#4CAF50';
  snake.forEach((segment, index) => {
    if (index === 0) {
      // 蛇头
      ctx.fillStyle = '#2E7D32';
    } else {
      ctx.fillStyle = '#4CAF50';
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
      statusEl.textContent = '按开始游戏开始，使用方向键控制';
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
      statusEl.textContent = '游戏已暂停，点击继续或按空格键继续';
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