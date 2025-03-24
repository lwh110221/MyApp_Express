class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = '没有权限') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源未找到') {
    super(message, 404);
  }
}

// 添加 BusinessError 类
class BusinessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = 400;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BusinessError
}; 