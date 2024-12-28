const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const userManageController = require('../../controllers/admin/userManageController');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const validate = require('../../middleware/validator');

// 查询参数验证
const listValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('startDate').optional().isDate().withMessage('开始日期格式不正确'),
    query('endDate').optional().isDate().withMessage('结束日期格式不正确')
];

// 用户ID参数验证
const userIdValidation = [
    param('userId').isInt({ min: 1 }).withMessage('无效的用户ID')
];

// 用户状态验证
const statusValidation = [
    body('status')
        .isBoolean({ strict: true })
        .withMessage('状态值必须是布尔类型(true/false)')
];

// 获取用户列表
router.get('/', 
    checkPermission('user:list'),
    validate(listValidation),
    userManageController.getUserList
);

// 获取用户统计数据
router.get('/stats/overview',
    checkPermission('user:stats'),
    userManageController.getUserStats
);

// 获取用户详情
router.get('/:userId',
    checkPermission('user:detail'),
    validate(userIdValidation),
    userManageController.getUserDetail
);

// 禁用/启用用户
router.put('/:userId/status',
    checkPermission('user:update'),
    validate(userIdValidation),
    validate(statusValidation),
    userManageController.toggleUserStatus
);

// 删除用户
router.delete('/:userId',
    checkPermission('user:delete'),
    validate(userIdValidation),
    userManageController.deleteUser
);

module.exports = router; 