const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// 会话管理接口
router.post('/sessions', auth, aiChatController.createSession);
router.get('/sessions', auth, aiChatController.getUserSessions);
router.delete('/sessions/:sessionId', auth, aiChatController.deleteSession);
router.post('/sessions/:sessionId/clear', auth, aiChatController.clearSessionMessages);
router.get('/sessions/:sessionId/messages', auth, aiChatController.getSessionMessages);

// POST方法 - 用于常规fetch/axios请求
router.post('/chat', auth, aiChatController.chat);

// 添加GET方法的聊天接口，支持EventSource API
// 接收query参数messages (需要URL编码的JSON字符串)和token
router.get('/chat/stream', (req, res) => {
  try {
    // 从URL参数中获取token
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ error: '未授权，缺少令牌' });
    }

    // 验证JWT令牌
    try {
      // 直接使用环境变量中的JWT密钥
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userData = decoded;
    } catch (err) {
      return res.status(401).json({ error: '无效的令牌' });
    }

    // 从query参数中解析参数
    try {
      let messages, sessionId;
      
      // 解析messages
      const messagesStr = req.query.messages;
      if (messagesStr) {
        messages = JSON.parse(decodeURIComponent(messagesStr));
      } else {
        return res.status(400).json({ error: '缺少messages参数' });
      }
      
      // 解析sessionId（可选）
      if (req.query.sessionId) {
        sessionId = req.query.sessionId;
      }
      
      // 将解析后的参数添加到请求体中
      req.body = { messages, sessionId };
    } catch (e) {
      return res.status(400).json({ error: '参数格式错误' });
    }
    
    // 调用原有控制器方法
    aiChatController.chat(req, res);
  } catch (error) {
    console.error('处理GET请求出错:', error);
    return res.status(500).json({ error: '处理请求时出错' });
  }
});

module.exports = router; 