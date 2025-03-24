const pool = require('../config/database');
const logger = require('../utils/logger');
const { BusinessError } = require('../utils/errors');

class FollowService {
  /**
   * 关注用户
   * @param {Number} followerId 关注者ID
   * @param {Number} followedId 被关注者ID
   * @returns {Promise<Object>} 关注结果
   */
  static async followUser(followerId, followedId) {
    // 检查是否自己关注自己
    if (followerId === followedId) {
      throw new BusinessError('不能关注自己');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 检查被关注用户是否存在
      const [users] = await connection.query(
        'SELECT id FROM users WHERE id = ? AND status = 1',
        [followedId]
      );
      
      if (users.length === 0) {
        throw new BusinessError('用户不存在或已被禁用');
      }
      
      // 检查是否已关注
      const [exists] = await connection.query(
        'SELECT id FROM user_follows WHERE follower_id = ? AND followed_id = ?',
        [followerId, followedId]
      );
      
      if (exists.length > 0) {
        // 已经关注过，返回成功但带有标记
        await connection.commit();
        return { 
          success: true, 
          already_followed: true,
          message: '已经关注过该用户'
        };
      }
      
      // 添加关注记录
      await connection.query(
        'INSERT INTO user_follows (follower_id, followed_id) VALUES (?, ?)',
        [followerId, followedId]
      );
      
      await connection.commit();
      return { 
        success: true,
        already_followed: false,
        message: '关注成功' 
      };
    } catch (error) {
      await connection.rollback();
      if (error instanceof BusinessError) {
        throw error;
      }
      logger.error('关注用户失败:', error);
      throw new BusinessError('操作失败，请稍后重试');
    } finally {
      connection.release();
    }
  }
  
  /**
   * 取消关注用户
   * @param {Number} followerId 关注者ID
   * @param {Number} followedId 被关注者ID
   * @returns {Promise<Object>} 取消关注结果
   */
  static async unfollowUser(followerId, followedId) {
    try {
      // 删除关注记录
      const [result] = await pool.query(
        'DELETE FROM user_follows WHERE follower_id = ? AND followed_id = ?',
        [followerId, followedId]
      );
      
      if (result.affectedRows === 0) {
        throw new BusinessError('未关注该用户');
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof BusinessError) {
        throw error;
      }
      logger.error('取消关注用户失败:', error);
      throw new BusinessError('操作失败，请稍后重试');
    }
  }
  
  /**
   * 检查是否已关注用户
   * @param {Number} followerId 关注者ID
   * @param {Number} followedId 被关注者ID
   * @returns {Promise<Boolean>} 是否已关注
   */
  static async checkIsFollowed(followerId, followedId) {
    try {
      const [follows] = await pool.query(
        'SELECT id FROM user_follows WHERE follower_id = ? AND followed_id = ?',
        [followerId, followedId]
      );
      
      return follows.length > 0;
    } catch (error) {
      logger.error('检查关注状态失败:', error);
      throw new BusinessError('操作失败，请稍后重试');
    }
  }
  
  /**
   * 获取用户关注列表
   * @param {Number} userId 用户ID
   * @param {Number} currentUserId 当前用户ID，用于判断"我"是否也关注了这些用户
   * @param {Number} page 页码
   * @param {Number} limit 每页条数
   * @returns {Promise<Object>} 关注列表
   */
  static async getFollowingList(userId, currentUserId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      // 获取总数
      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM user_follows WHERE follower_id = ?',
        [userId]
      );
      const total = countResult[0].total;
      
      // 获取关注列表
      let query = `
        SELECT 
          u.id, u.username, up.profile_picture, up.bio
        FROM user_follows uf
        JOIN users u ON uf.followed_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE uf.follower_id = ?
        ORDER BY uf.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [follows] = await pool.query(
        query,
        [userId, parseInt(limit), offset]
      );
      
      // 如果有当前用户ID，判断当前用户是否也关注了这些用户
      if (currentUserId && currentUserId !== userId) {
        const followedIds = follows.map(f => f.id);
        if (followedIds.length > 0) {
          const [followedByMe] = await pool.query(
            `SELECT followed_id FROM user_follows 
             WHERE follower_id = ? AND followed_id IN (?)`,
            [currentUserId, followedIds]
          );
          
          const followedByMeMap = new Map();
          followedByMe.forEach(f => followedByMeMap.set(f.followed_id, true));
          
          follows.forEach(f => {
            f.is_followed = followedByMeMap.has(f.id);
          });
        } else {
          follows.forEach(f => {
            f.is_followed = false;
          });
        }
      } else if (currentUserId && currentUserId === userId) {
        // 如果是查看自己的关注列表，所有人都是已关注的
        follows.forEach(f => {
          f.is_followed = true;
        });
      } else {
        // 未登录用户查看别人的关注列表
        follows.forEach(f => {
          f.is_followed = false;
        });
      }
      
      return {
        items: follows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('获取关注列表失败:', error);
      throw new BusinessError('获取关注列表失败');
    }
  }
  
  /**
   * 获取用户粉丝列表
   * @param {Number} userId 用户ID
   * @param {Number} currentUserId 当前用户ID，用于判断"我"是否关注了这些粉丝
   * @param {Number} page 页码
   * @param {Number} limit 每页条数
   * @returns {Promise<Object>} 粉丝列表
   */
  static async getFollowersList(userId, currentUserId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      // 获取总数
      const [countResult] = await pool.query(
        'SELECT COUNT(*) as total FROM user_follows WHERE followed_id = ?',
        [userId]
      );
      const total = countResult[0].total;
      
      // 获取粉丝列表
      let query = `
        SELECT 
          u.id, u.username, up.profile_picture, up.bio
        FROM user_follows uf
        JOIN users u ON uf.follower_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE uf.followed_id = ?
        ORDER BY uf.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [followers] = await pool.query(
        query,
        [userId, parseInt(limit), offset]
      );
      
      // 如果有当前用户ID，判断当前用户是否关注了这些粉丝
      if (currentUserId) {
        const followerIds = followers.map(f => f.id);
        if (followerIds.length > 0) {
          const [followedByMe] = await pool.query(
            `SELECT followed_id FROM user_follows 
             WHERE follower_id = ? AND followed_id IN (?)`,
            [currentUserId, followerIds]
          );
          
          const followedByMeMap = new Map();
          followedByMe.forEach(f => followedByMeMap.set(f.followed_id, true));
          
          followers.forEach(f => {
            f.is_followed = followedByMeMap.has(f.id);
          });
        } else {
          followers.forEach(f => {
            f.is_followed = false;
          });
        }
      } else {
        // 未登录用户查看别人的粉丝列表
        followers.forEach(f => {
          f.is_followed = false;
        });
      }
      
      return {
        items: followers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('获取粉丝列表失败:', error);
      throw new BusinessError('获取粉丝列表失败');
    }
  }
  
  /**
   * 获取用户的关注和粉丝数量
   * @param {Number} userId 用户ID
   * @returns {Promise<Object>} 关注和粉丝数量
   */
  static async getUserFollowStats(userId) {
    try {
      // 获取关注数
      const [followingResult] = await pool.query(
        'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?',
        [userId]
      );
      
      // 获取粉丝数
      const [followerResult] = await pool.query(
        'SELECT COUNT(*) as count FROM user_follows WHERE followed_id = ?',
        [userId]
      );
      
      return {
        following_count: followingResult[0].count,
        follower_count: followerResult[0].count
      };
    } catch (error) {
      logger.error('获取用户关注统计失败:', error);
      throw new BusinessError('获取用户关注统计失败');
    }
  }
}

module.exports = FollowService; 