'use strict';

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * 文件存储管理器
 * 负责所有数据的文件存储操作
 */
class FileStorageManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.cache = new Map(); // 内存缓存
    this.cacheTTL = 5 * 60 * 1000; // 5分钟TTL
    this.init();
  }

  /**
   * 初始化存储目录
   */
  async init() {
    const dirs = ['users', 'games', 'sessions', 'records'];
    for (const dir of dirs) {
      const dirPath = path.join(this.dataDir, dir);
      try {
        await fs.access(dirPath);
      } catch {
        await fs.mkdir(dirPath, { recursive: true });
      }
    }
  }

  /**
   * 生成文件路径
   */
  getFilePath(type, id) {
    return path.join(this.dataDir, type, `${id}.json`);
  }

  /**
   * 写入文件
   */
  async writeFile(filePath, data) {
    const tempPath = `${filePath}.tmp`;
    try {
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // 清理临时文件
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw error;
    }
  }

  /**
   * 读取文件
   */
  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * 缓存管理
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  // ==================== 用户数据管理 ====================

  /**
   * 保存用户数据
   */
  async saveUser(userData) {
    const userId = userData.id || uuidv4();
    const user = { ...userData, id: userId, updatedAt: new Date().toISOString() };
    const filePath = this.getFilePath('users', userId);
    
    await this.writeFile(filePath, user);
    this.setCache(`user:${userId}`, user);
    
    return user;
  }

  /**
   * 获取用户数据
   */
  async getUser(userId) {
    const cacheKey = `user:${userId}`;
    let user = this.getCache(cacheKey);
    
    if (!user) {
      const filePath = this.getFilePath('users', userId);
      user = await this.readFile(filePath);
      if (user) {
        this.setCache(cacheKey, user);
      }
    }
    
    return user;
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username) {
    const usersDir = path.join(this.dataDir, 'users');
    const files = await fs.readdir(usersDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(usersDir, file);
        const user = await this.readFile(filePath);
        if (user && user.username === username) {
          return user;
        }
      }
    }
    
    return null;
  }

  /**
   * 更新用户数据
   */
  async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    const filePath = this.getFilePath('users', userId);
    
    await this.writeFile(filePath, updatedUser);
    this.setCache(`user:${userId}`, updatedUser);
    
    return updatedUser;
  }

  /**
   * 删除用户
   */
  async deleteUser(userId) {
    const filePath = this.getFilePath('users', userId);
    await this.deleteFile(filePath);
    this.cache.delete(`user:${userId}`);
  }

  // ==================== 游戏状态管理 ====================

  /**
   * 保存游戏状态
   */
  async saveGameState(gameId, gameData) {
    const game = { 
      ...gameData, 
      id: gameId, 
      lastUpdated: new Date().toISOString() 
    };
    const filePath = this.getFilePath('games', gameId);
    
    await this.writeFile(filePath, game);
    this.setCache(`game:${gameId}`, game);
    
    return game;
  }

  /**
   * 获取游戏状态
   */
  async getGameState(gameId) {
    const cacheKey = `game:${gameId}`;
    let game = this.getCache(cacheKey);
    
    if (!game) {
      const filePath = this.getFilePath('games', gameId);
      game = await this.readFile(filePath);
      if (game) {
        this.setCache(cacheKey, game);
      }
    }
    
    return game;
  }

  /**
   * 更新游戏状态
   */
  async updateGameState(gameId, updates) {
    const game = await this.getGameState(gameId);
    if (!game) {
      throw new Error('Game not found');
    }
    
    const updatedGame = { ...game, ...updates, lastUpdated: new Date().toISOString() };
    const filePath = this.getFilePath('games', gameId);
    
    await this.writeFile(filePath, updatedGame);
    this.setCache(`game:${gameId}`, updatedGame);
    
    return updatedGame;
  }

  /**
   * 删除游戏状态
   */
  async deleteGameState(gameId) {
    const filePath = this.getFilePath('games', gameId);
    await this.deleteFile(filePath);
    this.cache.delete(`game:${gameId}`);
  }

  /**
   * 获取用户的所有游戏
   */
  async getUserGames(userId) {
    const gamesDir = path.join(this.dataDir, 'games');
    const files = await fs.readdir(gamesDir);
    const games = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(gamesDir, file);
        const game = await this.readFile(filePath);
        if (game && game.userId === userId) {
          games.push(game);
        }
      }
    }
    
    return games.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }

  // ==================== 会话管理 ====================

  /**
   * 保存会话数据
   */
  async saveSession(sessionId, sessionData) {
    const session = { 
      ...sessionData, 
      id: sessionId, 
      createdAt: new Date().toISOString() 
    };
    const filePath = this.getFilePath('sessions', sessionId);
    
    await this.writeFile(filePath, session);
    this.setCache(`session:${sessionId}`, session);
    
    return session;
  }

  /**
   * 获取会话数据
   */
  async getSession(sessionId) {
    const cacheKey = `session:${sessionId}`;
    let session = this.getCache(cacheKey);
    
    if (!session) {
      const filePath = this.getFilePath('sessions', sessionId);
      session = await this.readFile(filePath);
      if (session) {
        this.setCache(cacheKey, session);
      }
    }
    
    return session;
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId) {
    const filePath = this.getFilePath('sessions', sessionId);
    await this.deleteFile(filePath);
    this.cache.delete(`session:${sessionId}`);
  }

  /**
   * 清理过期会话
   */
  async cleanExpiredSessions() {
    const sessionsDir = path.join(this.dataDir, 'sessions');
    const files = await fs.readdir(sessionsDir);
    const now = Date.now();
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(sessionsDir, file);
        const session = await this.readFile(filePath);
        
        if (session && session.expires && new Date(session.expires).getTime() < now) {
          await this.deleteFile(filePath);
          this.cache.delete(`session:${session.id}`);
        }
      }
    }
  }

  // ==================== 游戏记录管理 ====================

  /**
   * 保存游戏记录
   */
  async saveGameRecord(userId, record) {
    const recordsFile = this.getFilePath('records', userId);
    let records = await this.readFile(recordsFile) || [];
    
    const newRecord = {
      ...record,
      id: record.id || uuidv4(),
      userId,
      createdAt: new Date().toISOString()
    };
    
    records.unshift(newRecord); // 添加到开头
    
    // 只保留最近50条记录
    if (records.length > 50) {
      records = records.slice(0, 50);
    }
    
    await this.writeFile(recordsFile, records);
    this.setCache(`records:${userId}`, records);
    
    return newRecord;
  }

  /**
   * 获取用户游戏记录
   */
  async getGameRecords(userId) {
    const cacheKey = `records:${userId}`;
    let records = this.getCache(cacheKey);
    
    if (!records) {
      const recordsFile = this.getFilePath('records', userId);
      records = await this.readFile(recordsFile) || [];
      this.setCache(cacheKey, records);
    }
    
    return records;
  }

  /**
   * 清空用户游戏记录
   */
  async clearGameRecords(userId) {
    const recordsFile = this.getFilePath('records', userId);
    await this.writeFile(recordsFile, []);
    this.setCache(`records:${userId}`, []);
  }

  // ==================== 工具方法 ====================

  /**
   * 获取所有文件列表
   */
  async listFiles(type) {
    const dirPath = path.join(this.dataDir, type);
    try {
      const files = await fs.readdir(dirPath);
      return files.filter(file => file.endsWith('.json'));
    } catch {
      return [];
    }
  }

  /**
   * 备份数据
   */
  async backupData(backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    await fs.mkdir(backupPath, { recursive: true });
    
    const types = ['users', 'games', 'sessions', 'records'];
    for (const type of types) {
      const sourceDir = path.join(this.dataDir, type);
      const targetDir = path.join(backupPath, type);
      
      try {
        await fs.mkdir(targetDir, { recursive: true });
        const files = await fs.readdir(sourceDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const sourceFile = path.join(sourceDir, file);
            const targetFile = path.join(targetDir, file);
            await fs.copyFile(sourceFile, targetFile);
          }
        }
      } catch (error) {
        console.warn(`Failed to backup ${type}:`, error.message);
      }
    }
    
    return backupPath;
  }

  /**
   * 清理缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = FileStorageManager;
