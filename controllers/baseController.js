const ApiResponse = require('../utils/response');
const { AppError, NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

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
    res.status(statusCode).json(ApiResponse.success(data, message));
  }

  // 分页响应
  paginate(res, data, total, page, limit) {
    res.status(200).json(ApiResponse.pagination(data, total, page, limit));
  }

  // 错误响应
  error(message = '操作失败', statusCode = 400, errors = null) {
    throw new AppError(message, statusCode);
  }

  // 404错误
  notFound(message = '���源未找到') {
    throw new NotFoundError(message);
  }

  // 记录信息日志
  logInfo(message, meta = {}) {
    logger.info(message, meta);
  }

  // 记录警告日志
  logWarn(message, meta = {}) {
    logger.warn(message, meta);
  }

  // 记录错误日志
  logError(message, error) {
    logger.error(message, {
      message: error.message,
      stack: error.stack,
      ...error
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