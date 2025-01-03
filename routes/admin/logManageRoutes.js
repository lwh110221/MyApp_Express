const express = require('express');
const router = express.Router();
const logManageController = require('../../controllers/admin/logManageController');
const { checkPermission } = require('../../middleware/admin/authMiddleware');

// 获取操作日志列表
router.get('/', checkPermission('log:list'), logManageController.getLogList);

// 获取日志统计数据
router.get('/stats', checkPermission('log:stats'), logManageController.getLogStats);

// 清理日志
router.post('/clean', checkPermission('log:clean'), logManageController.cleanLogs);

module.exports = router; 