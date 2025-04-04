const crypto = require('crypto');
const db = require('../config/database');

class VerificationCodeService {
  /**
   * 生成随机验证码
   * @param {number} length - 验证码长度
   * @returns {string} - 生成的验证码
   */
  generateCode(length = 6) {
    // 生成指定长度的数字验证码
    return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
  }

  /**
   * 创建邮箱验证码记录
   * @param {string} email - 邮箱
   * @param {string} code - 验证码
   * @param {number} expireMinutes - 过期时间（分钟）
   * @returns {Promise<boolean>} - 操作结果
   */
  async createEmailVerificationCode(email, code, expireMinutes = 30) {
    try {
      console.log(`创建验证码: ${email}, ${code}, 过期时间: ${expireMinutes}分钟后`);
      
      // 删除该邮箱之前的所有验证码
      const deleteQuery = `DELETE FROM email_verification_codes WHERE email = ?`;
      await db.query(deleteQuery, [email]);
      
      // 使用数据库的DATE_ADD和NOW()函数来处理时区问题
      const insertQuery = `
        INSERT INTO email_verification_codes (email, code, expires_at) 
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
      `;
      
      await db.query(insertQuery, [
        email, 
        code, 
        expireMinutes
      ]);
      
      console.log(`验证码已存储到数据库，将在${expireMinutes}分钟后过期`);
      return true;
    } catch (error) {
      console.error('创建邮箱验证码失败:', error);
      throw error;
    }
  }

  /**
   * 验证邮箱验证码
   * @param {string} email - 邮箱
   * @param {string} code - 验证码
   * @returns {Promise<boolean>} - 验证结果，true表示验证成功，false表示验证失败
   */
  async verifyEmailCode(email, code) {
    try {
      // 查询验证码
      console.log(`验证邮箱验证码: ${email}, ${code}`);
      
      // 使用数据库的NOW()函数直接在数据库中比较时间，避免时区问题
      const query = `
        SELECT * FROM email_verification_codes 
        WHERE email = ? AND code = ? AND expires_at > NOW()
      `;
      
      const [rows] = await db.query(query, [email, code]);
      console.log(`查询结果: ${rows.length > 0 ? '找到有效记录' : '未找到有效记录'}`);
      
      // 如果找不到有效记录，验证失败
      if (rows.length === 0) {
        // 检查是否存在过期的验证码
        const expiredQuery = `
          SELECT * FROM email_verification_codes 
          WHERE email = ? AND code = ? AND expires_at <= NOW()
        `;
        const [expiredRows] = await db.query(expiredQuery, [email, code]);
        
        if (expiredRows.length > 0) {
          console.log(`验证码已过期`);
        } else {
          console.log(`验证码不存在`);
        }
        
        return false;
      }
      
      console.log(`验证码有效`);
      return true;
    } catch (error) {
      console.error('验证邮箱验证码失败:', error);
      return false;
    }
  }

  /**
   * 删除邮箱验证码
   * @param {string} email - 邮箱
   * @returns {Promise<boolean>} - 操作结果
   */
  async deleteEmailCode(email) {
    try {
      const query = `DELETE FROM email_verification_codes WHERE email = ?`;
      await db.query(query, [email]);
      return true;
    } catch (error) {
      console.error('删除邮箱验证码失败:', error);
      return false;
    }
  }
}

module.exports = new VerificationCodeService(); 