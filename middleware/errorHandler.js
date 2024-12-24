const { AppError } = require('../utils/errors');
const ApiResponse = require('../utils/response');
const logger = require('../config/logger');

// 开发环境错误处理
const sendErrorDev = (err, res) => {
  logger.error('开发环境错误', {
    message: err.message,
    stack: err.stack,
    status: err.status
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      status: err.status,
      message: err.message,
      stack: err.stack,
      errors: err.errors
    }
  });
};

// 生产环境错误处理
const sendErrorProd = (err, res) => {
  // 可操作的错误，发送详细信息
  if (err.isOperational) {
    logger.error('可操作的错误', {
      message: err.message,
      status: err.status
    });

    res.status(err.statusCode).json(
      ApiResponse.error(err.message, err.statusCode, err.errors)
    );
  } 
  // 编程错误：不泄露错误详情
  else {
    logger.error('未处理的错误', {
      message: err.message,
      stack: err.stack
    });

    res.status(500).json(
      ApiResponse.error('服务器内部错误', 500)
    );
  }
};

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // 处理常见的错误类型
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// 数据库转换错误
const handleCastErrorDB = err => {
  const message = `无效的 ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// 数据库重复字段错误
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `重复的字段值: ${value}。请使用其他值！`;
  return new AppError(message, 400);
};

// 数据库验证错误
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `无效的输入数据。${errors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT 错误
const handleJWTError = () => 
  new AppError('无效的令牌，请重新登录', 401);

// JWT 过期错误
const handleJWTExpiredError = () => 
  new AppError('令牌已过期，请重新登录', 401);

module.exports = errorHandler; 