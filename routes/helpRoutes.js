const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const auth = require('../middleware/auth');
const identityCheck = require('../middleware/identityCheck');
const upload = require('../config/multer');
const { validate } = require('../middleware/validator');
const { body, query, param } = require('express-validator');

// 参数验证规则
const postValidation = [
  body('title').trim().notEmpty().withMessage('标题不能为空')
    .isLength({ min: 5, max: 100 }).withMessage('标题长度应在5-100字符之间'),
  body('content').trim().notEmpty().withMessage('内容不能为空')
    .isLength({ min: 10 }).withMessage('内容至少需要10个字符'),
  body('category_id').isInt().withMessage('分类ID必须是整数'),
  body('images').optional().isArray().withMessage('图片必须是数组格式')
];

const answerValidation = [
  param('postId').isInt().withMessage('帖子ID必须是整数'),
  body('content').trim().notEmpty().withMessage('回答内容不能为空')
    .isLength({ min: 10 }).withMessage('回答内容至少需要10个字符'),
  body('images').optional().isArray().withMessage('图片必须是数组格式')
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('category_id').optional().isInt().withMessage('分类ID必须是整数'),
  query('status').optional().isIn([0, 1, 2]).withMessage('状态值无效')
];

// 文件上传路由
router.post(
  '/upload',
  auth,
  upload.array('images', 5),
  helpController.uploadImages
);

// 获取分类列表
router.get('/categories', helpController.getCategoryList);

// 创建求助帖子
router.post(
  '/posts',
  auth,
  validate(postValidation),
  helpController.createPost
);

// 获取求助列表
router.get(
  '/posts',
  validate(listValidation),
  helpController.getPostList
);

// 获取求助详情
router.get(
  '/posts/:postId',
  param('postId').isInt().withMessage('无效的帖子ID'),
  helpController.getPostDetail
);

// 更新求助状态（仅作者）
router.put(
  '/posts/:postId/status',
  auth,
  [
    param('postId').isInt().withMessage('帖子ID必须是整数'),
    body('status').isIn([0, 1, 2]).withMessage('状态值无效')
  ],
  validate([]),
  helpController.updatePostStatus
);

// 创建回答（仅专家）
router.post(
  '/posts/:postId/answers',
  auth,
  identityCheck('EXPERT'),
  validate(answerValidation),
  helpController.createAnswer
);

// 获取回答列表
router.get(
  '/posts/:postId/answers',
  param('postId').isInt().withMessage('无效的帖子ID'),
  helpController.getAnswerList
);

// 采纳回答（仅帖子作者）
router.put(
  '/posts/:postId/answers/:answerId/accept',
  auth,
  [
    param('postId').isInt().withMessage('帖子ID必须是整数'),
    param('answerId').isInt().withMessage('回答ID必须是整数')
  ],
  validate([]),
  helpController.acceptAnswer
);

// 删除回答（仅回答作者）
router.delete(
  '/posts/:postId/answers/:answerId',
  auth,
  [
    param('postId').isInt().withMessage('帖子ID必须是整数'),
    param('answerId').isInt().withMessage('回答ID必须是整数')
  ],
  validate([]),
  helpController.deleteAnswer
);

module.exports = router; 