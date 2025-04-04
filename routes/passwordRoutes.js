const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { validate } = require('../middleware/validator');

// 发送密码重置验证码（新方式）
router.post('/send-reset-code', [
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  validate([])
], userController.sendPasswordResetCode);

// 使用验证码重置密码（新方式）
router.post('/reset-with-code', [
  body('email').isEmail().withMessage('请提供有效的邮箱地址'),
  body('verificationCode').notEmpty().withMessage('验证码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少需要6个字符'),
  validate([])
], userController.resetPasswordWithCode);

module.exports = router; 