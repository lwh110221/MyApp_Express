const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

// 所有聊天相关的路由都需要登录
router.use(auth);

// 获取聊天会话列表
router.get('/sessions', chatController.getSessionList);

// 获取与特定用户的聊天记录
router.get('/history/:partnerId', chatController.getChatHistory);

// 发送消息
router.post('/message', chatController.sendMessage);

// 上传聊天图片
router.post('/upload/image', upload.single('image'), chatController.uploadImage);

// 标记会话消息为已读
router.put('/sessions/:sessionId/read', chatController.markAsRead);

// 获取未读消息数量
router.get('/unread', chatController.getUnreadCount);

// 删除会话
router.delete('/sessions/:sessionId', chatController.deleteSession);

// 搜索聊天记录
router.get('/search', chatController.searchMessages);

module.exports = router; 