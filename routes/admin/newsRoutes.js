const express = require('express');
const router = express.Router();
const { newsController, upload } = require('../../controllers/admin/newsController');
const { verifyAdminToken, checkPermission } = require('../../middleware/admin/authMiddleware');

// 新闻分类管理
router.get('/categories', 
    verifyAdminToken,
    checkPermission('news:category:manage'),
    newsController.getCategoryList.bind(newsController)
);

router.post('/categories',
    verifyAdminToken,
    checkPermission('news:category:manage'),
    newsController.createCategory.bind(newsController)
);

router.put('/categories/:categoryId',
    verifyAdminToken,
    checkPermission('news:category:manage'),
    newsController.updateCategory.bind(newsController)
);

router.delete('/categories/:categoryId',
    verifyAdminToken,
    checkPermission('news:category:manage'),
    newsController.deleteCategory.bind(newsController)
);

// 新闻文章管理
router.get('/articles',
    verifyAdminToken,
    checkPermission('news:article:manage'),
    newsController.getArticleList.bind(newsController)
);

router.get('/articles/:articleId',
    verifyAdminToken,
    checkPermission('news:article:manage'),
    newsController.getArticleDetail.bind(newsController)
);

router.post('/articles',
    verifyAdminToken,
    checkPermission('news:article:manage'),
    newsController.createArticle.bind(newsController)
);

router.put('/articles/:articleId',
    verifyAdminToken,
    checkPermission('news:article:manage'),
    newsController.updateArticle.bind(newsController)
);

router.delete('/articles/:articleId',
    verifyAdminToken,
    checkPermission('news:article:manage'),
    newsController.deleteArticle.bind(newsController)
);

// 文章状态管理
router.put('/articles/:articleId/publish',
    verifyAdminToken,
    checkPermission('news:publish'),
    newsController.updateArticlePublishStatus.bind(newsController)
);

router.put('/articles/:articleId/featured',
    verifyAdminToken,
    checkPermission('news:article:manage'),
    newsController.updateArticleFeaturedStatus.bind(newsController)
);

// 图片上传
router.post('/upload',
    verifyAdminToken,
    checkPermission('news:article:manage'),
    upload.single('image'),
    newsController.uploadImage.bind(newsController)
);

module.exports = router; 