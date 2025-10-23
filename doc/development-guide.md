# 开发指南

## 📋 目录
- [开发环境搭建](#开发环境搭建)
- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [开发流程](#开发流程)
- [调试技巧](#调试技巧)
- [性能优化](#性能优化)
- [测试指南](#测试指南)
- [部署说明](#部署说明)

## 🛠️ 开发环境搭建

### 系统要求
- Node.js 14+ (可选，用于开发工具)
- Python 3.6+ (用于本地服务器)
- 现代浏览器 (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)

### 开发工具推荐
- **代码编辑器**: VS Code, WebStorm, Sublime Text
- **浏览器**: Chrome DevTools, Firefox Developer Tools
- **版本控制**: Git
- **本地服务器**: Python HTTP Server, Live Server

### 环境配置

#### 1. 克隆项目
```bash
git clone <repository-url>
cd sudoku
```

#### 2. 启动本地服务器
```bash
# 使用Python
python3 -m http.server 8000

# 或使用Node.js (如果安装了http-server)
npx http-server -p 8000

# 或使用VS Code Live Server扩展
```

#### 3. 访问应用
```
http://localhost:8000
```

## 📁 项目结构

```
sudoku/
├── doc/                    # 文档目录
│   ├── architecture.md     # 架构设计文档
│   ├── api-reference.md    # API参考文档
│   ├── user-guide.md       # 用户使用指南
│   └── development-guide.md # 开发指南
├── js/                     # JavaScript模块
│   ├── main.js            # 入口文件
│   ├── game.js            # 主游戏逻辑
│   ├── gameState.js       # 游戏状态管理
│   ├── auth.js            # 用户认证
│   ├── audio.js           # 音频系统
│   ├── snake.js           # 蛇逻辑
│   ├── food.js            # 食物管理
│   ├── renderer.js        # 渲染系统
│   ├── ui.js              # UI控制
│   └── config.js          # 配置常量
├── index.html             # 游戏主页面
├── login.html             # 登录页面
├── style.css              # 游戏样式
├── auth.css               # 登录页面样式
├── favicon.svg            # 网站图标
├── README.md              # 项目说明
└── REFACTOR.md            # 重构说明
```

## 📝 代码规范

### JavaScript规范

#### 1. 命名规范
```javascript
// 类名使用PascalCase
class SnakeGame {}

// 变量和函数名使用camelCase
const gameState = 'playing';
function startGame() {}

// 常量使用UPPER_SNAKE_CASE
const GAME_STATES = {
  NOT_STARTED: 'not_started'
};

// 私有方法使用下划线前缀
_privateMethod() {}
```

#### 2. 文件结构
```javascript
'use strict';

// 1. 导入语句
import { GameState } from './gameState.js';

// 2. 常量定义
const CONSTANTS = {};

// 3. 类定义
export class MyClass {
  // 构造函数
  constructor() {}
  
  // 公共方法
  publicMethod() {}
  
  // 私有方法
  _privateMethod() {}
}
```

#### 3. 注释规范
```javascript
/**
 * 游戏状态管理类
 * 负责管理游戏的各种状态和数据
 */
export class GameState {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 初始化游戏状态
    this.gameState = 'not_started';
  }
  
  /**
   * 更新游戏分数
   * @param {number} score - 新的分数
   * @returns {boolean} 是否更新成功
   */
  updateScore(score) {
    // 实现逻辑
  }
}
```

### CSS规范

#### 1. 命名规范
```css
/* 使用BEM命名法 */
.game-container {}
.game-container__header {}
.game-container__header--active {}

/* 或使用语义化命名 */
.header {}
.user-info {}
.login-btn {}
```

#### 2. 组织结构
```css
/* 1. 重置样式 */
* { margin: 0; padding: 0; }

/* 2. 基础样式 */
body { font-family: Arial, sans-serif; }

/* 3. 布局样式 */
.container { display: flex; }

/* 4. 组件样式 */
.button { padding: 10px; }

/* 5. 响应式样式 */
@media (max-width: 768px) {}
```

### HTML规范

#### 1. 语义化标签
```html
<header class="header">
  <h1>贪吃蛇游戏</h1>
  <nav class="user-info">
    <span id="welcomeText">欢迎，游客</span>
    <button id="loginBtn">注册/登录</button>
  </nav>
</header>

<main class="game-container">
  <canvas id="gameCanvas"></canvas>
  <div class="controls">
    <button id="start">开始游戏</button>
  </div>
</main>
```

#### 2. 属性规范
```html
<!-- 使用有意义的ID和class -->
<button id="startGame" class="btn btn-primary">开始游戏</button>

<!-- 添加必要的属性 -->
<input type="text" id="username" required aria-label="用户名">

<!-- 使用data属性存储自定义数据 -->
<div data-game-mode="infinite" data-difficulty="medium"></div>
```

## 🔄 开发流程

### 1. 功能开发流程

#### 需求分析
- 明确功能需求
- 确定技术方案
- 评估开发时间

#### 设计阶段
- 设计模块接口
- 确定数据结构
- 规划用户界面

#### 编码阶段
- 创建功能分支
- 实现核心功能
- 添加错误处理

#### 测试阶段
- 单元测试
- 集成测试
- 用户测试

#### 部署阶段
- 代码审查
- 合并到主分支
- 更新文档

### 2. 代码提交规范

#### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例
```
feat(game): 添加游戏记录功能

- 为每局游戏记录开始时间、结束时间、游戏时长
- 记录游戏模式（无限循环/经典模式）和难度设置
- 记录玩家分数、AI分数、胜负结果、使用生命数
- 添加游戏记录查看界面，显示历史记录和统计信息

Closes #123
```

### 3. 分支管理

#### 分支命名
- `main`: 主分支
- `develop`: 开发分支
- `feature/功能名`: 功能分支
- `bugfix/问题描述`: 修复分支
- `hotfix/紧急修复`: 热修复分支

#### 工作流程
```bash
# 1. 创建功能分支
git checkout -b feature/game-records

# 2. 开发功能
git add .
git commit -m "feat: 添加游戏记录功能"

# 3. 推送分支
git push origin feature/game-records

# 4. 创建Pull Request
# 5. 代码审查
# 6. 合并到主分支
```

## 🐛 调试技巧

### 1. 浏览器调试

#### Chrome DevTools
```javascript
// 使用console.log调试
console.log('游戏状态:', gameState);
console.table(gameRecords);

// 使用断点调试
debugger; // 在代码中设置断点

// 使用console.group组织日志
console.group('游戏初始化');
console.log('加载配置');
console.log('初始化音频');
console.groupEnd();
```

#### 性能分析
```javascript
// 测量代码执行时间
console.time('游戏循环');
// 游戏循环代码
console.timeEnd('游戏循环');

// 内存使用分析
console.log('内存使用:', performance.memory);
```

### 2. 错误处理

#### 全局错误处理
```javascript
// 捕获未处理的错误
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.error);
});

// 捕获Promise错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise错误:', event.reason);
});
```

#### 模块错误处理
```javascript
try {
  // 可能出错的代码
  const result = riskyOperation();
} catch (error) {
  console.error('操作失败:', error);
  // 错误恢复逻辑
}
```

### 3. 调试工具

#### 游戏状态调试
```javascript
// 添加调试方法
class GameState {
  debug() {
    console.log('当前状态:', {
      gameState: this.gameState,
      score: this.score,
      lives: this.lives,
      infiniteMode: this.infiniteMode
    });
  }
}

// 在控制台调用
game.gameState.debug();
```

#### 性能监控
```javascript
// 监控游戏循环性能
let frameCount = 0;
let lastTime = performance.now();

function gameLoop() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    console.log('FPS:', frameCount);
    frameCount = 0;
    lastTime = currentTime;
  }
  
  // 游戏逻辑
  requestAnimationFrame(gameLoop);
}
```

## ⚡ 性能优化

### 1. 渲染优化

#### Canvas优化
```javascript
// 避免不必要的重绘
class Renderer {
  render(playerSnake, aiSnake, foods, infiniteMode) {
    // 只在需要时清空画布
    if (this.needsRedraw) {
      this.clearCanvas();
      this.drawGrid();
      this.needsRedraw = false;
    }
    
    // 绘制变化的元素
    this.drawSnake(playerSnake);
    this.drawSnake(aiSnake);
    this.drawFoods(foods);
  }
}
```

#### 动画优化
```javascript
// 使用requestAnimationFrame
function gameLoop() {
  // 游戏逻辑
  updateGame();
  renderGame();
  
  // 继续下一帧
  requestAnimationFrame(gameLoop);
}
```

### 2. 内存优化

#### 对象池模式
```javascript
// 重用对象，避免频繁创建
class ObjectPool {
  constructor(createFn, resetFn) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
  }
  
  get() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.createFn();
  }
  
  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}
```

#### 垃圾回收优化
```javascript
// 及时清理不需要的引用
class GameState {
  clearGameRecords() {
    this.gameRecords = [];
    // 强制垃圾回收（如果支持）
    if (window.gc) {
      window.gc();
    }
  }
}
```

### 3. 网络优化

#### 资源压缩
```bash
# 压缩CSS
npx clean-css-cli -o style.min.css style.css

# 压缩JavaScript
npx terser js/main.js -o js/main.min.js

# 压缩HTML
npx html-minifier-terser -o index.min.html index.html
```

#### 缓存策略
```javascript
// 使用Service Worker缓存
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 🧪 测试指南

### 1. 单元测试

#### 测试框架
```javascript
// 简单的测试框架
class TestFramework {
  constructor() {
    this.tests = [];
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  run() {
    this.tests.forEach(({ name, fn }) => {
      try {
        fn();
        console.log(`✅ ${name}`);
      } catch (error) {
        console.error(`❌ ${name}:`, error.message);
      }
    });
  }
}

// 使用示例
const test = new TestFramework();

test.test('GameState初始化', () => {
  const gameState = new GameState();
  assert(gameState.gameState === 'not_started');
});

test.run();
```

#### 断言函数
```javascript
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `期望 ${expected}，实际 ${actual}`);
  }
}
```

### 2. 集成测试

#### 游戏流程测试
```javascript
// 测试完整的游戏流程
function testGameFlow() {
  const game = new SnakeGame();
  game.init();
  
  // 测试游戏开始
  game.startGame();
  assert(game.gameState.getState() === 'playing');
  
  // 测试游戏暂停
  game.togglePause();
  assert(game.gameState.getState() === 'paused');
  
  // 测试游戏继续
  game.startGame();
  assert(game.gameState.getState() === 'playing');
}
```

### 3. 用户测试

#### 测试清单
- [ ] 游戏可以正常启动
- [ ] 所有按钮功能正常
- [ ] 键盘控制响应正确
- [ ] 音效播放正常
- [ ] 游戏记录保存正确
- [ ] 用户登录注册功能正常
- [ ] 响应式设计在不同设备上正常

## 🚀 部署说明

### 1. 静态部署

#### 文件准备
```bash
# 压缩资源文件
npx clean-css-cli -o style.min.css style.css
npx terser js/main.js -o js/main.min.js

# 更新HTML引用
# 将style.css改为style.min.css
# 将js/main.js改为js/main.min.js
```

#### 部署到GitHub Pages
```bash
# 1. 创建gh-pages分支
git checkout -b gh-pages

# 2. 推送分支
git push origin gh-pages

# 3. 在GitHub设置中启用Pages
```

#### 部署到其他静态托管
- **Netlify**: 拖拽文件夹到Netlify
- **Vercel**: 连接GitHub仓库
- **Firebase Hosting**: 使用Firebase CLI

### 2. 服务器部署

#### Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/sudoku;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache配置
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/sudoku
    
    <Directory /path/to/sudoku>
        AllowOverride All
        Require all granted
    </Directory>
    
    # 静态资源缓存
    <LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </LocationMatch>
</VirtualHost>
```

### 3. 持续集成

#### GitHub Actions
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 📚 学习资源

### 相关技术
- [MDN Web Docs](https://developer.mozilla.org/)
- [Canvas API文档](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Web Audio API文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [ES6模块系统](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

### 游戏开发
- [游戏开发最佳实践](https://developer.mozilla.org/en-US/docs/Games)
- [Canvas游戏开发教程](https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript)
- [Web Audio API教程](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)

---

*开发指南最后更新: 2024年1月*
