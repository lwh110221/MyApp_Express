const ResponseUtil = require('../utils/responseUtil');

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error('Error:', err);

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

  // 处理其他已知错误类型
  if (err.status) {
    return ResponseUtil.error(res, err.message, err.status);
  }

  // 处理未知错误
  ResponseUtil.error(res, '服务器内部错误', 500);
};

module.exports = errorHandler; 