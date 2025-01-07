const winston = require('winston');
const path = require('path');

/**
 * 自定义日志格式
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, context, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    
    // 添加上下文信息
    if (context) {
      log += ` [${context}]`;
    }
    
    log += `: ${message}`;
    
    // 添加错误堆栈
    if (stack) {
      log += `\n${stack}`;
    }
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// 创建日志目录
const logDir = path.join(__dirname, '../logs');

/**
 * 日志工具类
 */
class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports: [
        // 错误日志
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // 所有日志
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // 访问日志
        new winston.transports.File({
          filename: path.join(logDir, 'access.log'),
          level: 'http',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      ]
    });

    // 非生产环境下添加控制台输出
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  /**
   * 记录请求日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  logRequest(req, res) {
    const { method, originalUrl, ip, body, query } = req;
    this.logger.http('HTTP Request', {
      context: 'Request',
      method,
      url: originalUrl,
      ip,
      body: method !== 'GET' ? body : undefined,
      query: Object.keys(query).length ? query : undefined,
      user: req.userData?.userId || req.admin?.id || 'anonymous'
    });
  }

  /**
   * 记录响应日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Object} responseBody - 响应体
   */
  logResponse(req, res, responseBody) {
    const { method, originalUrl } = req;
    this.logger.http('HTTP Response', {
      context: 'Response',
      method,
      url: originalUrl,
      statusCode: res.statusCode,
      responseTime: res.get('X-Response-Time'),
      response: responseBody
    });
  }

  /**
   * 记录错误日志
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @param {Object} meta - 额外的元数据
   */
  logError(error, context = 'Application', meta = {}) {
    this.logger.error(error.message, {
      context,
      stack: error.stack,
      ...meta
    });
  }

  /**
   * 记录数据库操作日志
   * @param {string} operation - 操作类型
   * @param {string} sql - SQL语句
   * @param {Array} params - SQL参数
   * @param {Object} result - 操作结果
   */
  logDatabase(operation, sql, params, result) {
    this.logger.debug('Database Operation', {
      context: 'Database',
      operation,
      sql,
      params,
      result: typeof result === 'object' ? JSON.stringify(result) : result
    });
  }

  /**
   * 记录业务操作日志
   * @param {string} action - 操作动作
   * @param {string} message - 日志消息
   * @param {Object} meta - 额外的元数据
   */
  logBusiness(action, message, meta = {}) {
    this.logger.info(message, {
      context: 'Business',
      action,
      ...meta
    });
  }

  /**
   * 记录性能日志
   * @param {string} operation - 操作名称
   * @param {number} duration - 持续时间(ms)
   * @param {Object} meta - 额外的元数据
   */
  logPerformance(operation, duration, meta = {}) {
    this.logger.info(`Performance: ${operation} took ${duration}ms`, {
      context: 'Performance',
      operation,
      duration,
      ...meta
    });
  }

  /**
   * 记录安全相关日志
   * @param {string} event - 安全事件
   * @param {Object} meta - 额外的元数据
   */
  logSecurity(event, meta = {}) {
    this.logger.warn(event, {
      context: 'Security',
      ...meta
    });
  }

  // 代理原始winston方法
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

// 导出单例
module.exports = new Logger(); 