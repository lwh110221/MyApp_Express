const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const captchaController = require('../controllers/captchaController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');
const { validate } = require('../middleware/validator');
const { param, query } = require('express-validator');

// 用户注册
router.post('/register', captchaController.verifyCaptcha, userController.register);

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

// 获取用户主页资料
router.get('/:userId/profile',
  param('userId').isInt().withMessage('无效的用户ID'),
  validate([]),
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

module.exports = router; 