const express = require('express');
const router = express.Router();
const communityManageController = require('../../controllers/admin/communityManageController');
const auth = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/admin/authMiddleware');
const { validate } = require('../../middleware/validator');
const { body, query, param } = require('express-validator');

// 获取帖子列表
router.get('/posts',
    auth,
    checkPermission('community:post:manage'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    validate([]),
    communityManageController.getPostList
);

// 更新帖子状态
router.put('/posts/:postId/status',
    auth,
    checkPermission('community:post:manage'),
    param('postId').isInt().withMessage('无效的帖子ID'),
    body('status').isIn([0, 1]).withMessage('无效的状态值'),
    validate([]),
    communityManageController.updatePostStatus
);

// 获取评论列表
router.get('/comments',
    auth,
    checkPermission('community:comment:manage'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    validate([]),
    communityManageController.getCommentList
);

// 更新评论状态
router.put('/comments/:commentId/status',
    auth,
    checkPermission('community:comment:manage'),
    param('commentId').isInt().withMessage('无效的评论ID'),
    body('status').isIn([0, 1]).withMessage('无效的状态值'),
    validate([]),
    communityManageController.updateCommentStatus
);

module.exports = router; 