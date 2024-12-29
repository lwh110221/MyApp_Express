const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// 获取新闻分类列表
router.get('/categories', newsController.getCategoryList);

// 获取热门新闻（注意：这个路由必须放在 /articles/:articleId 之前）
router.get('/articles/featured', newsController.getFeaturedArticles);

// 获取新闻列表
router.get('/articles', newsController.getArticleList);

// 获取新闻详情
router.get('/articles/:articleId', newsController.getArticleDetail);

// 获取相关新闻推荐
router.get('/articles/:articleId/related', newsController.getRelatedArticles);

module.exports = router; 