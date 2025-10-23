# 贪吃蛇游戏前端

贪吃蛇游戏的前端实现，基于原生JavaScript和HTML5 Canvas。

## 🎮 游戏特色

- **双蛇对战**: 玩家蛇（绿色）vs AI蛇（红色）
- **生命系统**: 每轮游戏3条生命
- **多食物机制**: 棋盘上同时存在3-5个食物
- **智能AI**: AI蛇会智能选择最近的食物
- **音效系统**: 背景音乐和游戏音效
- **用户系统**: 支持注册登录和游戏记录
- **实时同步**: 支持跨设备游戏状态同步

## 🚀 快速开始

### 方法一：直接打开
直接用浏览器打开 `index.html` 即可。

### 方法二：本地服务器（推荐）
```bash
# 启动本地服务器
python3 -m http.server 8000

# 在浏览器中访问
http://localhost:8000
```

## 📁 项目结构

```
frontend/
├── index.html              # 游戏主页面
├── login.html              # 登录页面
├── style.css               # 游戏样式
├── auth.css                # 登录页面样式
├── favicon.svg             # 网站图标
├── js/                     # JavaScript模块
│   ├── main.js            # 入口文件
│   ├── game.js            # 主游戏逻辑
│   ├── gameState.js       # 游戏状态管理
│   ├── auth.js            # 用户认证（本地）
│   ├── auth-backend.js    # 用户认证（后端集成）
│   ├── audio.js           # 音频系统
│   ├── snake.js           # 蛇逻辑
│   ├── food.js            # 食物管理
│   ├── renderer.js        # 渲染系统
│   ├── ui.js              # UI控制
│   ├── websocket.js       # WebSocket客户端
│   ├── api.js             # API客户端
│   └── config.js          # 配置常量
└── doc/                    # 前端文档
    ├── README.md          # 文档索引
    ├── user-guide.md      # 用户使用指南
    └── development-guide.md # 开发指南
```

## 🎯 操作说明

### 键盘控制
- **方向键**: 控制玩家蛇移动
- **空格键**: 暂停/继续游戏

### 鼠标操作
- **开始游戏**: 开始新游戏
- **暂停**: 暂停当前游戏
- **重新开始**: 重置游戏状态
- **难度选择**: 简单/中等/困难
- **速度滑块**: 调整游戏速度
- **音乐开关**: 控制背景音乐
- **音效开关**: 控制游戏音效
- **无限循环开关**: 切换游戏模式
- **游戏记录**: 查看历史记录

## 🏆 游戏规则

1. **目标**: 与AI蛇竞争，尽可能多吃食物获得高分
2. **生命**: 每轮游戏有3条生命，碰撞后失去一条生命
3. **食物**: 棋盘上同时存在3-5个食物，全部吃完后重新分配
4. **碰撞**:
   - 无限循环模式：只检查自身碰撞
   - 经典模式：检查边界碰撞和自身碰撞
5. **AI**: AI蛇会智能选择最近的食物进行移动

## 🛠️ 技术特点

- **零依赖**: 纯原生JavaScript，无需任何框架
- **模块化**: 使用ES6模块系统，代码结构清晰
- **面向对象**: 使用类来组织代码，提高可维护性
- **响应式**: 适配不同屏幕尺寸
- **Web Audio API**: 程序化生成音乐和音效
- **Canvas渲染**: 流畅的游戏画面
- **实时同步**: WebSocket支持跨设备同步

## 🔌 后端集成

前端支持与后端服务的集成：

- **用户认证**: 支持后端用户系统
- **实时同步**: WebSocket实时游戏状态同步
- **数据持久化**: 游戏状态自动保存和恢复
- **跨设备访问**: 多设备间无缝切换

### 启用后端集成

1. 启动后端服务（参考 `../backend/README.md`）
2. 前端会自动检测后端服务可用性
3. 如果后端不可用，会自动回退到本地存储模式

## 📚 文档

- **用户使用指南**: [doc/user-guide.md](./doc/user-guide.md)
- **开发指南**: [doc/development-guide.md](./doc/development-guide.md)
- **后端设置**: [../backend/BACKEND_SETUP.md](../backend/BACKEND_SETUP.md)

## 🎨 自定义

### 修改游戏配置
编辑 `js/config.js` 文件：

```javascript
// 网格大小
export const GRID_SIZE = 20;

// 画布尺寸
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;

// 难度配置
export const DIFFICULTY_CONFIG = {
  easy: { baseSpeed: 200, name: '简单' },
  medium: { baseSpeed: 120, name: '中等' },
  hard: { baseSpeed: 80, name: '困难' }
};
```

### 添加新功能
1. 在相应的模块文件中添加功能
2. 更新UI界面（如需要）
3. 添加事件处理
4. 更新文档

## 🐛 故障排除

### 常见问题

1. **游戏无法启动**
   - 检查浏览器控制台错误
   - 确认JavaScript已启用
   - 检查文件路径是否正确

2. **音效没有声音**
   - 检查浏览器音量设置
   - 确认音效开关已开启
   - 检查浏览器音频权限

3. **WebSocket连接失败**
   - 确认后端服务正在运行
   - 检查网络连接
   - 查看浏览器控制台错误信息

## 📝 开发说明

### 代码结构
项目采用模块化设计，每个文件都有明确的职责：

- `main.js` - 应用程序入口
- `game.js` - 主游戏逻辑协调
- `gameState.js` - 游戏状态管理
- `snake.js` - 蛇的移动和AI逻辑
- `food.js` - 食物生成和管理
- `renderer.js` - Canvas渲染
- `ui.js` - 用户界面控制
- `audio.js` - 音频系统
- `auth.js` - 本地用户认证
- `auth-backend.js` - 后端集成认证
- `websocket.js` - WebSocket客户端
- `api.js` - REST API客户端

### 扩展建议
- 添加更多游戏模式
- 实现多人对战
- 添加更多音效和视觉效果
- 支持自定义地图
- 添加成就系统

## 📄 许可证

MIT License
