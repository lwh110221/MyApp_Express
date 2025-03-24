const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const auth = require('../middleware/auth');
const { verifyAdminToken } = require('../middleware/admin/authMiddleware');

// 接收前端错误日志
router.post('/error', logController.logError);

// 管理员获取错误日志列表
router.get('/errors', verifyAdminToken, logController.getErrorLogs);

module.exports = router;
