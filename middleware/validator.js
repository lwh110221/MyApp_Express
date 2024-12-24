const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');
const logger = require('../config/logger');

const validate = (validations) => {
  return async (req, res, next) => {
    // 执行所有验证
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // 记录验证错误
    logger.warn('请求验证失败', {
      path: req.path,
      method: req.method,
      errors: errors.array()
    });

    // 格式化错误信息
    const formattedErrors = errors.array().reduce((acc, error) => {
      if (!acc[error.path]) {
        acc[error.path] = [];
      }
      acc[error.path].push(error.msg);
      return acc;
    }, {});

    // 抛出验证错误
    next(new ValidationError('请求参数验证失败', formattedErrors));
  };
};

module.exports = validate; 