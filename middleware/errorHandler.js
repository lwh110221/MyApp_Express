const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error(new Date().toISOString(), err);

  // 区分不同类型的错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证错误',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: '认证失败'
    });
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? '服务器错误' : err.message
  });
};

module.exports = errorHandler; 