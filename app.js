const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const session = require('express-session')

const userRoutes = require('./routes/userRoutes');
const momentRoutes = require('./routes/momentRoutes');
const captchaRoutes = require('./routes/captchaRoutes');

const app = express();
const port = process.env.PORT || 3000;

// 配置 session 中间件，必须在其他中间件之前
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15 // 15分钟过期
  }
}));

// 配置 CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vue 开发服务器地址
  credentials: true // 允许跨域携带 cookie
}));

app.use(express.json());

// 添加静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 用户相关路由
app.use('/api/users', userRoutes);

// 动态相关路由
app.use('/api/moments', momentRoutes);

// 验证码相关路由
app.use('/api/captcha', captchaRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});

module.exports = app;