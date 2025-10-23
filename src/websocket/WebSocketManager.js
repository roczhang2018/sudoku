'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * WebSocket管理器
 * 处理实时游戏状态同步
 */
class WebSocketManager {
  constructor(io, storageManager, logger) {
    this.io = io;
    this.storageManager = storageManager;
    this.logger = logger;
    this.connectedUsers = new Map(); // userId -> socketId
    this.gameRooms = new Map(); // gameId -> Set of socketIds
    this.socketUsers = new Map(); // socketId -> userId
    
    this.init();
  }

  /**
   * 初始化WebSocket事件监听
   */
  init() {
    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);

      // 用户认证
      socket.on('authenticate', async (data) => {
        await this.handleAuthentication(socket, data);
      });

      // 加入游戏房间
      socket.on('join-game', async (data) => {
        await this.handleJoinGame(socket, data);
      });

      // 离开游戏房间
      socket.on('leave-game', async (data) => {
        await this.handleLeaveGame(socket, data);
      });

      // 游戏状态更新
      socket.on('game-state-update', async (data) => {
        await this.handleGameStateUpdate(socket, data);
      });

      // 游戏操作
      socket.on('game-action', async (data) => {
        await this.handleGameAction(socket, data);
      });

      // 心跳检测
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // 错误处理
      socket.on('error', (error) => {
        this.logger.error(`Socket error for ${socket.id}:`, error);
      });
    });

    // 定期清理过期会话
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  /**
   * 处理用户认证
   */
  async handleAuthentication(socket, data) {
    try {
      const { token } = data;
      
      if (!token) {
        socket.emit('auth-error', { message: 'No token provided' });
        return;
      }

      // 验证token
      const { verifyToken } = require('../middleware/auth');
      const decoded = verifyToken(token);

      // 验证会话
      const session = await this.storageManager.getSession(decoded.sessionId);
      if (!session || new Date(session.expires) < new Date()) {
        socket.emit('auth-error', { message: 'Session expired' });
        return;
      }

      // 获取用户信息
      const user = await this.storageManager.getUser(decoded.userId);
      if (!user) {
        socket.emit('auth-error', { message: 'User not found' });
        return;
      }

      // 保存连接信息
      socket.userId = decoded.userId;
      socket.username = user.username;
      this.connectedUsers.set(decoded.userId, socket.id);
      this.socketUsers.set(socket.id, decoded.userId);

      // 发送认证成功消息
      socket.emit('authenticated', {
        userId: decoded.userId,
        username: user.username
      });

      this.logger.info(`User authenticated: ${user.username} (${socket.id})`);

    } catch (error) {
      this.logger.error('Authentication error:', error);
      socket.emit('auth-error', { message: 'Authentication failed' });
    }
  }

  /**
   * 处理加入游戏房间
   */
  async handleJoinGame(socket, data) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId } = data;
      
      if (!gameId) {
        socket.emit('error', { message: 'Game ID required' });
        return;
      }

      // 验证游戏是否存在且用户有权限
      const gameState = await this.storageManager.getGameState(gameId);
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (gameState.userId !== socket.userId) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // 加入游戏房间
      socket.join(gameId);
      
      // 管理游戏房间
      if (!this.gameRooms.has(gameId)) {
        this.gameRooms.set(gameId, new Set());
      }
      this.gameRooms.get(gameId).add(socket.id);

      // 发送当前游戏状态
      socket.emit('game-state', {
        gameId,
        gameState
      });

      // 通知房间内其他用户
      socket.to(gameId).emit('user-joined', {
        userId: socket.userId,
        username: socket.username
      });

      this.logger.info(`User ${socket.username} joined game ${gameId}`);

    } catch (error) {
      this.logger.error('Join game error:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  }

  /**
   * 处理离开游戏房间
   */
  async handleLeaveGame(socket, data) {
    try {
      const { gameId } = data;
      
      if (gameId) {
        socket.leave(gameId);
        
        // 从游戏房间中移除
        if (this.gameRooms.has(gameId)) {
          this.gameRooms.get(gameId).delete(socket.id);
          if (this.gameRooms.get(gameId).size === 0) {
            this.gameRooms.delete(gameId);
          }
        }

        // 通知房间内其他用户
        socket.to(gameId).emit('user-left', {
          userId: socket.userId,
          username: socket.username
        });

        this.logger.info(`User ${socket.username} left game ${gameId}`);
      }

    } catch (error) {
      this.logger.error('Leave game error:', error);
    }
  }

  /**
   * 处理游戏状态更新
   */
  async handleGameStateUpdate(socket, data) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, gameState } = data;
      
      if (!gameId || !gameState) {
        socket.emit('error', { message: 'Game ID and state required' });
        return;
      }

      // 验证游戏权限
      const existingGame = await this.storageManager.getGameState(gameId);
      if (!existingGame || existingGame.userId !== socket.userId) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // 更新游戏状态
      const updatedGameState = {
        ...existingGame,
        ...gameState,
        userId: socket.userId, // 确保userId不被覆盖
        lastUpdated: new Date().toISOString()
      };

      await this.storageManager.updateGameState(gameId, updatedGameState);

      // 广播给房间内所有用户（包括发送者）
      this.io.to(gameId).emit('game-state-updated', {
        gameId,
        gameState: updatedGameState,
        updatedBy: socket.userId
      });

      this.logger.debug(`Game state updated for ${gameId} by ${socket.username}`);

    } catch (error) {
      this.logger.error('Game state update error:', error);
      socket.emit('error', { message: 'Failed to update game state' });
    }
  }

  /**
   * 处理游戏操作
   */
  async handleGameAction(socket, data) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, action, payload } = data;
      
      if (!gameId || !action) {
        socket.emit('error', { message: 'Game ID and action required' });
        return;
      }

      // 验证游戏权限
      const gameState = await this.storageManager.getGameState(gameId);
      if (!gameState || gameState.userId !== socket.userId) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // 广播游戏操作给房间内其他用户
      socket.to(gameId).emit('game-action', {
        gameId,
        action,
        payload,
        userId: socket.userId,
        username: socket.username
      });

      this.logger.debug(`Game action ${action} for ${gameId} by ${socket.username}`);

    } catch (error) {
      this.logger.error('Game action error:', error);
      socket.emit('error', { message: 'Failed to process game action' });
    }
  }

  /**
   * 处理断开连接
   */
  handleDisconnect(socket) {
    try {
      const userId = this.socketUsers.get(socket.id);
      const username = socket.username;

      if (userId) {
        // 从连接用户列表中移除
        this.connectedUsers.delete(userId);
        this.socketUsers.delete(socket.id);

        // 从所有游戏房间中移除
        for (const [gameId, socketIds] of this.gameRooms.entries()) {
          if (socketIds.has(socket.id)) {
            socketIds.delete(socket.id);
            
            // 通知房间内其他用户
            socket.to(gameId).emit('user-disconnected', {
              userId,
              username
            });

            if (socketIds.size === 0) {
              this.gameRooms.delete(gameId);
            }
          }
        }

        this.logger.info(`User disconnected: ${username} (${socket.id})`);
      } else {
        this.logger.info(`Anonymous client disconnected: ${socket.id}`);
      }

    } catch (error) {
      this.logger.error('Disconnect handling error:', error);
    }
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions() {
    try {
      await this.storageManager.cleanExpiredSessions();
      this.logger.debug('Expired sessions cleaned up');
    } catch (error) {
      this.logger.error('Session cleanup error:', error);
    }
  }

  /**
   * 获取连接统计
   */
  getConnectionStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeGameRooms: this.gameRooms.size,
      totalConnections: this.io.engine.clientsCount
    };
  }

  /**
   * 广播消息给所有连接的用户
   */
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  /**
   * 发送消息给特定用户
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * 发送消息给游戏房间
   */
  sendToGameRoom(gameId, event, data) {
    this.io.to(gameId).emit(event, data);
  }
}

module.exports = WebSocketManager;
