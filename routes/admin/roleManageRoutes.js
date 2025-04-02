const express = require('express');
const router = express.Router();
const roleManageController = require('../../controllers/admin/roleManageController');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const { validate } = require('../../middleware/validator');
const { body, param } = require('express-validator');

// 角色ID验证
const roleIdValidation = [
  param('roleId').isInt({ min: 1 }).withMessage('无效的角色ID')
];

// 创建角色验证
const createRoleValidation = [
  body('name').notEmpty().withMessage('角色名称不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('角色名称长度应在2-50字符之间'),
  body('code').notEmpty().withMessage('角色编码不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('角色编码长度应在2-50字符之间')
    .matches(/^[a-z][a-z0-9_]*$/).withMessage('角色编码必须以小写字母开头，只能包含小写字母、数字和下划线'),
  body('description').optional()
    .isLength({ max: 200 }).withMessage('角色描述不能超过200字符'),
  body('permissionIds').optional()
    .isArray().withMessage('权限ID必须是数组')
];

// 更新角色验证
const updateRoleValidation = [
  param('roleId').isInt({ min: 1 }).withMessage('无效的角色ID'),
  body('name').notEmpty().withMessage('角色名称不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('角色名称长度应在2-50字符之间'),
  body('description').optional()
    .isLength({ max: 200 }).withMessage('角色描述不能超过200字符'),
  body('status').isIn([0, 1]).withMessage('状态值无效')
];

// 更新角色权限验证
const updatePermissionsValidation = [
  param('roleId').isInt({ min: 1 }).withMessage('无效的角色ID'),
  body('permissionIds').isArray().withMessage('权限ID必须是数组')
];

// 获取角色列表
router.get(
  '/',
  checkPermission('admin:list'),
  roleManageController.getRoleList
);

// 获取所有权限列表(用于角色分配权限)
router.get(
  '/permissions',
  checkPermission('admin:list'),
  roleManageController.getAllPermissions
);

// 获取角色详情
router.get(
  '/:roleId',
  checkPermission('admin:list'),
  validate(roleIdValidation),
  roleManageController.getRoleDetail
);

// 创建角色
router.post(
  '/',
  checkPermission('admin:create'),
  validate(createRoleValidation),
  roleManageController.createRole
);

// 更新角色
router.put(
  '/:roleId',
  checkPermission('admin:update'),
  validate(updateRoleValidation),
  roleManageController.updateRole
);

// 删除角色
router.delete(
  '/:roleId',
  checkPermission('admin:delete'),
  validate(roleIdValidation),
  roleManageController.deleteRole
);

// 更新角色权限
router.put(
  '/:roleId/permissions',
  checkPermission('admin:update'),
  validate(updatePermissionsValidation),
  roleManageController.updateRolePermissions
);

module.exports = router; 