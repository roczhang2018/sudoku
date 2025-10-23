'use strict';

import { SnakeGame } from './game.js';
import { AuthManager } from './auth.js';

// 等待DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  // 检查用户登录状态
  const authManager = new AuthManager();
  const currentUser = authManager.getCurrentUser();
  
  // 初始化游戏（支持游客模式）
  const game = new SnakeGame(authManager, currentUser);
  game.init();
  
  // 绑定登录按钮
  document.getElementById('loginBtn').addEventListener('click', () => {
    window.location.href = 'login.html';
  });
  
  // 绑定登出按钮
  document.getElementById('logoutBtn').addEventListener('click', () => {
    authManager.logout();
    window.location.reload(); // 重新加载页面以更新UI
  });
});
