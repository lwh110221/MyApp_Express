const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 3000;

// 配置 CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vue 开发服务器默认端口
  credentials: true
}));

app.use(express.json());

// 添加静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 用户相关路由
app.use('/api/users', userRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || '服务器错误' });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});