const { validationResult } = require('express-validator');
const ResponseUtil = require('../utils/responseUtil');

/**
 * 统一的参数验证中间件
 * @param {Array} validations - 验证规则数组
 * @returns {Function} Express中间件
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // 执行所有验证
    await Promise.all(validations.map(validation => validation.run(req)));

    // 获取验证结果
    const errors = validationResult(req);
    
    // 如果没有错误，继续
    if (errors.isEmpty()) {
      return next();
    }

    // 获取第一个错误信息
    const firstError = errors.array()[0];
    
    // 返回验证错误响应
    ResponseUtil.error(res, firstError.msg, 400);
  };
};

/**
 * 常用验证规则
 */
const rules = {
  // 用户相关验证规则
  user: {
    username: {
      notEmpty: {
        errorMessage: '用户名不能为空'
      },
      isLength: {
        options: { min: 3, max: 20 },
        errorMessage: '用户名长度必须在3-20个字符之间'
      }
    },
    password: {
      notEmpty: {
        errorMessage: '密码不能为空'
      },
      isLength: {
        options: { min: 6, max: 20 },
        errorMessage: '密码长度必须在6-20个字符之间'
      }
    },
    email: {
      notEmpty: {
        errorMessage: '邮箱不能为空'
      },
      isEmail: {
        errorMessage: '邮箱格式不正确'
      }
    }
  },
  
  // 分页相关验证规则
  pagination: {
    page: {
      optional: true,
      isInt: {
        options: { min: 1 },
        errorMessage: '页码必须大于0'
      },
      toInt: true
    },
    pageSize: {
      optional: true,
      isInt: {
        options: { min: 1, max: 100 },
        errorMessage: '每页条数必须在1-100之间'
      },
      toInt: true
    }
  }
};

module.exports = {
  validate,
  rules
}; 