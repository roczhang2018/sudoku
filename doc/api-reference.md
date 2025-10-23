# API 参考文档

## 📋 目录
- [游戏核心API](#游戏核心api)
- [用户认证API](#用户认证api)
- [音频系统API](#音频系统api)
- [UI管理API](#ui管理api)
- [数据存储API](#数据存储api)

## 🎮 游戏核心API

### SnakeGame 类

主游戏类，负责协调各个模块。

#### 构造函数
```javascript
new SnakeGame(authManager, currentUser)
```

**参数**:
- `authManager` (AuthManager): 用户认证管理器
- `currentUser` (Object|null): 当前用户对象，null表示游客模式

#### 主要方法

##### init()
初始化游戏
```javascript
game.init()
```

##### startGame()
开始游戏
```javascript
game.startGame()
```

##### togglePause()
暂停/继续游戏
```javascript
game.togglePause()
```

##### restartGame()
重新开始游戏
```javascript
game.restartGame()
```

##### setDifficulty(difficulty)
设置游戏难度
```javascript
game.setDifficulty('easy' | 'medium' | 'hard')
```

##### setSpeed(speed)
设置游戏速度
```javascript
game.setSpeed(100) // 毫秒
```

##### toggleMusic()
切换音乐开关
```javascript
game.toggleMusic()
```

##### toggleSound()
切换音效开关
```javascript
game.toggleSound()
```

##### toggleInfiniteMode()
切换无限循环模式
```javascript
game.toggleInfiniteMode()
```

##### handleKeyPress(event)
处理键盘输入
```javascript
game.handleKeyPress(keyboardEvent)
```

### GameState 类

游戏状态管理类。

#### 主要属性
- `gameState`: 当前游戏状态
- `score`: 玩家分数
- `aiScore`: AI分数
- `highScore`: 最高分
- `lives`: 生命数
- `infiniteMode`: 无限循环模式状态

#### 主要方法

##### getState()
获取当前游戏状态
```javascript
gameState.getState() // 返回: 'not_started' | 'playing' | 'paused' | 'game_over'
```

##### setState(state)
设置游戏状态
```javascript
gameState.setState('playing')
```

##### updateScore(score)
更新玩家分数
```javascript
gameState.updateScore(10)
```

##### updateAIScore(score)
更新AI分数
```javascript
gameState.updateAIScore(8)
```

##### loseLife()
失去一条生命
```javascript
gameState.loseLife()
```

##### resetLives()
重置生命数
```javascript
gameState.resetLives()
```

##### startGameRecord()
开始游戏记录
```javascript
gameState.startGameRecord()
```

##### endGameRecord()
结束游戏记录
```javascript
gameState.endGameRecord()
```

##### createGameRecord()
创建游戏记录
```javascript
const record = gameState.createGameRecord()
```

##### getGameRecords()
获取游戏记录
```javascript
const records = gameState.getGameRecords()
```

##### saveGameRecords()
保存游戏记录到本地存储
```javascript
gameState.saveGameRecords()
```

##### loadGameRecords()
从本地存储加载游戏记录
```javascript
gameState.loadGameRecords()
```

## 🔐 用户认证API

### AuthManager 类

用户认证管理类。

#### 主要方法

##### registerUser(username, password, email)
注册新用户
```javascript
const success = authManager.registerUser('username', 'password', 'email@example.com')
// 返回: boolean
```

##### loginUser(username, password)
用户登录
```javascript
const user = authManager.loginUser('username', 'password')
// 返回: User对象 | null
```

##### logout()
用户登出
```javascript
authManager.logout()
```

##### getCurrentUser()
获取当前用户
```javascript
const user = authManager.getCurrentUser()
// 返回: User对象 | null
```

##### updateUser(userStats)
更新用户数据
```javascript
authManager.updateUser({
  highScore: 150,
  gamesPlayed: 25,
  totalScore: 3000
})
```

##### validateInput(type, value)
验证输入
```javascript
const isValid = authManager.validateInput('username', 'testuser')
// 返回: boolean
```

##### hashPassword(password)
密码哈希
```javascript
const hashedPassword = authManager.hashPassword('password')
// 返回: string
```

## 🔊 音频系统API

### AudioManager 类

音频系统管理类。

#### 主要方法

##### init()
初始化音频系统
```javascript
audioManager.init()
```

##### startBackgroundMusic()
开始播放背景音乐
```javascript
audioManager.startBackgroundMusic()
```

##### stopBackgroundMusic()
停止背景音乐
```javascript
audioManager.stopBackgroundMusic()
```

##### playSound(frequency, duration, type)
播放音效
```javascript
audioManager.playSound(440, 0.3, 'sine')
```

**参数**:
- `frequency` (number): 频率
- `duration` (number): 持续时间
- `type` (string): 波形类型 ('sine' | 'square' | 'sawtooth')

##### toggleMusic()
切换音乐开关
```javascript
audioManager.toggleMusic()
```

##### toggleSound()
切换音效开关
```javascript
audioManager.toggleSound()
```

##### isMusicEnabled()
检查音乐是否开启
```javascript
const enabled = audioManager.isMusicEnabled()
// 返回: boolean
```

##### isSoundEnabled()
检查音效是否开启
```javascript
const enabled = audioManager.isSoundEnabled()
// 返回: boolean
```

## 🖱️ UI管理API

### UIManager 类

用户界面管理类。

#### 主要方法

##### bindEvents(game)
绑定事件处理器
```javascript
uiManager.bindEvents(game)
```

##### updateButtonStates(gameState)
更新按钮状态
```javascript
uiManager.updateButtonStates('playing')
```

##### updateScore(score, aiScore, highScore, lives)
更新分数显示
```javascript
uiManager.updateScore(25, 18, 150, 3)
```

##### updateStatusText(gameState, infiniteMode, lives, score, aiScore, foodCount, isGuest)
更新状态文本
```javascript
uiManager.updateStatusText('playing', true, 3, 25, 18, 4, false)
```

##### updateSpeedDisplay(speed)
更新速度显示
```javascript
uiManager.updateSpeedDisplay(120)
```

##### updateMusicButton(enabled)
更新音乐按钮
```javascript
uiManager.updateMusicButton(true)
```

##### updateSoundButton(enabled)
更新音效按钮
```javascript
uiManager.updateSoundButton(true)
```

##### updateInfiniteButton(enabled)
更新无限循环按钮
```javascript
uiManager.updateInfiniteButton(true)
```

##### setDifficulty(difficulty)
设置难度
```javascript
uiManager.setDifficulty('medium')
```

##### getDifficulty()
获取当前难度
```javascript
const difficulty = uiManager.getDifficulty()
// 返回: 'easy' | 'medium' | 'hard'
```

##### getSpeed()
获取当前速度
```javascript
const speed = uiManager.getSpeed()
// 返回: number
```

##### showGameRecords(game)
显示游戏记录
```javascript
uiManager.showGameRecords(game)
```

##### hideGameRecords()
隐藏游戏记录
```javascript
uiManager.hideGameRecords()
```

##### clearGameRecords(game)
清空游戏记录
```javascript
uiManager.clearGameRecords(game)
```

## 🐍 蛇类API

### Snake 类

玩家蛇类。

#### 构造函数
```javascript
new Snake(x, y, color)
```

**参数**:
- `x` (number): 初始X坐标
- `y` (number): 初始Y坐标
- `color` (string): 蛇的颜色

#### 主要方法

##### move()
移动蛇
```javascript
snake.move()
```

##### setDirection(direction)
设置移动方向
```javascript
snake.setDirection(DIRECTIONS.UP)
```

##### checkCollision(infiniteMode)
检查碰撞
```javascript
const hasCollision = snake.checkCollision(true)
// 返回: boolean
```

##### checkSelfCollision()
检查自身碰撞
```javascript
const hasCollision = snake.checkSelfCollision()
// 返回: boolean
```

##### changeColor()
改变颜色
```javascript
snake.changeColor()
```

##### reset(x, y)
重置蛇的位置
```javascript
snake.reset(10, 10)
```

### AISnake 类

AI蛇类，继承自Snake。

#### 主要方法

##### move(foods)
AI移动逻辑
```javascript
aiSnake.move(foods)
```

**参数**:
- `foods` (Array): 食物数组

##### findNearestFood(foods)
找到最近的食物
```javascript
const nearestFood = aiSnake.findNearestFood(foods)
// 返回: Food对象 | null
```

## 🍎 食物管理API

### FoodManager 类

食物管理类。

#### 主要方法

##### generateFood(playerSnake, aiSnake)
生成食物
```javascript
foodManager.generateFood(playerSnake, aiSnake)
```

##### removeFood(food)
移除食物
```javascript
foodManager.removeFood(food)
```

##### getFoods()
获取食物列表
```javascript
const foods = foodManager.getFoods()
// 返回: Array<Food>
```

##### isPositionValid(x, y, playerSnake, aiSnake)
检查位置是否有效
```javascript
const isValid = foodManager.isPositionValid(10, 10, playerSnake, aiSnake)
// 返回: boolean
```

## 🎨 渲染API

### Renderer 类

渲染器类。

#### 构造函数
```javascript
new Renderer(canvas)
```

**参数**:
- `canvas` (HTMLCanvasElement): Canvas元素

#### 主要方法

##### render(playerSnake, aiSnake, foods, infiniteMode)
渲染游戏画面
```javascript
renderer.render(playerSnake, aiSnake, foods, true)
```

##### clearCanvas()
清空画布
```javascript
renderer.clearCanvas()
```

##### drawGrid()
绘制网格
```javascript
renderer.drawGrid()
```

##### drawSnake(snake)
绘制蛇
```javascript
renderer.drawSnake(snake)
```

##### drawFood(food)
绘制食物
```javascript
renderer.drawFood(food)
```

##### drawBoundaryArrows()
绘制边界箭头
```javascript
renderer.drawBoundaryArrows()
```

## 💾 数据存储API

### localStorage 存储键

#### 用户数据
```javascript
localStorage.setItem('snakeGameUsers', JSON.stringify(users))
localStorage.getItem('snakeGameUsers')
```

#### 会话数据
```javascript
localStorage.setItem('snakeGameSession', JSON.stringify(session))
localStorage.getItem('snakeGameSession')
```

#### 游戏记录
```javascript
localStorage.setItem('snakeGameRecords', JSON.stringify(records))
localStorage.getItem('snakeGameRecords')
```

#### 游客最高分
```javascript
localStorage.setItem('guestHighScore', score.toString())
localStorage.getItem('guestHighScore')
```

#### 游戏最高分
```javascript
localStorage.setItem('snakeHighScore', score.toString())
localStorage.getItem('snakeHighScore')
```

## 📊 数据结构

### User 对象
```javascript
{
  id: string,
  username: string,
  passwordHash: string,
  email: string,
  highScore: number,
  gamesPlayed: number,
  totalScore: number,
  createdAt: string
}
```

### GameRecord 对象
```javascript
{
  id: string,
  startTime: string,
  endTime: string,
  duration: {
    total: number,
    seconds: number,
    formatted: string
  },
  mode: string,
  difficulty: string,
  playerScore: number,
  aiScore: number,
  winner: string,
  livesUsed: number,
  isWin: boolean
}
```

### Food 对象
```javascript
{
  x: number,
  y: number,
  color: string
}
```

## 🎯 常量定义

### 游戏状态
```javascript
const GAME_STATES = {
  NOT_STARTED: 'not_started',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
}
```

### 方向
```javascript
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
}
```

### 难度配置
```javascript
const DIFFICULTY_CONFIG = {
  easy: { baseSpeed: 200, name: '简单' },
  medium: { baseSpeed: 120, name: '中等' },
  hard: { baseSpeed: 80, name: '困难' }
}
```

---

*API文档最后更新: 2024年1月*
