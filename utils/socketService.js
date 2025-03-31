const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Socket.io服务管理类
 */
class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // 用户ID -> socket
  }

  /**
   * 初始化Socket服务
   * @param {Object} server - HTTP服务器实例
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // 用户认证中间件
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('未提供认证令牌'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (error) {
        logger.error('Socket认证失败', { error: error.message });
        next(new Error('认证失败'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.user.userId;
      
      // 保存用户的socket连接
      this.addUserSocket(userId, socket);
      
      logger.info(`用户连接到聊天服务`, { userId });
      
      // 加入个人频道
      socket.join(`user:${userId}`);
      
      // 监听客户端发送消息
      socket.on('send_message', (data) => {
        // 消息内容由控制器处理，这里只负责通知
        logger.info('收到消息发送事件', { userId, data: { receiverId: data.receiverId } });
      });
      
      // 监听断开连接
      socket.on('disconnect', () => {
        this.removeUserSocket(userId, socket);
        logger.info(`用户断开聊天服务连接`, { userId });
      });
    });
    
    logger.info('Socket.io服务已初始化');
  }
  
  /**
   * 添加用户的socket连接
   * @param {string|number} userId - 用户ID
   * @param {Object} socket - Socket连接
   */
  addUserSocket(userId, socket) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId).push(socket);
  }
  
  /**
   * 移除用户的socket连接
   * @param {string|number} userId - 用户ID
   * @param {Object} socket - Socket连接
   */
  removeUserSocket(userId, socket) {
    if (!this.userSockets.has(userId)) return;
    
    const sockets = this.userSockets.get(userId);
    const index = sockets.indexOf(socket);
    
    if (index !== -1) {
      sockets.splice(index, 1);
    }
    
    if (sockets.length === 0) {
      this.userSockets.delete(userId);
    }
  }
  
  /**
   * 向用户发送新消息通知
   * @param {string|number} userId - 接收消息的用户ID
   * @param {Object} message - 消息内容
   */
  sendNewMessage(userId, message) {
    // 向用户的所有连接发送消息
    this.io?.to(`user:${userId}`).emit('new_message', message);
  }
  
  /**
   * 通知已读状态变更
   * @param {string|number} userId - 发送方用户ID
   * @param {string|number} sessionId - 会话ID
   */
  notifyMessageRead(userId, sessionId) {
    this.io?.to(`user:${userId}`).emit('message_read', { sessionId });
  }
}

// 单例模式
const socketService = new SocketService();
module.exports = socketService; 