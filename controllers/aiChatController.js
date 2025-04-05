const sparkService = require('../services/sparkService');
const chatSessionService = require('../services/chatSessionService');

exports.createSession = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const sessionId = await chatSessionService.createSession(userId);
    
    return res.json({
      code: 200,
      message: '会话创建成功',
      data: { sessionId }
    });
  } catch (error) {
    console.error('创建会话出错:', error);
    return res.error('创建会话失败', 500);
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userData.userId;
    
    // 验证会话所有权
    const session = await chatSessionService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.error('无效的会话或无权限', 403);
    }
    
    const success = await chatSessionService.deleteSession(sessionId);
    
    if (success) {
      return res.json({
        code: 200,
        message: '会话已删除'
      });
    } else {
      return res.error('删除会话失败', 500);
    }
  } catch (error) {
    console.error('删除会话出错:', error);
    return res.error('删除会话失败', 500);
  }
};

exports.clearSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userData.userId;
    
    // 验证会话所有权
    const session = await chatSessionService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.error('无效的会话或无权限', 403);
    }
    
    const success = await chatSessionService.clearMessages(sessionId);
    
    if (success) {
      return res.json({
        code: 200,
        message: '会话消息已清空'
      });
    } else {
      return res.error('清空会话消息失败', 500);
    }
  } catch (error) {
    console.error('清空会话消息出错:', error);
    return res.error('清空会话消息失败', 500);
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.userData.userId;

    // 获取用户会话列表
    const sessions = await chatSessionService.getUserSessions(userId);
    
    res.success({ sessions }, '获取会话列表成功');
  } catch (error) {
    console.error('获取会话列表出错:', error);
    res.error('获取会话列表失败', 500);
  }
};

exports.chat = async (req, res) => {
  try {
    let { messages, sessionId } = req.body;
    const userId = req.userData ? req.userData.userId : (req.user ? req.user.userId : null);
    
    if (!userId) {
      return res.error('用户未认证', 401);
    }
    
    // 验证消息格式
    if (!messages || !Array.isArray(messages)) {
      return res.error('消息格式不正确', 400);
    }
    
    // 处理会话
    if (sessionId) {
      // 验证会话是否存在及所有权
      const session = await chatSessionService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.error('无效的会话ID或无权限', 403);
      }
      
      // 获取会话中的历史消息
      const historyMessages = await chatSessionService.getMessages(sessionId);
      
      // 只发送最新一条用户消息，但使用完整的历史记录
      const latestMessage = messages[messages.length - 1];
      messages = historyMessages || [];
      
      // 确保最新消息被添加到历史消息列表
      messages.push(latestMessage);
    } else {
      // 创建新会话
      sessionId = await chatSessionService.createSession(userId);
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
    
    // 响应初始化，包含sessionId
    res.write(`data: ${JSON.stringify({ 
      type: 'start',
      sessionId 
    })}\n\n`);
    
    let fullContent = ''; // 用于累积完整的响应内容
    let aiResponse = { role: 'assistant', content: '' }; // AI响应消息
    
    // 使用星火服务进行聊天，流式返回结果
    sparkService.streamChat(
      messages,
      (content) => {
        // 累积内容
        fullContent += content;
        aiResponse.content = fullContent;
        
        // 发送增量数据 - 确保格式严格符合SSE规范
        res.write(`data: ${JSON.stringify({ 
          type: 'update',
          content: content,
          fullContent: fullContent,
          sessionId
        })}\n\n`);
        
        // 立即刷新响应，确保不缓冲
        if (res.flush) {
          res.flush();
        }
      },
      async (error) => {
        // 发送错误
        console.error('聊天出错:', error);
        res.write(`data: ${JSON.stringify({ 
          type: 'error',
          error: error.message,
          sessionId
        })}\n\n`);
        res.end();
      },
      async () => {
        // 将用户消息和AI回复保存到会话
        const userMessage = messages[messages.length - 1];
        
        // 保存用户消息和AI回复到Redis
        if (userMessage.role === 'user') {
          await chatSessionService.addMessage(sessionId, userMessage);
        }
        
        // 保存AI回复
        await chatSessionService.addMessage(sessionId, aiResponse);
        
        // 结束响应
        res.write(`data: ${JSON.stringify({ 
          type: 'end',
          fullContent: fullContent,
          sessionId
        })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    console.error('AI聊天请求处理出错:', error);
    return res.error('处理聊天请求时出错', 500);
  }
};

exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userData.userId;
    
    // 验证会话所有权
    const session = await chatSessionService.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.error('无效的会话或无权限', 403);
    }
    
    const messages = await chatSessionService.getMessages(sessionId);
    
    return res.json({
      code: 200,
      message: '获取会话消息成功',
      data: {
        sessionId,
        messages: messages || []
      }
    });
  } catch (error) {
    console.error('获取会话消息出错:', error);
    return res.error('获取会话消息失败', 500);
  }
};