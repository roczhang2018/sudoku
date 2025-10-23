'use strict';

// 游戏配置
export const GRID_WIDTH = 40; // 宽度扩大一倍
export const GRID_HEIGHT = 20; // 高度保持不变
export const CANVAS_WIDTH = 800; // 宽度扩大一倍
export const CANVAS_HEIGHT = 400; // 高度保持不变
export const CELL_SIZE = 20; // 每个格子大小

// 游戏状态
export const GAME_STATES = {
  NOT_STARTED: 'not_started',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

// 方向
export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

// 难度配置
export const DIFFICULTY_CONFIG = {
  easy: { baseSpeed: 200, speedIncrease: 5 },
  medium: { baseSpeed: 150, speedIncrease: 8 },
  hard: { baseSpeed: 120, speedIncrease: 10 }
};

// 蛇身颜色数组
export const SNAKE_COLORS = [
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

// 食物颜色数组
export const FOOD_COLORS = [
  '#FF9800', // 橙色
  '#FF5722', // 红色
  '#4CAF50', // 绿色
  '#2196F3', // 蓝色
  '#9C27B0'  // 紫色
];
