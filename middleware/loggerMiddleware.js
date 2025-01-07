const logger = require('../utils/logger');

/**
 * 请求响应日志中间件
 */
const loggerMiddleware = (req, res, next) => {
  // 记录请求开始时间
  req._startTime = Date.now();

  // 记录请求日志
  logger.logRequest(req, res);

  // 重写 res.json 方法以记录响应
  const originalJson = res.json;
  res.json = function(body) {
    // 计算响应时间
    const responseTime = Date.now() - req._startTime;
    res.set('X-Response-Time', `${responseTime}ms`);

    // 记录响应日志
    logger.logResponse(req, res, body);

    // 调用原始的 json 方法
    return originalJson.call(this, body);
  };

  next();
};

module.exports = loggerMiddleware; 