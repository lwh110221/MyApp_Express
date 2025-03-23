const identityService = require('../services/identityService');
const { ResponseUtil } = require('../utils/responseUtil');
const logger = require('../utils/logger');

/**
 * 身份验证中间件
 * @param {string|string[]} requiredIdentities - 需要的身份类型
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 验证模式：'ANY'-满足任一身份即可，'ALL'-需要满足所有身份
 */
const identityCheck = (requiredIdentities, options = {}) => {
  return async (req, res, next) => {
    const { mode = 'ANY' } = options;
    const userId = req.userData.userId;

    try {
      // 转换为数组形式
      const identityTypes = Array.isArray(requiredIdentities) 
        ? requiredIdentities 
        : [requiredIdentities];

      // 检查每个所需身份
      const validations = await Promise.all(
        identityTypes.map(async type => ({
          type,
          valid: await identityService.hasIdentity(userId, type)
        }))
      );

      // 根据模式判断是否满足要求
      const hasRequired = mode === 'ANY'
        ? validations.some(v => v.valid)
        : validations.every(v => v.valid);

      if (!hasRequired) {
        return ResponseUtil.error(res, '需要相应身份认证', 403);
      }

      // 将用户身份信息附加到请求对象
      req.userIdentities = validations
        .filter(v => v.valid)
        .map(v => v.type);

      next();
    } catch (error) {
      logger.error('身份验证错误:', error);
      return ResponseUtil.error(res, '身份验证过程出错', 500);
    }
  };
};

module.exports = identityCheck; 