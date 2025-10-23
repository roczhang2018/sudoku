'use strict';

/**
 * API客户端
 * 负责与后端REST API的通信
 */
export class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('snakeGameToken');
  }

  /**
   * 设置认证token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('snakeGameToken', token);
    } else {
      localStorage.removeItem('snakeGameToken');
    }
  }

  /**
   * 获取认证token
   */
  getToken() {
    return this.token;
  }

  /**
   * 发送HTTP请求
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // 添加认证token
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ==================== 认证API ====================

  /**
   * 用户注册
   */
  async register(username, email, password) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * 用户登录
   */
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  /**
   * 用户登出
   */
  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST'
      });
    } finally {
      this.setToken(null);
    }
  }

  /**
   * 验证token
   */
  async verifyToken() {
    if (!this.token) {
      throw new Error('No token available');
    }

    return await this.request('/api/auth/verify');
  }

  /**
   * 刷新token
   */
  async refreshToken() {
    if (!this.token) {
      throw new Error('No token available');
    }

    const data = await this.request('/api/auth/refresh', {
      method: 'POST'
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  // ==================== 游戏API ====================

  /**
   * 创建新游戏
   */
  async createGame() {
    return await this.request('/api/game/create', {
      method: 'POST'
    });
  }

  /**
   * 获取游戏状态
   */
  async getGameState(gameId) {
    return await this.request(`/api/game/${gameId}`);
  }

  /**
   * 更新游戏状态
   */
  async updateGameState(gameId, gameState) {
    return await this.request(`/api/game/${gameId}`, {
      method: 'PUT',
      body: JSON.stringify(gameState)
    });
  }

  /**
   * 删除游戏
   */
  async deleteGame(gameId) {
    return await this.request(`/api/game/${gameId}`, {
      method: 'DELETE'
    });
  }

  /**
   * 获取用户的所有游戏
   */
  async getUserGames(limit = 10, offset = 0) {
    return await this.request(`/api/game?limit=${limit}&offset=${offset}`);
  }

  /**
   * 保存游戏记录
   */
  async saveGameRecord(gameId, record) {
    return await this.request(`/api/game/${gameId}/record`, {
      method: 'POST',
      body: JSON.stringify(record)
    });
  }

  /**
   * 获取游戏记录
   */
  async getGameRecords(gameId) {
    return await this.request(`/api/game/${gameId}/records`);
  }

  // ==================== 用户API ====================

  /**
   * 获取用户信息
   */
  async getUserProfile() {
    return await this.request('/api/user/profile');
  }

  /**
   * 更新用户信息
   */
  async updateUserProfile(updates) {
    return await this.request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * 获取用户游戏记录
   */
  async getUserRecords(limit = 50, offset = 0) {
    return await this.request(`/api/user/records?limit=${limit}&offset=${offset}`);
  }

  /**
   * 清空用户游戏记录
   */
  async clearUserRecords() {
    return await this.request('/api/user/records', {
      method: 'DELETE'
    });
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats() {
    return await this.request('/api/user/stats');
  }

  /**
   * 获取用户活跃游戏
   */
  async getActiveGames() {
    return await this.request('/api/user/active-games');
  }

  /**
   * 删除用户账户
   */
  async deleteAccount() {
    const data = await this.request('/api/user/account', {
      method: 'DELETE'
    });
    
    this.setToken(null);
    return data;
  }

  // ==================== 工具方法 ====================

  /**
   * 检查服务器健康状态
   */
  async checkHealth() {
    try {
      return await this.request('/health');
    } catch (error) {
      throw new Error('Server is not available');
    }
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * 获取基础URL
   */
  getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * 设置基础URL
   */
  setBaseUrl(url) {
    this.baseUrl = url;
  }
}
