const { AppError, ValidationError } = require('../utils/errors');
const logger = require('../config/logger');

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // 处理验证错误
    if (err instanceof ValidationError) {
        return res.status(400).json({
            code: 400,
            message: err.message,
            errors: err.errors
        });
    }

    // 处理已知的操作错误
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            code: err.statusCode,
            message: err.message
        });
    }

    // 处理JWT错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            code: 401,
            message: '无效的认证令牌'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            code: 401,
            message: '认证令牌已过期'
        });
    }

    // 处理其他未知错误
    return res.status(500).json({
        code: 500,
        message: process.env.NODE_ENV === 'production' 
            ? '服务器内部错误' 
            : err.message
    });
};

module.exports = errorHandler; 