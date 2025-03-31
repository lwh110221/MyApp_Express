const BaseController = require('./baseController');
const DbUtil = require('../utils/dbUtil');
const { NotFoundError } = require('../utils/errors');
const socketService = require('../utils/socketService');

/**
 * 聊天功能控制器
 */
class ChatController extends BaseController {
  /**
   * 获取用户的聊天会话列表
   */
  getSessionList = this.catchAsync(async (req, res) => {
    const userId = req.userData.userId;
    
    const sql = `
      SELECT cs.*, 
             u1.username as user1_name, up1.profile_picture as user1_avatar,
             u2.username as user2_name, up2.profile_picture as user2_avatar,
             uc.unread_count
      FROM chat_sessions cs
      LEFT JOIN users u1 ON cs.user1_id = u1.id
      LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
      LEFT JOIN users u2 ON cs.user2_id = u2.id
      LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
      LEFT JOIN chat_unread_counts uc ON uc.session_id = cs.id AND uc.user_id = ?
      WHERE cs.user1_id = ? OR cs.user2_id = ?
      ORDER BY cs.last_time DESC
    `;
    
    const sessions = await DbUtil.query(sql, [userId, userId, userId]);
    
    // 处理返回的数据，确保每个会话显示的是对方的信息
    const formattedSessions = sessions.map(session => {
      const isUser1 = session.user1_id === userId;
      return {
        sessionId: session.id,
        partnerId: isUser1 ? session.user2_id : session.user1_id,
        partnerName: isUser1 ? session.user2_name : session.user1_name,
        partnerAvatar: isUser1 ? session.user2_avatar : session.user1_avatar,
        lastMessage: session.last_message,
        lastTime: session.last_time,
        unreadCount: session.unread_count || 0
      };
    });
    
    this.success(res, formattedSessions, '获取聊天会话列表成功');
  });
  
  /**
   * 获取与指定用户的聊天记录
   */
  getChatHistory = this.catchAsync(async (req, res) => {
    const userId = req.userData.userId;
    const partnerId = Number(req.params.partnerId);
    const { page = 1, limit = 20 } = req.query;
    
    // 确保查询的是与自己相关的会话
    const sessionSql = `
      SELECT id FROM chat_sessions
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `;
    
    const sessions = await DbUtil.query(sessionSql, [userId, partnerId, partnerId, userId]);
    
    // 如果会话不存在，则创建一个新会话
    let sessionId;
    if (sessions.length === 0) {
      // 创建新会话
      const newSession = await DbUtil.query(
        'INSERT INTO chat_sessions (user1_id, user2_id) VALUES (?, ?)',
        [Math.min(userId, partnerId), Math.max(userId, partnerId)]
      );
      sessionId = newSession.insertId;
    } else {
      sessionId = sessions[0].id;
    }
    
    // 查询聊天记录，分页获取
    const offset = (page - 1) * limit;
    const messageSql = `
      SELECT 
        cm.*,
        u.username as sender_name,
        up.profile_picture as sender_avatar
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cm.session_id = ?
      ORDER BY cm.send_time DESC
      LIMIT ? OFFSET ?
    `;
    
    const messages = await DbUtil.query(messageSql, [sessionId, Number(limit), offset]);
    
    // 查询消息总数
    const totalSql = 'SELECT COUNT(*) as total FROM chat_messages WHERE session_id = ?';
    const totalResult = await DbUtil.query(totalSql, [sessionId]);
    const total = totalResult[0].total;
    
    // 将未读消息标记为已读
    await DbUtil.query(`
      UPDATE chat_messages 
      SET is_read = 1, read_time = NOW() 
      WHERE session_id = ? AND receiver_id = ? AND is_read = 0
    `, [sessionId, userId]);
    
    // 更新未读消息计数
    await DbUtil.query(`
      INSERT INTO chat_unread_counts (user_id, session_id, unread_count, last_read_time) 
      VALUES (?, ?, 0, NOW())
      ON DUPLICATE KEY UPDATE unread_count = 0, last_read_time = NOW()
    `, [userId, sessionId]);
    
    // 通知发送者消息已读
    socketService.notifyMessageRead(partnerId, sessionId);
    
    this.paginate(res, messages, total, page, limit);
  });
  
  /**
   * 发送消息
   */
  sendMessage = this.catchAsync(async (req, res) => {
    const senderId = req.userData.userId;
    const { receiverId, content, contentType = 0, mediaUrl = null } = req.body;
    
    // 只允许文本和图片类型
    if (contentType !== 0 && contentType !== 1) {
      return this.error('不支持的消息类型，目前只支持文本和图片', 400);
    }
    
    if (!content && !mediaUrl) {
      return this.error('消息内容不能为空', 400);
    }
    
    // 查找或创建会话
    let sessionId;
    const sessionSql = `
      SELECT id FROM chat_sessions
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `;
    
    const sessions = await DbUtil.query(sessionSql, [
      senderId, receiverId, 
      receiverId, senderId
    ]);
    
    if (sessions.length === 0) {
      // 创建新会话
      const newSession = await DbUtil.query(
        'INSERT INTO chat_sessions (user1_id, user2_id) VALUES (?, ?)',
        [Math.min(senderId, receiverId), Math.max(senderId, receiverId)]
      );
      sessionId = newSession.insertId;
    } else {
      sessionId = sessions[0].id;
    }
    
    // 事务处理
    await DbUtil.transaction(async (connection) => {
      // 插入消息
      const [messageResult] = await connection.query(`
        INSERT INTO chat_messages 
        (session_id, sender_id, receiver_id, content, content_type, media_url) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [sessionId, senderId, receiverId, content, contentType, mediaUrl]);
      
      const messageId = messageResult.insertId;
      
      // 更新会话的最后消息和时间
      await connection.query(`
        UPDATE chat_sessions 
        SET last_message = ?, last_time = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [content.substring(0, 50) + (content.length > 50 ? '...' : ''), sessionId]);
      
      // 更新未读消息计数
      await connection.query(`
        INSERT INTO chat_unread_counts (user_id, session_id, unread_count, last_read_time) 
        VALUES (?, ?, 1, NULL)
        ON DUPLICATE KEY UPDATE unread_count = unread_count + 1
      `, [receiverId, sessionId]);
      
      // 返回刚发送的消息
      const [newMessages] = await connection.query(`
        SELECT 
          cm.*,
          u.username as sender_name,
          up.profile_picture as sender_avatar
        FROM chat_messages cm
        JOIN users u ON cm.sender_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE cm.id = ?
      `, [messageId]);
      
      if (newMessages.length > 0) {
        const messageData = newMessages[0];
        
        // 通过WebSocket向接收者推送消息
        socketService.sendNewMessage(receiverId, {
          ...messageData,
          sessionId,
        });
        
        this.success(res, messageData, '消息发送成功');
      } else {
        throw new Error('消息发送失败');
      }
    });
  });
  
  /**
   * 标记消息为已读
   */
  markAsRead = this.catchAsync(async (req, res) => {
    const userId = req.userData.userId;
    const { sessionId } = req.params;
    
    // 检查会话是否存在且用户有权访问
    const sessionSql = `
      SELECT * FROM chat_sessions
      WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `;
    
    const sessions = await DbUtil.query(sessionSql, [sessionId, userId, userId]);
    if (sessions.length === 0) {
      throw new NotFoundError('聊天会话不存在');
    }
    
    // 获取对话的另一方用户ID
    const partnerId = sessions[0].user1_id === userId 
                     ? sessions[0].user2_id 
                     : sessions[0].user1_id;
    
    // 更新消息状态
    await DbUtil.query(`
      UPDATE chat_messages 
      SET is_read = 1, read_time = NOW() 
      WHERE session_id = ? AND receiver_id = ? AND is_read = 0
    `, [sessionId, userId]);
    
    // 更新未读计数
    await DbUtil.query(`
      INSERT INTO chat_unread_counts (user_id, session_id, unread_count, last_read_time) 
      VALUES (?, ?, 0, NOW())
      ON DUPLICATE KEY UPDATE unread_count = 0, last_read_time = NOW()
    `, [userId, sessionId]);
    
    // 通知发送者消息已读
    socketService.notifyMessageRead(partnerId, sessionId);
    
    this.success(res, null, '消息已标记为已读');
  });
  
  /**
   * 获取未读消息数量
   */
  getUnreadCount = this.catchAsync(async (req, res) => {
    const userId = req.userData.userId;
    
    // 获取所有会话的未读消息数
    const sql = `
      SELECT 
        cs.id as session_id,
        COALESCE(uc.unread_count, 0) as unread_count,
        (SELECT COUNT(*) FROM chat_messages WHERE receiver_id = ? AND is_read = 0) as total_unread
      FROM chat_sessions cs
      LEFT JOIN chat_unread_counts uc ON uc.session_id = cs.id AND uc.user_id = ?
      WHERE cs.user1_id = ? OR cs.user2_id = ?
    `;
    
    const result = await DbUtil.query(sql, [userId, userId, userId, userId]);
    
    // 计算总未读数
    const totalUnread = result.length > 0 ? result[0].total_unread : 0;
    
    // 格式化返回数据
    const unreadCounts = {
      total: totalUnread,
      sessions: result.map(item => ({
        sessionId: item.session_id,
        unreadCount: item.unread_count || 0
      }))
    };
    
    this.success(res, unreadCounts, '获取未读消息数量成功');
  });
  
  /**
   * 删除聊天会话
   */
  deleteSession = this.catchAsync(async (req, res) => {
    const userId = req.userData.userId;
    const { sessionId } = req.params;
    
    // 检查会话是否存在且用户有权访问
    const sessionSql = `
      SELECT * FROM chat_sessions
      WHERE id = ? AND (user1_id = ? OR user2_id = ?)
    `;
    
    const sessions = await DbUtil.query(sessionSql, [sessionId, userId, userId]);
    if (sessions.length === 0) {
      throw new NotFoundError('聊天会话不存在');
    }
    
    // 删除会话及相关消息
    await DbUtil.transaction(async (connection) => {
      // 删除未读消息计数
      await connection.query(
        'DELETE FROM chat_unread_counts WHERE session_id = ?',
        [sessionId]
      );
      
      // 删除所有消息
      await connection.query(
        'DELETE FROM chat_messages WHERE session_id = ?',
        [sessionId]
      );
      
      // 删除会话
      await connection.query(
        'DELETE FROM chat_sessions WHERE id = ?',
        [sessionId]
      );
    });
    
    this.success(res, null, '聊天会话已删除');
  });
  
  /**
   * 搜索聊天记录
   */
  searchMessages = this.catchAsync(async (req, res) => {
    const userId = req.userData.userId;
    const { keyword } = req.query;
    const { page = 1, limit = 20 } = req.query;
    
    if (!keyword) {
      return this.error('搜索关键词不能为空', 400);
    }
    
    // 搜索聊天记录
    const sql = `
      SELECT 
        cm.*,
        u.username as sender_name,
        up.profile_picture as sender_avatar,
        cs.user1_id, cs.user2_id
      FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 
        (cs.user1_id = ? OR cs.user2_id = ?) AND 
        cm.content LIKE ?
      ORDER BY cm.send_time DESC
      LIMIT ? OFFSET ?
    `;
    
    const offset = (page - 1) * limit;
    const messages = await DbUtil.query(
      sql, 
      [userId, userId, `%${keyword}%`, Number(limit), offset]
    );
    
    // 查询匹配消息总数
    const totalSql = `
      SELECT COUNT(*) as total
      FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      WHERE 
        (cs.user1_id = ? OR cs.user2_id = ?) AND 
        cm.content LIKE ?
    `;
    
    const totalResult = await DbUtil.query(
      totalSql,
      [userId, userId, `%${keyword}%`]
    );
    
    const total = totalResult[0].total;
    
    this.paginate(res, messages, total, page, limit);
  });
  
  /**
   * 上传聊天图片
   */
  uploadImage = this.catchAsync(async (req, res) => {
    if (!req.file) {
      return this.error('请上传图片文件', 400);
    }
    
    const imageUrl = `/uploads/chat/${req.file.filename}`;
    
    this.success(res, { url: imageUrl }, '图片上传成功');
  });
}

module.exports = new ChatController(); 