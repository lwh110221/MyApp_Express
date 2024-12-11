const express = require('express');
const router = express.Router();
const captchaController = require('../controllers/captchaController');

// 生成验证码
router.get('/generate', captchaController.generateCaptcha);

module.exports = router; 