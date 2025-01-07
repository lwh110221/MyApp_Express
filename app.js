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
const adminRoutes = require('./routes/admin');
const newsRoutes = require('./routes/newsRoutes');
const ResponseUtil = require('./utils/responseUtil');
const identityRoutes = require('./routes/identityRoutes');

const app = express();
const port = process.env.PORT || 3000;

// 安全性设置
app.use(helmet({
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*'],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173']
    }
  }
}));

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
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
app.use(cors({
  origin: function(origin, callback) {
    // 允许没有origin的请求（比如同源请求）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 统一响应处理
app.use((req, res, next) => {
  res.success = (data, message) => {
    ResponseUtil.success(res, data, message);
  };
  res.error = (message, code) => {
    ResponseUtil.error(res, message, code);
  };
  res.page = (data) => {
    ResponseUtil.page(res, data);
  };
  next();
});

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: process.env.STATIC_CACHE_MAX_AGE || '1d',
  etag: true,
  setHeaders: function (res, path, stat) {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  }
}));

// API 路由
app.use('/api/users', userRoutes);
app.use('/api/moments', momentRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/identities', identityRoutes);

// 404 处理
app.use((req, res) => {
  ResponseUtil.error(res, '未找到请求的资源', 404);
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