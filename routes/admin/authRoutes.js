const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminAuthController = require('../../controllers/admin/authController');
const { verifyAdminToken } = require('../../middleware/admin/authMiddleware');
const validate = require('../../middleware/validator');

// 登录验证规则
const loginValidation = [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
];

// 密码修改验证规则
const changePasswordValidation = [
    body('oldPassword').notEmpty().withMessage('原密码不能为空'),
    body('newPassword')
        .notEmpty().withMessage('新密码不能为空')
        .isLength({ min: 6 }).withMessage('密码长度不能少于6位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
        .withMessage('密码必须包含大小写字母和数字')
];

// 登录
router.post('/login', validate(loginValidation), adminAuthController.login);

// 获取当前管理员信息（需要验证token）
router.get('/profile', verifyAdminToken, adminAuthController.getProfile);

// 修改密码（需要验证token）
router.put('/password', verifyAdminToken, validate(changePasswordValidation), adminAuthController.changePassword);

module.exports = router; 