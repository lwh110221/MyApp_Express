const express = require('express');
const router = express.Router();
const { param, query, body } = require('express-validator');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const captchaController = require('../controllers/captchaController');
const upload = require('../config/multer');
const { validate } = require('../middleware/validator');

// 发送邮箱验证码（用于注册）
router.post('/send-verification-code', [
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  validate([])
], userController.sendEmailVerificationCode);

// 注册新用户
router.post('/register', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  // 允许使用verificationCode或captcha
  body(['verificationCode', 'captcha']).custom((value, { req }) => {
    if (!req.body.verificationCode && !req.body.captcha) {
      throw new Error('验证码不能为空');
    }
    return true;
  }),
  body('phone').optional(),
  validate([])
], userController.register);

// 用户登录
router.post('/login', userController.login);

// 获取用户信息（需要认证）
router.get('/profile', auth, userController.getProfile);

// 更新用户信息（需要认证）
router.put('/profile', auth, userController.updateProfile);

// 更新用户头像（需要认证）
router.put(
  '/profile/avatar', 
  auth, 
  upload.single('avatar'),
  userController.updateAvatar
);

// 修改密码（需要认证和验证码验证）
router.put('/password', 
  auth, 
  captchaController.verifyCaptcha, 
  userController.changePassword
);

// 忘记密码 - 发送重置邮件
router.post(
  '/forgot-password',
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  validate([]),
  userController.forgotPassword
);

// 验证重置密码令牌
router.get(
  '/reset-password/:token/validate',
  param('token').isString().withMessage('无效的重置令牌'),
  validate([]),
  userController.validateResetToken
);

// 重置密码
router.post(
  '/reset-password',
  body('token').isString().withMessage('无效的重置令牌'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6个字符'),
  validate([]),
  userController.resetPassword
);

// 获取用户积分（需要认证）
router.get('/points', auth, userController.getPoints);

// === 新增接口 ===

// 获取用户积分记录（需要认证）
router.get('/points/records',
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  validate([]),
  userController.getPointRecords
);

// 获取用户主页资料（可选认证）
router.get('/:userId/profile',
  param('userId').isInt().withMessage('无效的用户ID'),
  validate([]),
  (req, res, next) => {
    // 可选认证中间件
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = decoded;
      }
      next();
    } catch (error) {
      // 忽略认证错误，作为匿名用户继续
      next();
    }
  },
  userController.getUserProfile
);

// 关注用户（需要认证）
router.post('/:userId/follow',
  auth,
  param('userId').isInt().withMessage('无效的用户ID'),
  validate([]),
  userController.followUser
);

// 取消关注用户（需要认证）
router.post('/:userId/unfollow',
  auth,
  param('userId').isInt().withMessage('无效的用户ID'),
  validate([]),
  userController.unfollowUser
);

// 获取用户关注列表
router.get('/:userId/following',
  param('userId').isInt().withMessage('无效的用户ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  validate([]),
  userController.getFollowingList
);

// 获取用户粉丝列表
router.get('/:userId/followers',
  param('userId').isInt().withMessage('无效的用户ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是大于0的整数'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间'),
  validate([]),
  userController.getFollowersList
);

// 临时调试路由 - 仅供开发环境使用
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/check-code', userController.debug_checkCode);
}

module.exports = router; 