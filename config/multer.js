const multer = require('multer');
const path = require('path');

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据上传类型选择不同的目录
    const uploadType = req.path.includes('avatar') ? 'avatars' : 'moments';
    cb(null, `public/uploads/${uploadType}`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileType = req.path.includes('avatar') ? 'avatar' : 'moment';
    cb(null, `${fileType}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只能上传图片文件！'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  }
});

module.exports = upload; 