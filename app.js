const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const session = require('express-session');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const userRoutes = require('./routes/userRoutes');
const momentRoutes = require('./routes/momentRoutes');
const captchaRoutes = require('./routes/captchaRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

// 安全性设置
app.use(helmet());

// 启用 gzip 压缩
app.use(compression());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use('/api/', limiter);

// 配置 session 中间件
app.use(session({
  secret: process.env.SESSION_SECRET || (() => {
    throw new Error('SESSION_SECRET environment variable is required');
  })(),
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15分钟过期
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// 配置 CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '1d', // 缓存1天
  etag: true
}));

// API 路由
app.use('/api/users', userRoutes);
app.use('/api/moments', momentRoutes);
app.use('/api/captcha', captchaRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: '未找到请求的资源' });
});

// 错误处理中间件
app.use(errorHandler);

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭服务器');
  app.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});

module.exports = app;