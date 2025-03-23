const pool = require('../config/database');
const logger = require('../utils/logger');

class TagService {
  /**
   * 获取或创建标签
   * @param {Object} connection 数据库连接
   * @param {Array} tagNames 标签名称数组
   * @returns {Promise<Array>} 标签ID数组
   */
  static async getOrCreateTags(connection, tagNames) {
    if (!tagNames || !Array.isArray(tagNames) || tagNames.length === 0) {
      return [];
    }

    // 过滤空标签和标准化处理
    const validTagNames = tagNames
      .filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => tag.trim())
      .slice(0, 5); // 最多5个标签

    if (validTagNames.length === 0) {
      return [];
    }

    const tagIds = [];
    
    // 遍历标签名称，获取或创建标签
    for (const tagName of validTagNames) {
      try {
        // 查询标签是否存在
        const [existingTags] = await connection.query(
          'SELECT id FROM community_tags WHERE name = ?',
          [tagName]
        );

        let tagId;
        if (existingTags.length > 0) {
          // 标签已存在，更新使用次数
          tagId = existingTags[0].id;
          await connection.query(
            'UPDATE community_tags SET used_count = used_count + 1 WHERE id = ?',
            [tagId]
          );
        } else {
          // 创建新标签
          const [insertResult] = await connection.query(
            'INSERT INTO community_tags (name) VALUES (?)',
            [tagName]
          );
          tagId = insertResult.insertId;
        }

        tagIds.push(tagId);
      } catch (error) {
        logger.error(`处理标签 ${tagName} 时出错:`, error);
      }
    }

    return tagIds;
  }

  /**
   * 更新帖子的标签
   * @param {Object} connection 数据库连接
   * @param {Number} postId 帖子ID
   * @param {Array} tagIds 标签ID数组
   * @returns {Promise<void>}
   */
  static async updatePostTags(connection, postId, tagIds) {
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      // 删除所有标签关联
      await connection.query(
        'DELETE FROM community_post_tags WHERE post_id = ?',
        [postId]
      );
      return;
    }

    // 删除旧的标签关联
    await connection.query(
      'DELETE FROM community_post_tags WHERE post_id = ?',
      [postId]
    );

    // 添加新的标签关联
    for (const tagId of tagIds) {
      try {
        await connection.query(
          'INSERT INTO community_post_tags (post_id, tag_id) VALUES (?, ?)',
          [postId, tagId]
        );
      } catch (error) {
        logger.error(`为帖子 ${postId} 添加标签 ${tagId} 时出错:`, error);
      }
    }

    // 更新帖子的标签字段
    await connection.query(
      'UPDATE community_posts SET tags = ? WHERE id = ?',
      [JSON.stringify(tagIds), postId]
    );
  }

  /**
   * 获取帖子的标签
   * @param {Object} connection 数据库连接
   * @param {Number} postId 帖子ID
   * @returns {Promise<Array>} 标签对象数组 [{id, name}]
   */
  static async getPostTags(connection, postId) {
    try {
      const [rows] = await connection.query(
        `SELECT t.id, t.name 
         FROM community_tags t
         JOIN community_post_tags pt ON t.id = pt.tag_id
         WHERE pt.post_id = ? AND t.status = 1`,
        [postId]
      );
      return rows;
    } catch (error) {
      logger.error(`获取帖子 ${postId} 的标签时出错:`, error);
      return [];
    }
  }

  /**
   * 获取热门标签
   * @param {Number} limit 返回数量限制
   * @returns {Promise<Array>} 标签对象数组 [{id, name, used_count}]
   */
  static async getHotTags(limit = 10) {
    try {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query(
          `SELECT id, name, used_count 
           FROM community_tags 
           WHERE status = 1 
           ORDER BY used_count DESC 
           LIMIT ?`,
          [limit]
        );
        return rows;
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('获取热门标签时出错:', error);
      return [];
    }
  }
}

module.exports = TagService; 