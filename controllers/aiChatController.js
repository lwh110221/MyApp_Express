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
    
    if (!messages || !Array.isArray(messages)) {
      return res.error('消息格式不正确', 400);
    }
    
    if (sessionId) {
      const session = await chatSessionService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        return res.error('无效的会话ID或无权限', 403);
      }
      
      const historyMessages = await chatSessionService.getMessages(sessionId);
      
      const latestMessage = messages[messages.length - 1];
      messages = historyMessages || [];
      
      messages.push(latestMessage);
    } else {
      sessionId = await chatSessionService.createSession(userId);
    }
    
    // 设置响应头，支持SSE和CORS
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲
    res.setHeader('Transfer-Encoding', 'chunked'); // 使用分块传输编码
    
    const allowedOrigin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // 禁用response缓冲
    res.flushHeaders();
    
    res.write(`data: ${JSON.stringify({ 
      type: 'start',
      sessionId 
    })}\n\n`);
    
    let fullContent = ''; 
    let aiResponse = { role: 'assistant', content: '' };
    
    sparkService.streamChat(
      messages,
      (content) => {
        fullContent += content;
        aiResponse.content = fullContent;
        
        // 发送增量数据SSE规范
        res.write(`data: ${JSON.stringify({ 
          type: 'update',
          content: content,
          fullContent: fullContent,
          sessionId
        })}\n\n`);
        
        if (res.flush) {
          res.flush();
        }
      },
      async (error) => {
        console.error('聊天出错:', error);
        res.write(`data: ${JSON.stringify({ 
          type: 'error',
          error: error.message,
          sessionId
        })}\n\n`);
        res.end();
      },
      async () => {
        const userMessage = messages[messages.length - 1];
        
        if (userMessage.role === 'user') {
          await chatSessionService.addMessage(sessionId, userMessage);
        }
        
        await chatSessionService.addMessage(sessionId, aiResponse);
        
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