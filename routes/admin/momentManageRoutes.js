const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const momentManageController = require('../../controllers/admin/momentManageController');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const validate = require('../../middleware/validator');

// 查询参数验证
const listValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('startDate').optional().isDate().withMessage('开始日期格式不正确'),
    query('endDate').optional().isDate().withMessage('结束日期格式不正确')
];

// 动态ID验证
const momentIdValidation = [
    param('momentId').isInt({ min: 1 }).withMessage('无效的动态ID')
];

// 获取动态列表
router.get('/',
    checkPermission('moment:list'),
    validate(listValidation),
    momentManageController.getMomentList
);

// 删除动态
router.delete('/:momentId',
    checkPermission('moment:delete'),
    validate(momentIdValidation),
    momentManageController.deleteMoment
);

// 获取动态统计数据
router.get('/stats/overview',
    checkPermission('moment:stats'),
    momentManageController.getMomentStats
);

module.exports = router; 