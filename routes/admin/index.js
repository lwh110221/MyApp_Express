const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../../middleware/admin/authMiddleware');

// 导入各个模块的路由
const authRoutes = require('./authRoutes');
const adminManageRoutes = require('./adminManageRoutes');
const userManageRoutes = require('./userManageRoutes');
const momentManageRoutes = require('./momentManageRoutes');
const newsRoutes = require('./newsRoutes');

// 注册路由
router.use('/auth', authRoutes);

// 添加全局管理员认证中间件（除了 /auth 路由外）
router.use(verifyAdminToken);

// 需要认证的路由
router.use('/admins', adminManageRoutes);
router.use('/users', userManageRoutes);
router.use('/moments', momentManageRoutes);
router.use('/news', newsRoutes);

module.exports = router; 