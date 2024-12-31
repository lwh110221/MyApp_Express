const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const adminManageController = require('../../controllers/admin/adminManageController');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const { validate } = require('../../middleware/validator');

// 查询参数验证
const listValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
];

// 创建管理员验证
const createValidation = [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('email').isEmail().withMessage('邮箱格式不正确'),
    body('password')
        .isLength({ min: 6 }).withMessage('密码长度不能少于6位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
        .withMessage('密码必须包含大小写字母和数字'),
    body('roleIds').isArray().withMessage('角色ID必须是数组')
];

// 管理员ID验证
const adminIdValidation = [
    param('adminId').isInt({ min: 1 }).withMessage('无效的管理员ID')
];

// 状态验证
const statusValidation = [
    body('status').isBoolean({ strict: true }).withMessage('状态值必须是布尔类型')
];

// 角色验证
const roleValidation = [
    body('roleIds').isArray().withMessage('角色ID必须是数组')
];

// 获取管理员列表
router.get('/',
    checkPermission('admin:list'),
    validate(listValidation),
    adminManageController.getAdminList
);

// 创建管理员
router.post('/',
    checkPermission('admin:create'),
    validate(createValidation),
    adminManageController.createAdmin
);

// 更新管理员状态
router.put('/:adminId/status',
    checkPermission('admin:update'),
    validate(adminIdValidation),
    validate(statusValidation),
    adminManageController.toggleAdminStatus
);

// 更新管理员角色
router.put('/:adminId/roles',
    checkPermission('admin:update'),
    validate(adminIdValidation),
    validate(roleValidation),
    adminManageController.updateAdminRoles
);

// 删除管理员
router.delete('/:adminId',
    checkPermission('admin:delete'),
    validate(adminIdValidation),
    adminManageController.deleteAdmin
);

module.exports = router; 