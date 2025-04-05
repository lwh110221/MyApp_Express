const redisService = require('./redisService');
const { v4: uuidv4 } = require('uuid');

class ChatSessionService {
  constructor() {
    // 会话过期时间：3天（单位：秒）
    this.sessionExpireTime = 3 * 24 * 60 * 60;
    // 会话最大消息数量
    this.maxMessagesPerSession = 20;
    // Redis键前缀
    this.keyPrefix = 'ai_chat_session:';
  }

  /**
   * 生成会话ID
   * @param {number} userId - 用户ID
   * @returns {string} - 会话ID
   */
  generateSessionId(userId) {
    // 使用用户ID和随机UUID生成唯一会话ID
    return `${userId}_${uuidv4()}`;
  }

  /**
   * 获取会话的Redis键
   * @param {string} sessionId - 会话ID
   * @returns {string} - Redis键
   */
  getSessionKey(sessionId) {
    return `${this.keyPrefix}${sessionId}`;
  }

  /**
   * 创建新会话
   * @param {number} userId - 用户ID
   * @returns {string} - 新会话ID
   */
  async createSession(userId) {
    const sessionId = this.generateSessionId(userId);
    const sessionKey = this.getSessionKey(sessionId);
    
    // 初始会话数据
    const sessionData = {
      userId,
      sessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    // 存储到Redis
    await redisService.set(sessionKey, sessionData, this.sessionExpireTime);
    
    return sessionId;
  }

  /**
   * 获取会话数据
   * @param {string} sessionId - 会话ID
   * @returns {Object|null} - 会话数据或null（如果不存在）
   */
  async getSession(sessionId) {
    const sessionKey = this.getSessionKey(sessionId);
    return await redisService.get(sessionKey);
  }

  /**
   * 添加消息到会话
   * @param {string} sessionId - 会话ID
   * @param {Object} message - 消息对象 {role, content}
   * @returns {boolean} - 操作是否成功
   */
  async addMessage(sessionId, message) {
    const sessionKey = this.getSessionKey(sessionId);
    const session = await redisService.get(sessionKey);
    
    if (!session) {
      console.error('会话不存在:', sessionId);
      return false;
    }

    // 添加新消息
    session.messages.push(message);
    
    // 如果消息超过限制，删除最早的消息
    if (session.messages.length > this.maxMessagesPerSession) {
      // 保留系统消息（如果第一条是系统消息）
      if (session.messages[0].role === 'system') {
        const systemMessage = session.messages[0];
        session.messages = [systemMessage, ...session.messages.slice(-(this.maxMessagesPerSession - 1))];
      } else {
        session.messages = session.messages.slice(-this.maxMessagesPerSession);
      }
    }
    
    // 更新会话时间
    session.updatedAt = new Date().toISOString();
    
    // 保存并刷新过期时间
    return await redisService.set(sessionKey, session, this.sessionExpireTime);
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @returns {boolean} - 操作是否成功
   */
  async deleteSession(sessionId) {
    const sessionKey = this.getSessionKey(sessionId);
    return await redisService.delete(sessionKey);
  }

  /**
   * 获取会话的所有消息
   * @param {string} sessionId - 会话ID
   * @returns {Array|null} - 消息数组或null（如果会话不存在）
   */
  async getMessages(sessionId) {
    const session = await this.getSession(sessionId);
    return session ? session.messages : null;
  }

  /**
   * 清空会话消息但保留会话
   * @param {string} sessionId - 会话ID
   * @returns {boolean} - 操作是否成功
   */
  async clearMessages(sessionId) {
    const sessionKey = this.getSessionKey(sessionId);
    const session = await redisService.get(sessionKey);
    
    if (!session) {
      return false;
    }
    
    // 保留系统消息（如果有）
    let messages = [];
    if (session.messages.length > 0 && session.messages[0].role === 'system') {
      messages = [session.messages[0]];
    }
    
    session.messages = messages;
    session.updatedAt = new Date().toISOString();
    
    return await redisService.set(sessionKey, session, this.sessionExpireTime);
  }

  /**
   * 获取用户的所有会话
   * @param {number} userId - 用户ID
   * @returns {Array} - 用户会话列表
   */
  async getUserSessions(userId) {
    try {
      // 构建查询模式，查找特定用户ID的所有会话
      const pattern = `${this.keyPrefix}${userId}_*`;
      
      // 获取所有匹配的键
      const sessionKeys = await redisService.scan(pattern);
      
      // 获取每个会话的内容并提取基本信息
      const sessionsPromises = sessionKeys.map(async (key) => {
        const session = await redisService.get(key);
        if (session) {
          return {
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            // 可选：添加会话的第一条或最后一条用户消息作为会话标题/预览
            lastMessagePreview: this.getSessionPreview(session.messages)
          };
        }
        return null;
      });
      
      // 等待所有会话数据获取完成
      const sessions = await Promise.all(sessionsPromises);
      
      // 过滤掉null值并按更新时间排序（最新的在前）
      return sessions
        .filter(session => session !== null)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('获取用户会话列表出错:', error);
      return [];
    }
  }
  
  /**
   * 获取会话预览信息（最后一条用户消息的内容）
   * @param {Array} messages - 会话消息数组
   * @returns {string} - 预览文本
   */
  getSessionPreview(messages) {
    if (!messages || messages.length === 0) {
      return '';
    }
    
    // 查找最后一条用户消息
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const content = messages[i].content;
        // 如果消息内容过长，截取一部分作为预览
        return content.length > 30 ? `${content.substring(0, 30)}...` : content;
      }
    }
    
    return '';
  }
}

module.exports = new ChatSessionService(); 