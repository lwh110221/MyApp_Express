const express = require('express');
const router = express.Router();
const aiChatController = require('../controllers/aiChatController');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');

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
      req.user = decoded; // 将解码后的用户信息添加到req对象中
    } catch (err) {
      return res.status(401).json({ error: '无效的令牌' });
    }

    // 从query参数中解析messages
    let messages;
    try {
      const messagesStr = req.query.messages;
      if (!messagesStr) {
        return res.status(400).json({ error: '缺少messages参数' });
      }
      messages = JSON.parse(decodeURIComponent(messagesStr));
    } catch (e) {
      return res.status(400).json({ error: 'messages参数格式错误' });
    }
    
    // 将解析后的messages添加到请求体中
    req.body = { messages };
    
    // 调用原有控制器方法
    aiChatController.chat(req, res);
  } catch (error) {
    console.error('处理GET请求出错:', error);
    return res.status(500).json({ error: '处理请求时出错' });
  }
});

module.exports = router; 