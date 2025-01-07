const ResponseUtil = require('../utils/responseUtil');
const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class BaseController {
  constructor() {
    // 自动绑定方法到实例
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
    methods
      .filter(method => method !== 'constructor' && typeof this[method] === 'function')
      .forEach(method => {
        this[method] = this[method].bind(this);
      });
  }

  // 异步错误处理包装器
  catchAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // 成功响应
  success(res, data = null, message = '操作成功', statusCode = 200) {
    ResponseUtil.success(res, data, message, statusCode);
  }

  // 分页响应
  paginate(res, data, total, page, limit) {
    ResponseUtil.page(res, { list: data, total, page, pageSize: limit });
  }

  // 错误响应
  error(message = '操作失败', statusCode = 400, errors = null) {
    throw new AppError(message, statusCode);
  }

  // 404错误
  notFound(message = '资源未找到') {
    throw new NotFoundError(message);
  }

  // 记录信息日志
  logInfo(message, meta = {}) {
    logger.info(message, { context: this.constructor.name, ...meta });
  }

  // 记录警告日志
  logWarn(message, meta = {}) {
    logger.warn(message, { context: this.constructor.name, ...meta });
  }

  // 记录错误日志
  logError(error, meta = {}) {
    logger.logError(error, this.constructor.name, meta);
  }

  // 记录业务操作日志
  logBusiness(action, message, meta = {}) {
    logger.logBusiness(action, message, { 
      context: this.constructor.name,
      ...meta 
    });
  }

  // 记录数据库操作日志
  logDatabase(operation, sql, params, result) {
    logger.logDatabase(operation, sql, params, result);
  }

  // 记录性能日志
  logPerformance(operation, duration, meta = {}) {
    logger.logPerformance(operation, duration, {
      context: this.constructor.name,
      ...meta
    });
  }

  // 记录安全相关日志
  logSecurity(event, meta = {}) {
    logger.logSecurity(event, {
      context: this.constructor.name,
      ...meta
    });
  }

  // 获取分页参数
  getPaginationParams(req) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  // 获取排序参数
  getSortParams(req) {
    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    
    return { [sortField]: sortOrder };
  }

  // 获取搜索参数
  getSearchParams(req, searchFields = []) {
    const searchTerm = req.query.search;
    if (!searchTerm || !searchFields.length) return {};

    return {
      $or: searchFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }))
    };
  }
}

module.exports = BaseController; 