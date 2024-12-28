const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const logManageController = require('../../controllers/admin/logManageController');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const validate = require('../../middleware/validator');

// 查询参数验证
const listValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('startDate').optional().isDate().withMessage('开始日期格式不正确'),
    query('endDate').optional().isDate().withMessage('结束日期格式不正确')
];

// 日期验证
const dateValidation = [
    body('beforeDate').isDate().withMessage('日期格式不正确')
];

// 获取操作日志列表
router.get('/',
    checkPermission('log:list'),
    validate(listValidation),
    logManageController.getLogList
);

// 获取日志统计数据
router.get('/stats',
    checkPermission('log:stats'),
    logManageController.getLogStats
);

// 清理日志
router.post('/clean',
    checkPermission('log:clean'),
    validate(dateValidation),
    logManageController.cleanLogs
);

module.exports = router; 