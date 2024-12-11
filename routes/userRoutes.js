const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const captchaController = require('../controllers/captchaController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

// 用户注册
router.post('/register', userController.register);

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

module.exports = router; 