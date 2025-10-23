# 🎮 前端设计文档

## 📋 概述

贪吃蛇游戏前端采用现代Web技术构建，提供流畅的游戏体验和用户交互界面。

## 🏗️ 架构设计

### 整体架构
```
用户界面层 (UI Layer)
├── HTML页面 (index.html, login.html)
├── CSS样式 (style.css, auth.css)
└── JavaScript模块 (ES6 Modules)

业务逻辑层 (Business Logic Layer)
├── 游戏引擎 (Game Engine)
├── 状态管理 (State Management)
├── 用户认证 (Authentication)
└── 通信管理 (Communication)

数据层 (Data Layer)
├── 本地存储 (LocalStorage)
├── 后端API (REST API)
└── WebSocket连接 (Real-time)
```

### 模块化设计
```
public/js/
├── main.js              # 主入口文件
├── game.js              # 游戏核心逻辑
├── gameState.js         # 游戏状态管理
├── snake.js             # 蛇类实现
├── food.js              # 食物管理
├── renderer.js          # 渲染引擎
├── ui.js                # 用户界面管理
├── audio.js             # 音频管理
├── config.js            # 配置管理
├── api.js               # API客户端
├── websocket.js         # WebSocket客户端
├── auth.js              # 本地认证
└── auth-backend.js      # 后端认证
```

## 🎯 核心功能模块

### 1. 游戏引擎 (Game Engine)

#### 游戏状态管理
```javascript
// 游戏状态枚举
const GAME_STATES = {
  NOT_STARTED: 'not_started',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

// 游戏状态类
class GameState {
  constructor() {
    this.gameState = 'not_started';
    this.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }];
    this.aiSnake = [{ x: 30, y: 10 }, { x: 29, y: 10 }];
    this.score = 0;
    this.aiScore = 0;
    this.lives = 3;
    this.infiniteMode = true;
  }
}
```

#### 游戏循环
```javascript
// 游戏主循环
gameStep() {
  if (this.gameState.getState() !== GAME_STATES.PLAYING) return;
  
  // 移动玩家蛇
  const newHead = this.playerSnake.move(infiniteMode);
  
  // 检查碰撞
  if (this.checkCollision(newHead)) {
    this.gameOver();
    return;
  }
  
  // 检查食物
  const eatenFood = this.checkFoodCollision();
  if (eatenFood) {
    this.handleFoodEaten(eatenFood);
  }
  
  // 移动AI蛇（仅无限循环模式）
  if (infiniteMode) {
    this.moveAISnake();
  }
  
  // 更新UI和渲染
  this.updateUI();
  this.renderer.render();
}
```

### 2. 渲染引擎 (Renderer)

#### Canvas渲染
```javascript
class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 20;
    this.gridWidth = this.canvas.width / this.gridSize;
    this.gridHeight = this.canvas.height / this.gridSize;
  }
  
  render(playerSnake, aiSnake, foods, infiniteMode) {
    this.clearCanvas();
    this.drawGrid();
    this.drawSnake(playerSnake, playerSnake.color);
    
    // 只在无限循环模式下绘制AI蛇
    if (aiSnake) {
      this.drawSnake(aiSnake, aiSnake.color);
    }
    
    this.drawFoods(foods);
    
    // 绘制无限循环模式指示器
    if (infiniteMode) {
      this.drawInfiniteModeArrows();
    }
  }
}
```

#### 渲染优化
- **双缓冲技术**：避免闪烁
- **局部重绘**：只重绘变化的部分
- **帧率控制**：稳定的60FPS渲染

### 3. 用户界面 (UI)

#### 响应式设计
```css
/* 移动端适配 */
@media (max-width: 768px) {
  .game-area {
    width: 100%;
    height: auto;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .score-panel {
    flex-direction: column;
    gap: 12px;
  }
}
```

#### 状态指示器
```javascript
class UIManager {
  updateStatusText(gameState, infiniteMode, lives, score, aiScore, foodCount) {
    const modeText = infiniteMode ? '边界可循环穿越！' : '经典模式，撞墙会死亡！';
    const aiText = infiniteMode ? '与AI蛇比赛！' : '';
    
    switch (gameState) {
      case GAME_STATES.NOT_STARTED:
        this.elements.statusEl.textContent = 
          `欢迎来到贪吃蛇游戏！${aiText}${modeText}`;
        break;
      case GAME_STATES.PLAYING:
        this.elements.statusEl.textContent = 
          `游戏进行中，使用方向键控制。${aiText}当前有${foodCount}个食物！${modeText}`;
        break;
    }
  }
}
```

### 4. 音频系统 (Audio)

#### Web Audio API
```javascript
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.backgroundMusic = null;
  }
  
  init() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.startBackgroundMusic();
  }
  
  playSound(frequency, duration, type = 'sine') {
    if (!this.isEnabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}
```

## 🎮 游戏功能

### 1. 游戏模式

#### 无限循环模式
- **边界穿越**：蛇可以从一边穿越到另一边
- **AI对战**：与AI蛇竞争
- **双蛇显示**：同时显示玩家蛇和AI蛇

#### 经典模式
- **边界碰撞**：撞墙游戏结束
- **单人游戏**：只有玩家蛇
- **传统玩法**：经典贪吃蛇体验

### 2. 游戏机制

#### 蛇的移动
```javascript
move(infiniteMode = true) {
  const head = this.getHead();
  let newHead = { ...head };
  
  switch (this.direction) {
    case DIRECTIONS.UP:
      newHead.y -= 1;
      break;
    case DIRECTIONS.DOWN:
      newHead.y += 1;
      break;
    case DIRECTIONS.LEFT:
      newHead.x -= 1;
      break;
    case DIRECTIONS.RIGHT:
      newHead.x += 1;
      break;
  }
  
  // 无限循环模式处理边界
  if (infiniteMode) {
    if (newHead.x < 0) newHead.x = this.gridWidth - 1;
    if (newHead.x >= this.gridWidth) newHead.x = 0;
    if (newHead.y < 0) newHead.y = this.gridHeight - 1;
    if (newHead.y >= this.gridHeight) newHead.y = 0;
  }
  
  return newHead;
}
```

#### 食物系统
```javascript
class FoodManager {
  generateFood(playerSnake, aiSnake) {
    this.foods = [];
    const foodCount = Math.floor(Math.random() * 3) + 3; // 3-5个食物
    
    for (let i = 0; i < foodCount; i++) {
      let newFood;
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        newFood = {
          x: Math.floor(Math.random() * GRID_WIDTH),
          y: Math.floor(Math.random() * GRID_HEIGHT),
          id: Date.now() + i,
          color: FOOD_COLORS[i % FOOD_COLORS.length]
        };
        attempts++;
      } while (
        attempts < maxAttempts && (
          playerSnake.segments.some(segment => 
            segment.x === newFood.x && segment.y === newFood.y) ||
          (aiSnake && aiSnake.segments.some(segment => 
            segment.x === newFood.x && segment.y === newFood.y)) ||
          this.foods.some(food => 
            food.x === newFood.x && food.y === newFood.y)
        )
      );
      
      if (attempts < maxAttempts) {
        this.foods.push(newFood);
      }
    }
  }
}
```

### 3. AI系统

#### AI蛇逻辑
```javascript
moveAI(foods, infiniteMode = true) {
  if (foods.length === 0) return null;
  
  const currentHead = this.getHead();
  
  // 找到最近的食物
  let nearestFood = null;
  let minDistance = Infinity;
  
  foods.forEach((food, index) => {
    const distance = Math.abs(food.x - currentHead.x) + Math.abs(food.y - currentHead.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearestFood = { ...food, index };
    }
  });
  
  // 计算移动方向
  const dx = nearestFood.x - currentHead.x;
  const dy = nearestFood.y - currentHead.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    this.nextDirection = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
  } else {
    this.nextDirection = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
  }
  
  // 移动蛇
  const newHead = this.move(infiniteMode);
  
  // 检查碰撞
  if (this.checkSelfCollision(newHead)) {
    this.reset(30, 10);
    return null;
  }
  
  // 检查食物
  const eatenFoodIndex = this.checkFoodCollision(foods);
  if (eatenFoodIndex !== -1) {
    return { type: 'eat', foodIndex: eatenFoodIndex };
  } else {
    this.removeTail();
    return { type: 'move' };
  }
}
```

## 🔧 技术特性

### 1. 性能优化

#### 渲染优化
- **Canvas优化**：使用requestAnimationFrame
- **内存管理**：及时清理事件监听器
- **计算优化**：减少不必要的计算

#### 代码优化
- **模块化**：ES6模块系统
- **懒加载**：按需加载模块
- **缓存策略**：合理使用缓存

### 2. 兼容性

#### 浏览器支持
- **现代浏览器**：Chrome 60+, Firefox 55+, Safari 12+
- **移动浏览器**：iOS Safari 12+, Chrome Mobile 60+
- **Web Audio API**：支持音频播放
- **Canvas API**：支持2D渲染

#### 降级方案
- **音频降级**：不支持Web Audio API时静音
- **触摸支持**：移动端触摸控制
- **响应式设计**：适配不同屏幕尺寸

### 3. 用户体验

#### 交互设计
- **键盘控制**：方向键控制蛇的移动
- **触摸控制**：移动端触摸按钮
- **快捷键**：空格键暂停/继续
- **按钮反馈**：点击效果和状态提示

#### 视觉设计
- **现代UI**：简洁美观的界面设计
- **动画效果**：平滑的过渡动画
- **状态指示**：清晰的游戏状态显示
- **色彩搭配**：舒适的视觉体验

## 📱 移动端适配

### 响应式布局
```css
/* 移动端样式 */
@media (max-width: 768px) {
  body {
    padding: 12px;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .controls button {
    width: 120px;
  }
  
  .score-panel {
    flex-direction: column;
    gap: 12px;
    min-width: 200px;
  }
  
  .game-area {
    width: 100%;
    max-width: 100vw;
  }
}
```

### 触摸控制
```javascript
// 触摸事件处理
document.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  
  // 根据触摸位置判断方向
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
    // 水平移动
    if (x > centerX) {
      game.setDirection(DIRECTIONS.RIGHT);
    } else {
      game.setDirection(DIRECTIONS.LEFT);
    }
  } else {
    // 垂直移动
    if (y > centerY) {
      game.setDirection(DIRECTIONS.DOWN);
    } else {
      game.setDirection(DIRECTIONS.UP);
    }
  }
});
```

## 🔒 安全考虑

### 1. 输入验证
- **方向输入**：防止无效方向
- **用户输入**：验证用户注册信息
- **API请求**：验证请求参数

### 2. 数据保护
- **本地存储**：敏感数据加密
- **通信安全**：HTTPS传输
- **XSS防护**：防止跨站脚本攻击

## 📊 性能监控

### 1. 性能指标
- **帧率监控**：保持60FPS
- **内存使用**：监控内存泄漏
- **加载时间**：优化页面加载

### 2. 错误处理
```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // 发送错误报告到服务器
});

// Promise错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // 处理未捕获的Promise错误
});
```

## 🚀 未来扩展

### 1. 功能扩展
- **多人游戏**：支持多玩家对战
- **排行榜**：全球排行榜系统
- **成就系统**：游戏成就和奖励
- **主题系统**：多种游戏主题

### 2. 技术升级
- **WebGL渲染**：3D渲染支持
- **WebAssembly**：性能优化
- **PWA支持**：离线游戏功能
- **WebRTC**：实时多人游戏

---

**注意**: 本文档会随着功能更新持续维护，请定期查看最新版本。
