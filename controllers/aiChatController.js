const sparkService = require('../services/sparkService');

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.error('消息格式不正确', 400);
    }
    
    // 设置响应头，支持SSE和CORS
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲
    res.setHeader('Transfer-Encoding', 'chunked'); // 使用分块传输编码
    
    // CORS头部 - 确保与前端域匹配
    const allowedOrigin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // 禁用response缓冲
    res.flushHeaders();
    
    // 响应初始化
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);
    
    let fullContent = ''; // 用于累积完整的响应内容
    
    // 使用星火服务进行聊天，流式返回结果
    sparkService.streamChat(
      messages,
      (content) => {
        // 累积内容
        fullContent += content;
        
        // 发送增量数据 - 确保格式严格符合SSE规范
        res.write(`data: ${JSON.stringify({ 
          type: 'update',
          content: content,
          fullContent: fullContent
        })}\n\n`);
        
        // 立即刷新响应，确保不缓冲
        if (res.flush) {
          res.flush();
        }
      },
      (error) => {
        // 发送错误
        console.error('聊天出错:', error);
        res.write(`data: ${JSON.stringify({ 
          type: 'error',
          error: error.message
        })}\n\n`);
        res.end();
      },
      () => {
        // 结束响应
        res.write(`data: ${JSON.stringify({ 
          type: 'end',
          fullContent: fullContent
        })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    console.error('AI聊天请求处理出错:', error);
    return res.error('处理聊天请求时出错', 500);
  }
};