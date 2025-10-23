'use strict';

import { GRID_WIDTH, GRID_HEIGHT, FOOD_COLORS } from './config.js';

// 食物管理类
export class FoodManager {
  constructor() {
    this.foods = [];
  }

  // 生成食物
  generateFood(playerSnake, aiSnake) {
    this.foods = []; // 清空现有食物
    
    // 生成3-5个食物
    const foodCount = Math.floor(Math.random() * 3) + 3; // 3-5个食物
    
    for (let i = 0; i < foodCount; i++) {
      let newFood;
      let attempts = 0;
      const maxAttempts = 100; // 防止无限循环
      
      do {
        newFood = {
          x: Math.floor(Math.random() * GRID_WIDTH),
          y: Math.floor(Math.random() * GRID_HEIGHT),
          id: Date.now() + i, // 给每个食物一个唯一ID
          color: FOOD_COLORS[i % FOOD_COLORS.length] // 分配颜色
        };
        attempts++;
      } while (
        attempts < maxAttempts && (
          // 检查是否与玩家蛇身重叠
          playerSnake.segments.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
          // 检查是否与AI蛇身重叠（如果AI蛇存在）
          (aiSnake && aiSnake.segments.some(segment => segment.x === newFood.x && segment.y === newFood.y)) ||
          // 检查是否与其他食物重叠
          this.foods.some(food => food.x === newFood.x && food.y === newFood.y)
        )
      );
      
      if (attempts < maxAttempts) {
        this.foods.push(newFood);
      }
    }
  }

  // 移除被吃掉的食物
  removeFood(foodIndex) {
    if (foodIndex >= 0 && foodIndex < this.foods.length) {
      this.foods.splice(foodIndex, 1);
    }
  }

  // 检查是否需要生成新食物
  shouldGenerateNewFood() {
    return this.foods.length === 0;
  }

  // 获取所有食物
  getFoods() {
    return this.foods;
  }

  // 获取食物数量
  getFoodCount() {
    return this.foods.length;
  }

  // 清空所有食物
  clearAllFoods() {
    this.foods = [];
  }

  // 检查位置是否有食物
  hasFoodAt(x, y) {
    return this.foods.some(food => food.x === x && food.y === y);
  }

  // 获取指定位置的食物索引
  getFoodIndexAt(x, y) {
    return this.foods.findIndex(food => food.x === x && food.y === y);
  }
}
