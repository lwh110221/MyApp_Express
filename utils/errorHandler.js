const logger = require('./logger');
const ResponseUtil = require('./responseUtil');
const { AppError } = require('./errors');

/**
 * 错误处理工具类
 */
class ErrorHandler {
  /**
   * 处理错误并返回统一的错误响应
   * @param {Error} err - 错误对象
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  static handleError(err, req, res) {
    // 记录错误日志
    logger.logError(err, 'ErrorHandler', {
      url: req.originalUrl,
      method: req.method,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      user: req.userData?.userId || req.admin?.id || 'anonymous'
    });

    // 处理已知的错误类型
    if (err instanceof AppError) {
      return ResponseUtil.error(res, err.message, err.statusCode);
    }

    // 处理验证错误
    if (err.name === 'ValidationError') {
      return ResponseUtil.error(res, err.message, 400);
    }

    // 处理JWT认证错误
    if (err.name === 'UnauthorizedError') {
      return ResponseUtil.error(res, '未授权访问', 401);
    }

    // 处理文件上传错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ResponseUtil.error(res, '文件大小超出限制', 400);
    }

    // 处理数据库错误
    if (err.code === 'ER_DUP_ENTRY') {
      return ResponseUtil.error(res, '数据已存在', 400);
    }

    // 处理其他数据库错误
    if (err.code?.startsWith('ER_')) {
      return ResponseUtil.error(res, '数据库操作失败', 500);
    }

    // 处理未知错误
    return ResponseUtil.error(res, '服务器内部错误', 500);
  }

  /**
   * 包装异步函数，统一处理错误
   * @param {Function} fn - 异步函数
   * @returns {Function} 包装后的函数
   */
  static asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(err => {
        ErrorHandler.handleError(err, req, res);
      });
    };
  }

  /**
   * 验证请求参数
   * @param {Object} params - 请求参数
   * @param {Array} required - 必需的参数列表
   * @throws {AppError} 参数验证错误
   */
  static validateParams(params, required) {
    const missing = required.filter(field => !params[field]);
    if (missing.length > 0) {
      throw new AppError(`缺少必需的参数: ${missing.join(', ')}`, 400);
    }
  }

  /**
   * 验证请求权限
   * @param {Object} req - Express请求对象
   * @param {string|Array} permissions - 所需权限
   * @throws {AppError} 权限验证错误
   */
  static checkPermissions(req, permissions) {
    const userPermissions = req.admin?.permissions || [];
    const required = Array.isArray(permissions) ? permissions : [permissions];

    const hasPermission = required.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new AppError('没有操作权限', 403);
    }
  }

  /**
   * 验证用户认证状态
   * @param {Object} req - Express请求对象
   * @param {boolean} adminRequired - 是否需要管理员权限
   * @throws {AppError} 认证错误
   */
  static checkAuth(req, adminRequired = false) {
    if (adminRequired && !req.admin?.id) {
      throw new AppError('需要管理员权限', 401);
    }

    if (!adminRequired && !req.userData?.userId) {
      throw new AppError('用户未认证', 401);
    }
  }

  /**
   * 处理数据库操作错误
   * @param {Error} error - 数据库错误
   * @throws {AppError} 格式化后的错误
   */
  static handleDbError(error) {
    logger.logError(error, 'Database', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });

    switch (error.code) {
      case 'ER_DUP_ENTRY':
        throw new AppError('数据已存在', 400);
      case 'ER_NO_REFERENCED_ROW':
        throw new AppError('关联数据不存在', 400);
      case 'ER_ROW_IS_REFERENCED':
        throw new AppError('数据被其他记录引用，无法操作', 400);
      default:
        throw new AppError('数据库操作失败', 500);
    }
  }
}

module.exports = ErrorHandler; 