'use strict';

import { DIRECTIONS, GRID_WIDTH, GRID_HEIGHT } from './config.js';

// 蛇类
export class Snake {
  constructor(x, y, color = '#4CAF50') {
    this.segments = [{ x, y }];
    this.direction = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
    this.color = color;
  }

  // 获取蛇头
  getHead() {
    return this.segments[0];
  }

  // 设置方向
  setDirection(newDirection) {
    // 防止反向移动
    if (newDirection.x === -this.direction.x && newDirection.y === -this.direction.y) {
      return;
    }
    this.nextDirection = newDirection;
  }

  // 更新方向
  updateDirection() {
    this.direction = this.nextDirection;
  }

  // 移动蛇
  move(infiniteMode = true) {
    this.updateDirection();
    
    const head = { ...this.getHead() };
    head.x += this.direction.x;
    head.y += this.direction.y;
    
    // 根据无限循环模式处理边界
    if (infiniteMode) {
      if (head.x < 0) {
        head.x = GRID_WIDTH - 1;
      } else if (head.x >= GRID_WIDTH) {
        head.x = 0;
      }
      
      if (head.y < 0) {
        head.y = GRID_HEIGHT - 1;
      } else if (head.y >= GRID_HEIGHT) {
        head.y = 0;
      }
    }
    
    this.segments.unshift(head);
    return head;
  }

  // 移除尾部
  removeTail() {
    return this.segments.pop();
  }

  // 检查自身碰撞
  checkSelfCollision(head) {
    // 跳过第一个元素（刚添加的新头部），只检查身体部分
    return this.segments.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
  }

  // 检查边界碰撞（经典模式）
  checkWallCollision(head) {
    return head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT;
  }

  // 检查是否吃到食物
  checkFoodCollision(foods) {
    const head = this.getHead();
    return foods.findIndex(food => food.x === head.x && food.y === head.y);
  }

  // 重置蛇的位置
  reset(x, y) {
    this.segments = [{ x, y }];
    this.direction = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
  }

  // 获取蛇的长度
  getLength() {
    return this.segments.length;
  }
}

// AI蛇类
export class AISnake extends Snake {
  constructor(x, y, color = '#FF5722') {
    super(x, y, color);
  }

  // AI移动逻辑
  moveAI(foods, infiniteMode = true) {
    if (foods.length === 0) return null; // 没有食物时不动
    
    const currentHead = this.getHead();
    
    // 找到最近的食物
    let nearestFood = null;
    let minDistance = Infinity;
    
    foods.forEach(food => {
      const distance = Math.abs(food.x - currentHead.x) + Math.abs(food.y - currentHead.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestFood = food;
      }
    });
    
    if (!nearestFood) return null;
    
    const dx = nearestFood.x - currentHead.x;
    const dy = nearestFood.y - currentHead.y;
    
    // 选择移动方向
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平移动
      if (dx > 0 && this.direction !== DIRECTIONS.LEFT) {
        this.setDirection(DIRECTIONS.RIGHT);
      } else if (dx < 0 && this.direction !== DIRECTIONS.RIGHT) {
        this.setDirection(DIRECTIONS.LEFT);
      }
    } else {
      // 垂直移动
      if (dy > 0 && this.direction !== DIRECTIONS.UP) {
        this.setDirection(DIRECTIONS.DOWN);
      } else if (dy < 0 && this.direction !== DIRECTIONS.DOWN) {
        this.setDirection(DIRECTIONS.UP);
      }
    }
    
    // 移动蛇
    const newHead = this.move(infiniteMode);
    
    // 检查AI自身碰撞
    if (this.checkSelfCollision(newHead)) {
      this.reset(30, 10); // 重置AI蛇位置
      return null;
    }
    
    // 检查是否吃到食物
    const eatenFoodIndex = this.checkFoodCollision(foods);
    if (eatenFoodIndex !== -1) {
      return { type: 'eat', foodIndex: eatenFoodIndex };
    } else {
      this.removeTail();
      return { type: 'move' };
    }
  }
}

// 颜色工具函数
export function darkenColor(color, amount) {
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
