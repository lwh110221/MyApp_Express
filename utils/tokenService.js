const crypto = require('crypto');
const db = require('../config/database');

class TokenService {
  /**
   * 生成电子邮箱验证令牌
   * @param {number} userId - 用户ID
   * @returns {Promise<string>} - 生成的令牌
   */
  async generateEmailVerificationToken(userId) {
    try {
      // 生成随机令牌
      const token = crypto.randomBytes(32).toString('hex');
      
      // 设置过期时间（24小时后）
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // 删除该用户之前的所有邮箱验证令牌
      const deleteQuery = `DELETE FROM email_verification_tokens WHERE user_id = ?`;
      await db.query(deleteQuery, [userId]);
      
      // 存储新令牌
      const insertQuery = `
        INSERT INTO email_verification_tokens (user_id, token, expires_at) 
        VALUES (?, ?, ?)
      `;
      
      await db.query(insertQuery, [
        userId, 
        token, 
        expiresAt.toISOString().slice(0, 19).replace('T', ' ')
      ]);
      
      return token;
    } catch (error) {
      console.error('生成邮箱验证令牌失败:', error);
      throw error;
    }
  }

  /**
   * 验证邮箱验证令牌
   * @param {string} token - 要验证的令牌
   * @returns {Promise<number|null>} - 如果令牌有效，返回用户ID；否则返回null
   */
  async verifyEmailToken(token) {
    try {
      // 查询令牌
      const query = `
        SELECT user_id, expires_at 
        FROM email_verification_tokens 
        WHERE token = ?
      `;
      
      const [rows] = await db.query(query, [token]);
      
      // 如果找不到令牌或者令牌已过期，返回null
      if (rows.length === 0) {
        return null;
      }
      
      const { user_id, expires_at } = rows[0];
      const now = new Date();
      const expiryDate = new Date(expires_at);
      
      if (now > expiryDate) {
        // 令牌已过期，删除它
        await this.deleteEmailToken(token);
        return null;
      }
      
      return user_id;
    } catch (error) {
      console.error('验证邮箱令牌失败:', error);
      return null;
    }
  }

  /**
   * 删除邮箱验证令牌
   * @param {string} token - 要删除的令牌
   * @returns {Promise<boolean>} - 操作是否成功
   */
  async deleteEmailToken(token) {
    try {
      const query = `DELETE FROM email_verification_tokens WHERE token = ?`;
      await db.query(query, [token]);
      return true;
    } catch (error) {
      console.error('删除邮箱验证令牌失败:', error);
      return false;
    }
  }
}

module.exports = new TokenService(); 