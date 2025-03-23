const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validator');
const { body, query, param } = require('express-validator');
const helpController = require('../controllers/helpController');
const auth = require('../middleware/auth');
const identityCheck = require('../middleware/identityCheck');
const upload = require('../config/multer');

// 参数验证规则
const postValidation = [
    body('title').trim().notEmpty().withMessage('标题不能为空')
        .isLength({ max: 100 }).withMessage('标题最多100字符'),
    body('content').trim().notEmpty().withMessage('内容不能为空')
        .isLength({ max: 2000 }).withMessage('内容最多2000字符'),
    body('category_id').isInt().withMessage('分类ID必须是整数'),
    body('images').optional().isArray().withMessage('图片必须是数组格式')
];

const answerValidation = [
    body('content').trim().notEmpty().withMessage('回答内容不能为空')
        .isLength({ max: 2000 }).withMessage('内容最多2000字符'),
    body('images').optional().isArray().withMessage('图片必须是数组格式')
];

// 上传图片
router.post('/upload', 
    auth,
    upload.array('images', 5), // 最多上传5张图片
    helpController.uploadImages
);

// 获取分类列表
router.get('/categories', helpController.getCategoryList);

// 创建求助帖子
router.post('/posts',
    auth,
    validate(postValidation),
    helpController.createPost
);

// 获取求助帖子列表
router.get('/posts',
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    helpController.getPostList
);

// 获取帖子详情
router.get('/posts/:postId',
    param('postId').isInt().withMessage('无效的帖子ID'),
    helpController.getPostDetail
);

// 更新帖子状态
router.put('/posts/:postId/status',
    auth,
    param('postId').isInt().withMessage('无效的帖子ID'),
    body('status').isIn([0, 1, 2]).withMessage('无效的状态值'),
    helpController.updatePostStatus
);

// 回答帖子
router.post('/posts/:postId/answers',
    auth,
    identityCheck('EXPERT'),
    param('postId').isInt().withMessage('无效的帖子ID'),
    validate(answerValidation),
    helpController.createAnswer
);

// 获取帖子的回答列表
router.get('/posts/:postId/answers',
    param('postId').isInt().withMessage('无效的帖子ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
    helpController.getAnswerList
);

// 采纳回答
router.put('/answers/:answerId/accept',
    auth,
    param('answerId').isInt().withMessage('无效的回答ID'),
    helpController.acceptAnswer
);

// 删除回答
router.delete('/answers/:answerId',
    auth,
    param('answerId').isInt().withMessage('无效的回答ID'),
    helpController.deleteAnswer
);

module.exports = router; 