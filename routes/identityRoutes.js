const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');
const auth = require('../middleware/auth');

// 公开接口
router.get('/types', identityController.getIdentityTypes.bind(identityController));

// 需要用户登录的接口
router.get('/my', auth, identityController.getUserIdentities.bind(identityController));
router.post('/apply', auth, identityController.applyCertification.bind(identityController));

module.exports = router; 