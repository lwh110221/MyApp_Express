const express = require('express');
const router = express.Router();
const helpManageController = require('../../controllers/admin/helpManageController');
const auth = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const { validate } = require('../../middleware/validator');
const { body, param } = require('express-validator');

// 分类验证规则
const categoryValidation = [
  body('name').trim().notEmpty().withMessage('分类名称不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('分类名称长度应在2-50字符之间'),
  body('description').optional()
    .isLength({ max: 200 }).withMessage('描述不能超过200字符'),
  body('sort_order').optional()
    .isInt({ min: 0 }).withMessage('排序值必须是非负整数'),
  body('status').optional()
    .isIn([0, 1]).withMessage('状态值无效')
];

// 获取分类列表
router.get(
  '/categories',
  auth,
  checkPermission('help:category:list'),
  helpManageController.getCategoryList
);

// 创建分类
router.post(
  '/categories',
  auth,
  checkPermission('help:category:create'),
  validate(categoryValidation),
  helpManageController.createCategory
);

// 更新分类
router.put(
  '/categories/:categoryId',
  auth,
  checkPermission('help:category:update'),
  param('categoryId').isInt().withMessage('无效的分类ID'),
  validate(categoryValidation),
  helpManageController.updateCategory
);

// 删除分类
router.delete(
  '/categories/:categoryId',
  auth,
  checkPermission('help:category:delete'),
  param('categoryId').isInt().withMessage('无效的分类ID'),
  helpManageController.deleteCategory
);

// 获取帖子列表
router.get(
  '/posts',
  auth,
  checkPermission('help:post:list'),
  helpManageController.getPostList
);

// 更新帖子状态
router.put(
  '/posts/:postId/status',
  auth,
  checkPermission('help:post:manage'),
  [
    param('postId').isInt().withMessage('帖子ID必须是整数'),
    body('status').isIn([0, 1, 2]).withMessage('状态值无效')
  ],
  validate([]),
  helpManageController.updatePostStatus
);

module.exports = router; 