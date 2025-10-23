'use strict';

import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, GRID_WIDTH, GRID_HEIGHT } from './config.js';
import { darkenColor } from './snake.js';

// 渲染器类
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // 清空画布
  clear() {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // 绘制网格
  drawGrid() {
    this.ctx.strokeStyle = '#f0f0f0';
    this.ctx.lineWidth = 1;
    
    // 绘制垂直网格线
    for (let i = 0; i <= GRID_WIDTH; i++) {
      const pos = i * CELL_SIZE;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    
    // 绘制水平网格线
    for (let i = 0; i <= GRID_HEIGHT; i++) {
      const pos = i * CELL_SIZE;
      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(CANVAS_WIDTH, pos);
      this.ctx.stroke();
    }
  }

  // 绘制循环边界指示箭头
  drawInfiniteModeArrows() {
    this.ctx.strokeStyle = '#4CAF50';
    this.ctx.lineWidth = 3;
    this.ctx.fillStyle = '#4CAF50';
    
    // 左右边界箭头
    const arrowSize = 8;
    for (let i = 0; i < GRID_HEIGHT; i += 4) {
      const y = i * CELL_SIZE + CELL_SIZE / 2;
      
      // 左边界箭头 (→)
      this.ctx.beginPath();
      this.ctx.moveTo(5, y);
      this.ctx.lineTo(5 + arrowSize, y - arrowSize/2);
      this.ctx.lineTo(5 + arrowSize, y + arrowSize/2);
      this.ctx.closePath();
      this.ctx.fill();
      
      // 右边界箭头 (←)
      this.ctx.beginPath();
      this.ctx.moveTo(CANVAS_WIDTH - 5, y);
      this.ctx.lineTo(CANVAS_WIDTH - 5 - arrowSize, y - arrowSize/2);
      this.ctx.lineTo(CANVAS_WIDTH - 5 - arrowSize, y + arrowSize/2);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    // 上下边界箭头
    for (let i = 0; i < GRID_WIDTH; i += 8) {
      const x = i * CELL_SIZE + CELL_SIZE / 2;
      
      // 上边界箭头 (↓)
      this.ctx.beginPath();
      this.ctx.moveTo(x, 5);
      this.ctx.lineTo(x - arrowSize/2, 5 + arrowSize);
      this.ctx.lineTo(x + arrowSize/2, 5 + arrowSize);
      this.ctx.closePath();
      this.ctx.fill();
      
      // 下边界箭头 (↑)
      this.ctx.beginPath();
      this.ctx.moveTo(x, CANVAS_HEIGHT - 5);
      this.ctx.lineTo(x - arrowSize/2, CANVAS_HEIGHT - 5 - arrowSize);
      this.ctx.lineTo(x + arrowSize/2, CANVAS_HEIGHT - 5 - arrowSize);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  // 绘制蛇
  drawSnake(snake, color) {
    snake.segments.forEach((segment, index) => {
      if (index === 0) {
        // 蛇头 - 使用更深的颜色
        const headColor = darkenColor(color, 0.3);
        this.ctx.fillStyle = headColor;
      } else {
        // 蛇身 - 使用当前颜色
        this.ctx.fillStyle = color;
      }
      
      this.ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });
  }

  // 绘制食物
  drawFoods(foods) {
    foods.forEach((food) => {
      this.ctx.fillStyle = food.color;
      this.ctx.fillRect(
        food.x * CELL_SIZE + 2,
        food.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      );
    });
  }

  // 渲染整个游戏画面
  render(playerSnake, aiSnake, foods, infiniteMode) {
    // 清空画布
    this.clear();
    
    // 绘制网格
    this.drawGrid();
    
    // 只在无限循环模式下绘制循环边界指示箭头
    if (infiniteMode) {
      this.drawInfiniteModeArrows();
    }
    
    // 绘制玩家蛇
    this.drawSnake(playerSnake, playerSnake.color);
    
    // 只在无限循环模式下绘制AI蛇
    if (aiSnake) {
      this.drawSnake(aiSnake, aiSnake.color);
    }
    
    // 绘制食物
    this.drawFoods(foods);
  }
}
