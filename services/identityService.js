const pool = require('../config/database');
const { IdentityTypes, isValidIdentityType } = require('../config/identityTypes');
const dayjs = require('dayjs');

class IdentityService {
  /**
   * 获取用户所有身份
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 用户身份列表
   */
  async getUserIdentities(userId) {
    try {
      const sql = `
        SELECT * FROM user_identities 
        WHERE user_id = ? AND status = 1 
        AND (expiration_time IS NULL OR expiration_time > NOW())
      `;
      const [identities] = await pool.query(sql, [userId]);
      return identities.map(identity => ({
        ...identity,
        meta_data: JSON.parse(identity.meta_data || '{}')
      }));
    } catch (error) {
      console.error('获取用户身份列表错误:', error);
      throw error;
    }
  }

  /**
   * 验证用户是否拥有指定身份
   * @param {number} userId - 用户ID
   * @param {string} identityType - 身份类型
   * @returns {Promise<boolean>} 是否拥有该身份
   */
  async hasIdentity(userId, identityType) {
    try {
      if (!isValidIdentityType(identityType)) {
        return false;
      }

      const sql = `
        SELECT COUNT(*) as count 
        FROM user_identities 
        WHERE user_id = ? 
        AND identity_type = ? 
        AND status = 1 
        AND (expiration_time IS NULL OR expiration_time > NOW())
      `;
      const [[result]] = await pool.query(sql, [userId, identityType]);
      return result.count > 0;
    } catch (error) {
      console.error('验证用户身份错误:', error);
      throw error;
    }
  }

  /**
   * 申请身份认证
   * @param {number} userId - 用户ID
   * @param {string} identityType - 身份类型
   * @param {Object} certificationData - 认证资料
   * @returns {Promise<Object>} 认证申请结果
   */
  async applyCertification(userId, identityType, certificationData) {
    try {
      const typeInfo = IdentityTypes[identityType];
      if (!typeInfo || !typeInfo.needCertification) {
        throw new Error('无效的身份类型');
      }

      // 检查是否已有待审核的申请
      const checkSql = `
        SELECT COUNT(*) as count 
        FROM identity_certifications 
        WHERE user_id = ? AND identity_type = ? AND status = 0
      `;
      const [[checkResult]] = await pool.query(checkSql, [userId, identityType]);
      if (checkResult.count > 0) {
        throw new Error('已有待审核的认证申请');
      }

      // 创建新的认证申请
      const insertSql = `
        INSERT INTO identity_certifications 
        (user_id, identity_type, certification_data, status) 
        VALUES (?, ?, ?, 0)
      `;
      const [result] = await pool.query(insertSql, [
        userId,
        identityType,
        JSON.stringify(certificationData)
      ]);

      return {
        id: result.insertId,
        status: 0,
        message: '认证申请已提交，等待审核'
      };
    } catch (error) {
      console.error('提交认证申请错误:', error);
      throw error;
    }
  }

  /**
   * 审核身份认证申请
   * @param {number} certificationId - 认证申请ID
   * @param {number} reviewerId - 审核人ID
   * @param {boolean} approved - 是否通过
   * @param {string} comment - 审核意见
   */
  async reviewCertification(certificationId, reviewerId, approved, comment) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 获取认证申请信息
      const [[certification]] = await connection.execute(
        'SELECT * FROM identity_certifications WHERE id = ? AND status = 0',
        [certificationId]
      );

      if (!certification) {
        throw new Error('认证申请不存在或已处理');
      }

      const status = approved ? 1 : 2;
      
      // 更新认证申请状态
      await connection.execute(
        `UPDATE identity_certifications 
         SET status = ?, review_comment = ?, reviewer_id = ?, review_time = NOW() 
         WHERE id = ?`,
        [status, comment, reviewerId, certificationId]
      );

      if (approved) {
        const typeInfo = IdentityTypes[certification.identity_type];
        const expirationTime = dayjs().add(typeInfo.validityDays, 'day').format('YYYY-MM-DD HH:mm:ss');

        // 创建或更新用户身份
        await connection.execute(
          `INSERT INTO user_identities 
           (user_id, identity_type, status, certification_time, expiration_time) 
           VALUES (?, ?, 1, NOW(), ?) 
           ON DUPLICATE KEY UPDATE 
           status = 1, 
           certification_time = NOW(), 
           expiration_time = ?`,
          [certification.user_id, certification.identity_type, expirationTime, expirationTime]
        );
      }

      await connection.commit();
      return { success: true, message: approved ? '认证通过' : '认证被拒绝' };
    } catch (error) {
      await connection.rollback();
      console.error('审核认证申请错误:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 获取认证申请列表
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {number} status - 状态筛选
   */
  async getCertificationList(page, pageSize, status) {
    try {
      const offset = (page - 1) * pageSize;
      let whereClause = '';
      const params = [];

      if (status !== undefined) {
        whereClause = 'WHERE ic.status = ?';
        params.push(status);
      }

      const countSql = `
        SELECT COUNT(*) as total 
        FROM identity_certifications ic
        ${whereClause}
      `;
      const [[{ total }]] = await pool.query(countSql, params);

      const listSql = `
        SELECT 
          ic.*,
          u.username as user_name,
          a.username as reviewer_name
        FROM identity_certifications ic
        LEFT JOIN users u ON ic.user_id = u.id
        LEFT JOIN admins a ON ic.reviewer_id = a.id
        ${whereClause}
        ORDER BY ic.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [list] = await pool.query(listSql, [...params, pageSize, offset]);

      return {
        list: list.map(item => {
          try {
            return {
              ...item,
              certification_data: typeof item.certification_data === 'string' 
                ? JSON.parse(item.certification_data) 
                : item.certification_data || {}
            };
          } catch (error) {
            console.error('解析认证数据错误:', error);
            return {
              ...item,
              certification_data: {}
            };
          }
        }),
        total,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取认证申请列表错误:', error);
      throw error;
    }
  }

  /**
   * 获取身份统计信息
   */
  async getIdentityStats() {
    try {
      const stats = {
        total: 0,
        byType: {},
        pendingReview: 0
      };

      // 获取各类型身份的统计
      const typeSql = `
        SELECT 
          identity_type,
          COUNT(*) as count
        FROM user_identities
        WHERE status = 1
        GROUP BY identity_type
      `;
      const [typeStats] = await pool.query(typeSql);
      typeStats.forEach(({ identity_type, count }) => {
        stats.byType[identity_type] = count;
        stats.total += count;
      });

      // 获取待审核数量
      const pendingSql = `
        SELECT COUNT(*) as count
        FROM identity_certifications
        WHERE status = 0
      `;
      const [[{ count }]] = await pool.query(pendingSql);
      stats.pendingReview = count;

      return stats;
    } catch (error) {
      console.error('获取身份统计信息错误:', error);
      throw error;
    }
  }
}

module.exports = new IdentityService(); 