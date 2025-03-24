const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { v4: uuidv4 } = require('uuid');

// 确保日志目录存在
const logDir = path.join(__dirname, '../logs/client');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 错误日志文件名格式：client-error-YYYY-MM-DD.log
const getLogFileName = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return path.join(logDir, `client-error-${today}.log`);
};

/**
 * 记录前端错误日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.logError = async (req, res) => {
  try {
    const { 
      message, 
      source, 
      lineNo, 
      colNo, 
      error, 
      stack, 
      url, 
      userAgent, 
      state = {}
    } = req.body;

    // 获取用户信息（如果已登录）
    const userId = req.userData ? req.userData.userId : '未登录';
    
    // 生成唯一错误ID
    const errorId = uuidv4();
    
    // 格式化日志内容
    const logEntry = {
      id: errorId,
      timestamp: new Date().toISOString(),
      userId,
      userIp: req.ip || req.connection.remoteAddress,
      url,
      userAgent,
      message,
      source,
      location: `行号:${lineNo}, 列号:${colNo}`,
      stack: stack || (error ? JSON.stringify(error) : '无堆栈信息'),
      state: JSON.stringify(state)
    };

    // 写入日志文件
    const logFileName = getLogFileName();
    fs.appendFileSync(
      logFileName, 
      JSON.stringify(logEntry) + '\n'
    );

    // 记录到控制台
    console.error(`[前端错误] ${message} - ID: ${errorId}`);
    
    // 响应客户端
    return res.success({
      errorId,
      message: '错误已记录'
    });
  } catch (err) {
    console.error('处理前端错误日志时出错:', err);
    return res.error('处理错误日志失败', 500);
  }
};

/**
 * 获取前端错误日志列表 (供管理员查看)
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getErrorLogs = async (req, res) => {
  try {
    const { date, limit = 100 } = req.query;
    
    let fileName;
    if (date) {
      // 如果指定了日期，使用指定日期的日志文件
      fileName = path.join(logDir, `client-error-${date}.log`);
    } else {
      // 否则使用今天的日志文件
      fileName = getLogFileName();
    }

    // 检查文件是否存在
    if (!fs.existsSync(fileName)) {
      return res.success({ logs: [] });
    }

    // 读取并解析日志文件
    const content = fs.readFileSync(fileName, 'utf8');
    const lines = content.trim().split('\n');
    
    // 获取最新的n条日志
    const logs = lines
      .slice(Math.max(0, lines.length - limit))
      .map(line => JSON.parse(line))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return res.success({ logs });
  } catch (err) {
    console.error('获取错误日志失败:', err);
    return res.error('获取错误日志失败', 500);
  }
};
