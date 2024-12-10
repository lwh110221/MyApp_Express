const express = require('express');
const router = express.Router();
const momentController = require('../controllers/momentController');
const auth = require('../middleware/auth');
const upload = require('../config/multer');

// 发布动态(支持多图上传)
router.post('/', 
  auth, 
  upload.array('images', 9), // 最多9张图片
  momentController.createMoment
);

// 获取用户动态列表
router.get('/user/:userId?', auth, momentController.getMoments);

// 删除动态
router.delete('/:momentId', auth, momentController.deleteMoment);

module.exports = router; 