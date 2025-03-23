const express = require('express');
const router = express.Router();
const { validate } = require('../../middleware/validator');
const { body, query, param } = require('express-validator');
const helpManageController = require('../../controllers/admin/helpManageController');
const { verifyAdminToken, checkPermission } = require('../../middleware/admin/authMiddleware');

// 参数验证规则
const categoryValidation = [
    body('name').trim().notEmpty().withMessage('分类名称不能为空')
        .isLength({ max: 50 }).withMessage('分类名称最多50字符'),
    body('description').optional().isLength({ max: 200 }).withMessage('描述最多200字符'),
    body('sort_order').optional().isInt().withMessage('排序值必须是整数'),
    body('status').optional().isIn([0, 1]).withMessage('状态值无效')
];

// 获取分类列表
router.get('/categories',
    verifyAdminToken,
    checkPermission('help:category:list'),
    helpManageController.getCategoryList
);

// 创建分类
router.post('/categories',
    verifyAdminToken,
    checkPermission('help:category:create'),
    validate(categoryValidation),
    helpManageController.createCategory
);

// 更新分类
router.put('/categories/:categoryId',
    verifyAdminToken,
    checkPermission('help:category:update'),
    param('categoryId').isInt().withMessage('无效的分类ID'),
    validate(categoryValidation),
    helpManageController.updateCategory
);

// 删除分类
router.delete('/categories/:categoryId',
    verifyAdminToken,
    checkPermission('help:category:delete'),
    param('categoryId').isInt().withMessage('无效的分类ID'),
    helpManageController.deleteCategory
);

// 获取求助帖子列表
router.get('/posts',
    verifyAdminToken,
    checkPermission('help:post:list'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    helpManageController.getPostList
);

// 管理求助帖子状态
router.put('/posts/:postId/status',
    verifyAdminToken,
    checkPermission('help:post:manage'),
    param('postId').isInt().withMessage('无效的帖子ID'),
    body('status').isIn([0, 1, 2]).withMessage('无效的状态值'),
    helpManageController.updatePostStatus
);

module.exports = router; 