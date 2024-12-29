const express = require('express');
const router = express.Router();

// 导入各个模块的路由
const authRoutes = require('./authRoutes');
const adminManageRoutes = require('./adminManageRoutes');
const userManageRoutes = require('./userManageRoutes');
const momentManageRoutes = require('./momentManageRoutes');
const newsRoutes = require('./newsRoutes');

// 注册路由
router.use('/auth', authRoutes);
router.use('/admins', adminManageRoutes);
router.use('/users', userManageRoutes);
router.use('/moments', momentManageRoutes);
router.use('/news', newsRoutes);

module.exports = router; 