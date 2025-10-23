'use strict';

import { SnakeGame } from './game.js';

// 等待DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  const game = new SnakeGame();
  game.init();
});
