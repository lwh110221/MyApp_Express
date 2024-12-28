const express = require('express');
const router = express.Router();
const { verifyAdminToken, logAdminOperation } = require('../../middleware/admin/authMiddleware');

// 导入路由模块
const authRoutes = require('./authRoutes');
const userManageRoutes = require('./userManageRoutes');
const momentManageRoutes = require('./momentManageRoutes');
const logManageRoutes = require('./logManageRoutes');
const adminManageRoutes = require('./adminManageRoutes');

// 身份验证路由
router.use('/auth', authRoutes);

// 以下路由需要验证管理员身份
router.use(verifyAdminToken);
router.use(logAdminOperation);

// 管理员管理路由
router.use('/admins', adminManageRoutes);

// 用户管理路由
router.use('/users', userManageRoutes);

// 动态管理路由
router.use('/moments', momentManageRoutes);

// 日志管理路由
router.use('/logs', logManageRoutes);

module.exports = router; 