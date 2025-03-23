const pool = require('../config/database');
const ResponseUtil = require('../utils/responseUtil');
const logger = require('../utils/logger');

const checkExpertRole = async (req, res, next) => {
  try {
    const userId = req.userData.userId;
    
    // 检查用户是否是专家且状态正常
    const [experts] = await pool.query(
      `SELECT e.* 
       FROM experts e 
       WHERE e.user_id = ? 
       AND e.status = 1 
       AND e.audit_status = 2`,  // 2表示审核通过
      [userId]
    );
    
    if (experts.length === 0) {
      return ResponseUtil.error(res, '只有认证专家才能回答问题', 403);
    }

    // 将专家信息添加到请求对象中
    req.expertData = experts[0];
    next();
  } catch (error) {
    logger.error('验证专家身份时发生错误:', error);
    return ResponseUtil.error(res, '验证专家身份失败', 500);
  }
};

module.exports = checkExpertRole; 