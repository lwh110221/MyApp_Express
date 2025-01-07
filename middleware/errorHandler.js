const ErrorHandler = require('../utils/errorHandler');

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  ErrorHandler.handleError(err, req, res);
};

module.exports = errorHandler; 