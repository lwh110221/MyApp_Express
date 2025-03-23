const pool = require('../config/database');
const logger = require('../utils/logger');

class PointService {
  // 积分类型常量
  static POINT_TYPES = {
    POST_CREATE: 'post_create',       // 发布帖子
    POST_LIKE: 'post_like',           // 帖子被点赞
    COMMENT_CREATE: 'comment_create', // 发表评论
    COMMENT_LIKE: 'comment_like',     // 评论被点赞
    POST_DELETE: 'post_delete',       // 帖子被删除
    COMMENT_DELETE: 'comment_delete'  // 评论被删除
  };

  // 积分规则配置
  static POINT_RULES = {
    [PointService.POINT_TYPES.POST_CREATE]: 10,      // 发帖奖励10积分
    [PointService.POINT_TYPES.POST_LIKE]: 2,         // 帖子被点赞奖励2积分
    [PointService.POINT_TYPES.COMMENT_CREATE]: 3,    // 评论奖励3积分
    [PointService.POINT_TYPES.COMMENT_LIKE]: 1,      // 评论被点赞奖励1积分
    [PointService.POINT_TYPES.POST_DELETE]: -10,     // 删帖扣除10积分
    [PointService.POINT_TYPES.COMMENT_DELETE]: -3    // 删评论扣除3积分
  };

  // 获取积分描述
  static getPointDescription(type, relatedId = null) {
    const descriptions = {
      [PointService.POINT_TYPES.POST_CREATE]: '发布社区帖子',
      [PointService.POINT_TYPES.POST_LIKE]: '帖子获得点赞',
      [PointService.POINT_TYPES.COMMENT_CREATE]: '发表社区评论',
      [PointService.POINT_TYPES.COMMENT_LIKE]: '评论获得点赞',
      [PointService.POINT_TYPES.POST_DELETE]: '删除社区帖子',
      [PointService.POINT_TYPES.COMMENT_DELETE]: '删除社区评论'
    };
    
    let desc = descriptions[type] || '积分变动';
    if (relatedId) {
      desc += `（ID: ${relatedId}）`;
    }
    return desc;
  }

  /**
   * 添加积分记录并更新用户积分
   * @param {Object} connection 数据库连接（支持事务）
   * @param {Number} userId 用户ID
   * @param {String} type 积分类型
   * @param {Number} relatedId 相关ID
   * @param {String} customDesc 自定义描述（可选）
   * @returns {Promise<Object>} 添加结果
   */
  static async addPoints(connection, userId, type, relatedId = null, customDesc = null) {
    try {
      // 获取积分值
      const points = PointService.POINT_RULES[type] || 0;
      if (points === 0) {
        return { success: false, message: '无效的积分类型' };
      }
      
      // 获取积分描述
      const description = customDesc || PointService.getPointDescription(type, relatedId);
      
      // 添加积分记录
      await connection.query(
        `INSERT INTO point_records (user_id, points, type, related_id, description) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, points, type, relatedId, description]
      );
      
      // 更新用户积分
      await connection.query(
        `UPDATE users SET points = points + ? WHERE id = ?`,
        [points, userId]
      );
      
      return { 
        success: true, 
        points,
        description 
      };
    } catch (error) {
      logger.error('添加积分记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户积分记录
   * @param {Number} userId 用户ID
   * @param {Number} page 页码
   * @param {Number} limit 每页条数
   * @returns {Promise<Object>} 积分记录
   */
  static async getUserPointRecords(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // 获取总记录数
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM point_records WHERE user_id = ?`,
        [userId]
      );
      const total = countResult[0].total;
      
      // 获取记录列表
      const [records] = await pool.query(
        `SELECT * FROM point_records 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, parseInt(limit), offset]
      );
      
      return { 
        items: records, 
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        } 
      };
    } catch (error) {
      logger.error('获取用户积分记录失败:', error);
      throw error;
    }
  }
}

module.exports = PointService; 