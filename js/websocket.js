'use strict';

/**
 * WebSocket客户端管理器
 * 负责与后端服务器的实时通信
 */
export class WebSocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.heartbeatInterval = null;
    this.eventHandlers = new Map();
    this.gameId = null;
    this.userId = null;
    this.username = null;
  }

  /**
   * 连接到WebSocket服务器
   */
  connect(serverUrl = 'http://localhost:3000') {
    try {
      // 导入Socket.IO客户端
      import('https://cdn.socket.io/4.7.4/socket.io.esm.min.js').then(({ io }) => {
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true
        });

        this.setupEventListeners();
        this.startHeartbeat();
      }).catch(error => {
        console.error('Failed to load Socket.IO client:', error);
        this.handleConnectionError('Failed to load Socket.IO client');
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError(error.message);
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (!this.socket) return;

    // 连接成功
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket.id });
    });

    // 连接断开
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要重新连接
        this.attemptReconnect();
      }
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError(error.message);
    });

    // 认证成功
    this.socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
      this.userId = data.userId;
      this.username = data.username;
      this.emit('authenticated', data);
    });

    // 认证失败
    this.socket.on('auth-error', (error) => {
      console.error('WebSocket authentication error:', error);
      this.emit('auth-error', error);
    });

    // 游戏状态更新
    this.socket.on('game-state-updated', (data) => {
      console.log('Game state updated:', data);
      this.emit('game-state-updated', data);
    });

    // 游戏操作
    this.socket.on('game-action', (data) => {
      console.log('Game action received:', data);
      this.emit('game-action', data);
    });

    // 用户加入游戏
    this.socket.on('user-joined', (data) => {
      console.log('User joined game:', data);
      this.emit('user-joined', data);
    });

    // 用户离开游戏
    this.socket.on('user-left', (data) => {
      console.log('User left game:', data);
      this.emit('user-left', data);
    });

    // 用户断开连接
    this.socket.on('user-disconnected', (data) => {
      console.log('User disconnected:', data);
      this.emit('user-disconnected', data);
    });

    // 心跳响应
    this.socket.on('pong', () => {
      // 心跳正常
    });

    // 错误处理
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * 认证
   */
  authenticate(token) {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket not connected');
      return false;
    }

    this.socket.emit('authenticate', { token });
    return true;
  }

  /**
   * 加入游戏房间
   */
  joinGame(gameId) {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket not connected');
      return false;
    }

    this.gameId = gameId;
    this.socket.emit('join-game', { gameId });
    return true;
  }

  /**
   * 离开游戏房间
   */
  leaveGame(gameId = null) {
    if (!this.socket || !this.isConnected) {
      return false;
    }

    const targetGameId = gameId || this.gameId;
    if (targetGameId) {
      this.socket.emit('leave-game', { gameId: targetGameId });
      if (targetGameId === this.gameId) {
        this.gameId = null;
      }
    }
    return true;
  }

  /**
   * 发送游戏状态更新
   */
  updateGameState(gameId, gameState) {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket not connected');
      return false;
    }

    this.socket.emit('game-state-update', {
      gameId,
      gameState
    });
    return true;
  }

  /**
   * 发送游戏操作
   */
  sendGameAction(gameId, action, payload) {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket not connected');
      return false;
    }

    this.socket.emit('game-action', {
      gameId,
      action,
      payload
    });
    return true;
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.gameId = null;
    this.userId = null;
    this.username = null;
  }

  /**
   * 开始心跳检测
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000); // 每30秒发送一次心跳
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, this.reconnectInterval);
  }

  /**
   * 处理连接错误
   */
  handleConnectionError(message) {
    this.isConnected = false;
    this.emit('connection-error', { message });
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  /**
   * 添加事件监听器
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * 移除事件监听器
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      userId: this.userId,
      username: this.username,
      gameId: this.gameId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
