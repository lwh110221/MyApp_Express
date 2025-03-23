const express = require('express');
const router = express.Router();
const tagManageController = require('../../controllers/admin/tagManageController');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const { validate } = require('../../middleware/validator');
const { body, query, param } = require('express-validator');

// 获取标签列表
router.get('/',
    // checkPermission('community:tag:manage'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    query('status').optional().isIn(['0', '1']).withMessage('状态值无效'),
    validate([]),
    tagManageController.getTagList
);

// 创建标签
router.post('/',
    body('name').trim().notEmpty().withMessage('标签名称不能为空')
        .isLength({ max: 50 }).withMessage('标签名称最多50字符'),
    validate([]),
    tagManageController.createTag
);

// 更新标签
router.put('/:tagId',
    // checkPermission('community:tag:manage'),
    param('tagId').isInt().withMessage('无效的标签ID'),
    body('name').optional().trim().notEmpty().withMessage('标签名称不能为空')
        .isLength({ max: 50 }).withMessage('标签名称最多50字符'),
    body('status').optional().isIn(['0', '1']).withMessage('状态值无效'),
    validate([]),
    tagManageController.updateTag
);

// 删除标签
router.delete('/:tagId',
    // checkPermission('community:tag:manage'),
    param('tagId').isInt().withMessage('无效的标签ID'),
    validate([]),
    tagManageController.deleteTag
);

// 获取标签使用报告
router.get('/report',
    checkPermission('community:tag:manage'),
    validate([]),
    tagManageController.getTagUsageReport
);

module.exports = router; 