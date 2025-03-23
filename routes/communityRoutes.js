const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');
const { validate } = require('../middleware/validator');
const { body, query, param } = require('express-validator');

// 参数验证规则
const postValidation = [
    body('title').trim().notEmpty().withMessage('标题不能为空')
        .isLength({ max: 200 }).withMessage('标题最多200字符'),
    body('content').trim().notEmpty().withMessage('内容不能为空')
        .isLength({ max: 5000 }).withMessage('内容最多5000字符'),
    body('images').optional().isArray().withMessage('图片必须是数组格式')
];

const commentValidation = [
    body('content').trim().notEmpty().withMessage('评论内容不能为空')
        .isLength({ max: 1000 }).withMessage('评论内容最多1000字符'),
    body('images').optional().isArray().withMessage('图片必须是数组格式'),
    body('parent_id').optional().isInt().withMessage('回复ID必须是整数')
];

// 上传图片
router.post('/upload',
    auth,
    upload.array('images', 9), // 最多上传9张图片
    communityController.uploadImages
);

// 获取帖子列表
router.get('/posts',
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    validate([]),
    communityController.getPostList
);

// 获取帖子详情
router.get('/posts/:postId',
    param('postId').isInt().withMessage('无效的帖子ID'),
    validate([]),
    communityController.getPostDetail
);

// 发布帖子
router.post('/posts',
    auth,
    validate(postValidation),
    communityController.createPost
);

// 更新帖子
router.put('/posts/:postId',
    auth,
    param('postId').isInt().withMessage('无效的帖子ID'),
    validate(postValidation),
    communityController.updatePost
);

// 删除帖子
router.delete('/posts/:postId',
    auth,
    param('postId').isInt().withMessage('无效的帖子ID'),
    validate([]),
    communityController.deletePost
);

// 发表评论
router.post('/posts/:postId/comments',
    auth,
    param('postId').isInt().withMessage('无效的帖子ID'),
    validate(commentValidation),
    communityController.createComment
);

// 获取评论列表
router.get('/posts/:postId/comments',
    param('postId').isInt().withMessage('无效的帖子ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    validate([]),
    communityController.getCommentList
);

// 删除评论
router.delete('/comments/:commentId',
    auth,
    param('commentId').isInt().withMessage('无效的评论ID'),
    validate([]),
    communityController.deleteComment
);

// 点赞/取消点赞帖子
router.post('/posts/:postId/like',
    auth,
    param('postId').isInt().withMessage('无效的帖子ID'),
    body('action').isIn(['like', 'unlike']).withMessage('action必须是like或unlike'),
    validate([]),
    communityController.togglePostLike
);

// 点赞/取消点赞评论
router.post('/comments/:commentId/like',
    auth,
    param('commentId').isInt().withMessage('无效的评论ID'),
    body('action').isIn(['like', 'unlike']).withMessage('action必须是like或unlike'),
    validate([]),
    communityController.toggleCommentLike
);

// 检查用户是否已点赞
router.get('/likes/check',
    auth,
    query('targetId').isInt().withMessage('目标ID必须是整数'),
    query('targetType').isIn(['1', '2']).withMessage('目标类型必须是1(帖子)或2(评论)'),
    validate([]),
    communityController.checkUserLike
);

module.exports = router; 