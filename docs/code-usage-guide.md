# 项目工具类使用规范

## 目录
1. [ResponseUtil 响应工具](#1-responseutil-响应工具使用规范)
2. [BaseController 基础控制器](#2-basecontroller-基础控制器使用规范) 
3. [数据库操作](#3-数据库连接池使用规范)
4. [认证中间件](#4-认证中间件使用规范)
5. [日志工具](#5-日志工具使用规范)
6. [文件上传](#6-文件上传工具使用规范)
7. [错误处理](#7-错误处理规范)
8. [JSON数据处理](#8-json-数据处理规范)
9. [身份验证](#9-身份验证使用规范)
10. [验证码处理](#10-验证码使用规范)

## 1. ResponseUtil 响应工具使用规范

### 1.1 基本用法
```javascript
const ResponseUtil = require('../utils/responseUtil');

// 成功响应
ResponseUtil.success(res, data, '操作成功');

// 错误响应
ResponseUtil.error(res, '操作失败的具体原因', 500);

// 分页数据响应
ResponseUtil.page(res, {
  list: rows,
  total,
  page,
  pageSize
});

// 带有额外信息的成功响应
ResponseUtil.success(res, {
  items: data,
  summary: summaryData
}, '操作成功');

// 自定义状态码的错误响应
ResponseUtil.error(res, '资源未找到', 404);
```

### 1.2 注意事项
- 不要使用解构方式引入 `ResponseUtil`
- 确保传入正确的 `res` 对象
- 错误信息使用中文，面向用户友好
- 不要在响应后继续操作 res 对象
- 在 catch 块中记录错误日志后再返回错误响应

### 1.3 最佳实践
```javascript
try {
  const data = await service.process();
  // 成功响应
  return ResponseUtil.success(res, data, '处理成功');
} catch (error) {
  // 记录错误日志
  logger.error('处理失败:', error);
  // 返回用户友好的错误信息
  return ResponseUtil.error(res, '操作失败，请稍后重试');
}

// 分页查询示例
try {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  // 获取总数
  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM table_name'
  );
  const total = countResult[0].total;
  
  // 获取分页数据
  const [rows] = await pool.query(
    'SELECT * FROM table_name LIMIT ? OFFSET ?',
    [parseInt(limit), offset]
  );
  
  // 返回分页数据
  return ResponseUtil.page(res, {
    list: rows,
    total,
    page: parseInt(page),
    pageSize: parseInt(limit)
  });
} catch (error) {
  logger.error('查询失败:', error);
  return ResponseUtil.error(res, '查询失败，请稍后重试');
}
```

## 2. BaseController 基础控制器使用规范

### 2.1 继承方式
```javascript
const BaseController = require('../core/baseController');

class FeatureController extends BaseController {
  constructor() {
    super();
  }

  // 使用异步错误处理包装器
  async createFeature() {
    return this.catchAsync(async (req, res) => {
      // 业务逻辑
      const result = await this.service.create(req.body);
      return this.success(res, result);
    });
  }
}

module.exports = new FeatureController();
```

### 2.2 内置方法使用
```javascript
// 异步错误处理
this.catchAsync(async (req, res) => {
  // 异步处理逻辑
});

// 分页参数获取
const { page, pageSize, skip } = this.getPaginationParams(req);

// 排序参数获取
const sort = this.getSortParams(req, {
  defaultField: 'created_at',
  defaultOrder: 'DESC'
});

// 搜索参数获取
const searchParams = this.getSearchParams(req, ['name', 'email', 'status']);

// 参数验证
this.validate(req.body, {
  name: { type: 'string', required: true },
  email: { type: 'email', required: true },
  status: { type: 'enum', values: [0, 1] }
});

// 响应方法
this.success(res, data, '操作成功');
this.error(res, '操作失败', 500);
this.notFound(res, '资源不存在');
this.unauthorized(res, '未授权访问');
this.forbidden(res, '禁止访问');

// 日志记录
this.logger.info('操作信息', { userId: req.userData.userId });
this.logger.error('错误信息', error);
this.logger.warn('警告信息', { type: 'business', message: '异常操作' });
```

### 2.3 最佳实践
```javascript
class UserController extends BaseController {
  constructor() {
    super();
    this.service = new UserService();
  }

  // 获取用户列表
  async getUserList() {
    return this.catchAsync(async (req, res) => {
      // 获取分页参数
      const { page, pageSize, skip } = this.getPaginationParams(req);
      
      // 获取排序参数
      const sort = this.getSortParams(req, {
        defaultField: 'created_at',
        defaultOrder: 'DESC'
      });
      
      // 获取搜索参数
      const searchParams = this.getSearchParams(req, ['username', 'email', 'status']);
      
      // 调用服务层方法
      const result = await this.service.getUserList(searchParams, {
        skip,
        limit: pageSize,
        sort
      });
      
      // 返回分页数据
      return this.success(res, {
        items: result.list,
        total: result.total,
        page,
        pageSize
      });
    });
  }

  // 创建用户
  async createUser() {
    return this.catchAsync(async (req, res) => {
      // 参数验证
      this.validate(req.body, {
        username: { type: 'string', required: true },
        email: { type: 'email', required: true },
        password: { type: 'string', min: 6, required: true }
      });
      
      // 调用服务层方法
      const user = await this.service.createUser(req.body);
      
      // 记录操作日志
      this.logger.info('创建用户成功', {
        userId: user.id,
        operator: req.userData.userId
      });
      
      // 返回成功响应
      return this.success(res, user, '用户创建成功');
    });
  }
}
```

## 3. 数据库连接池使用规范

### 3.1 基本查询
```javascript
const pool = require('../config/database');

// 单条查询
const [rows] = await pool.query(
  'SELECT * FROM users WHERE id = ?',
  [id]
);

// 分页查询
const offset = (page - 1) * pageSize;
const [rows] = await pool.query(
  'SELECT * FROM users LIMIT ? OFFSET ?',
  [parseInt(pageSize), offset]
);

// 多表联查
const [rows] = await pool.query(`
  SELECT u.*, up.profile_picture, up.bio 
  FROM users u 
  LEFT JOIN user_profiles up ON u.id = up.user_id 
  WHERE u.status = ?
`, [status]);

// 插入数据
const [result] = await pool.query(
  'INSERT INTO users SET ?',
  [userData]
);
const insertId = result.insertId;

// 更新数据
const [result] = await pool.query(
  'UPDATE users SET ? WHERE id = ?',
  [updateData, userId]
);
const affectedRows = result.affectedRows;

// 删除数据
const [result] = await pool.query(
  'DELETE FROM users WHERE id = ?',
  [userId]
);
```

### 3.2 事务处理
```javascript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // 执行多个查询
  const [result1] = await connection.query(
    'INSERT INTO orders SET ?',
    [orderData]
  );
  
  const [result2] = await connection.query(
    'UPDATE products SET stock = stock - ? WHERE id = ?',
    [quantity, productId]
  );
  
  await connection.commit();
  return ResponseUtil.success(res, { orderId: result1.insertId });
} catch (error) {
  await connection.rollback();
  logger.error('事务执行失败:', error);
  return ResponseUtil.error(res, '操作失败');
} finally {
  connection.release();
}
```

### 3.3 查询构建
```javascript
// 动态构建WHERE条件
const conditions = [];
const params = [];

if (username) {
  conditions.push('username LIKE ?');
  params.push(`%${username}%`);
}

if (status !== undefined) {
  conditions.push('status = ?');
  params.push(status);
}

if (startDate) {
  conditions.push('created_at >= ?');
  params.push(startDate);
}

const whereClause = conditions.length 
  ? `WHERE ${conditions.join(' AND ')}` 
  : '';

const [rows] = await pool.query(`
  SELECT * FROM users 
  ${whereClause}
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`, [...params, limit, offset]);
```

### 3.4 最佳实践
```javascript
// 1. 使用参数化查询防止SQL注入
const [user] = await pool.query(
  'SELECT * FROM users WHERE username = ?',
  [username]
);

// 2. 使用事务确保数据一致性
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  // 数据库操作
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}

// 3. 正确处理查询结果
const [rows] = await pool.query(query, params);
if (rows.length === 0) {
  throw new NotFoundError('数据不存在');
}

// 4. 处理大量数据
async function* fetchRows(query, batchSize = 1000) {
  let offset = 0;
  while (true) {
    const [rows] = await pool.query(
      `${query} LIMIT ? OFFSET ?`,
      [batchSize, offset]
    );
    if (rows.length === 0) break;
    yield rows;
    offset += batchSize;
  }
}

// 5. 使用连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### 3.5 注意事项
1. **连接管理**
   - 总是使用连接池而不是单个连接
   - 确保在 finally 块中释放连接
   - 避免长时间占用连接

2. **查询优化**
   - 使用适当的索引
   - 避免使用 SELECT *
   - 限制结果集大小
   - 使用预处理语句

3. **错误处理**
   - 捕获并记录数据库错误
   - 提供用户友好的错误消息
   - 在事务中正确处理回滚

4. **安全性**
   - 始终使用参数化查询
   - 验证用户输入
   - 限制查询权限

5. **性能考虑**
   - 使用批量操作
   - 避免循环中的查询
   - 合理使用事务
   - 监控查询性能

## 4. 认证中间件使用规范

### 4.1 用户认证中间件
```javascript
const auth = require('../middleware/auth');

// 路由中使用
router.use('/api/feature', auth, featureRoutes);

// 控制器中获取用户信息
const userId = req.userData.userId;

// 用户认证检查
if (!req.userData?.userId) {
  throw new AuthenticationError('用户未认证');
}
```

### 4.2 管理员认证中间件
```javascript
const verifyAdminToken = require('../middleware/admin/authMiddleware');

// 路由中使用
router.use('/api/admin/feature', verifyAdminToken, adminFeatureRoutes);

// 控制器中获取管理员信息
const adminId = req.admin.id;

// 管理员认证检查
if (!req.admin?.id) {
  throw new AuthenticationError('管理员未认证');
}

// 权限检查
if (!req.admin.permissions.includes('permission:code')) {
  throw new AuthorizationError('没有操作权限');
}
```

## 5. 日志工具使用规范

### 5.1 错误日志
```javascript
// 记录错误详情
this.logError('操作失败', error);

// 记录带上下文的错误
this.logError(`用户 ${userId} 操作失败`, error, { userId });

// 记录详细错误信息
this.logError('操作失败', error, {
  userId: req.userData?.userId,
  requestId: req.id,
  path: req.path
});
```

### 5.2 业务日志
```javascript
// 记录请求信息
this.logInfo('开始处理请求', {
  method: req.method,
  path: req.path,
  query: req.query,
  body: req.body
});

// 记录业务操作
this.logBusiness('创建订单', '订单创建成功', {
  orderId,
  userId,
  amount
});

// 记录性能指标
this.logPerformance('数据库查询', queryDuration);
```

## 6. 文件上传使用规范（使用multer作为文件上传中间件）

### 6.1 Multer 配置使用
```javascript
const upload = require('../config/multer');

// 单文件上传
router.post('/upload', upload.single('file'), controller.upload);

// 多文件上传（最多5个文件）
router.post('/uploads', upload.array('files', 5), controller.uploads);

// 获取上传的文件信息
const file = req.file;
const filePath = file.path;
const fileName = file.originalname;
```

### 6.2 上传目录说明
- 所有上传文件统一存储在 `public/uploads` 目录下
- 根据不同类型存储在不同子目录

### 6.3 文件限制
```javascript
// 支持的文件类型
const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// 文件大小限制：5MB
const maxFileSize = 5 * 1024 * 1024;

// 多文件上传数量限制：5个
const maxFiles = 5;
```

### 6.4 文件访问
- 上传的文件通过 `/uploads/*` 路径访问
- 已配置跨域访问支持
- 已配置缓存控制

相关代码实现参考：
1:45:config/multer.js
```javascript
const multer = require('multer');
const path = require('path');

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    // 根据上传类型选择不同的目录
    let uploadType = 'moments';
    if (req.originalUrl.includes('/avatar')) {
      uploadType = 'avatars';
    } else if (req.originalUrl.includes('/news')) {
      uploadType = 'news';
    }
    cb(null, `public/uploads/${uploadType}`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let fileType = 'moment';
    if (req.originalUrl.includes('/avatar')) {
      fileType = 'avatar';
    } else if (req.originalUrl.includes('/news')) {
      fileType = 'news';
    }
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
```


98:106:app.js
```javascript
// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: process.env.STATIC_CACHE_MAX_AGE || '1d',
  etag: true,
  setHeaders: function (res, path, stat) {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  }
}));
```
### 6.5 文件清理机制
```javascript
const createFileCleanupMiddleware = require('../middleware/fileCleanup');

// 创建文件清理中间件实例
const fileCleanup = createFileCleanupMiddleware({
  uploadPath: 'public/uploads',  // 上传根目录
  subDirs: ['avatars', 'moments', 'news']  // 子目录列表
});

// 使用示例：

// 1. 清理单个文件
try {
  await fileCleanup.cleanupSingleFile('/uploads/news/image.jpg');
  logger.info('文件清理成功');
} catch (error) {
  logger.error('文件清理失败:', error);
}

// 2. 清理富文本内容中不再使用的图片
try {
  await fileCleanup.cleanupUnusedFiles(oldContent, newContent);
  logger.info('未使用的图片清理成功');
} catch (error) {
  logger.error('清理未使用的图片失败:', error);
}

// 3. 在事务中使用
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // 获取需要清理的文件信息
  const [images] = await connection.query(
    'SELECT image_url FROM images WHERE id = ?',
    [id]
  );
  
  // 删除数据库记录
  await connection.query('DELETE FROM images WHERE id = ?', [id]);
  
  // 清理文件
  for (const image of images) {
    await fileCleanup.cleanupSingleFile(image.image_url);
  }
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}

// 4. 处理特殊文件（如默认头像）
if (filePath && !filePath.includes('default-avatar')) {
  await fileCleanup.cleanupSingleFile(filePath);
}

// 5. 错误处理最佳实践
try {
  await fileCleanup.cleanupSingleFile(filePath);
  logger.info(`成功清理文件: ${filePath}`);
} catch (error) {
  logger.error(`清理文件失败: ${filePath}`, {
    error: error.message,
    stack: error.stack
  });
  // 根据业务需求决定是否抛出错误
  throw new BusinessError('文件清理失败', error);
}
```

### 6.6 文件清理注意事项

1. **路径处理**
   - 文件路径应该以 `/uploads/` 开头
   - 确保路径中包含正确的子目录（avatars/moments/news）
   - 注意处理路径中的特殊字符

2. **事务处理**
   - 在删除数据库记录前获取所有需要清理的文件信息
   - 使用事务确保数据库操作和文件清理的一致性
   - 发生错误时正确回滚事务

3. **错误处理**
   - 使用 try-catch 包装所有文件操作
   - 记录详细的错误日志
   - 区分致命错误和非致命错误

4. **性能考虑**
   - 批量清理文件时使用循环而不是并发
   - 大量文件清理时考虑分批处理
   - 避免在主要业务流程中同步清理大量文件

5. **安全考虑**
   - 验证文件路径的合法性
   - 只清理指定目录下的文件
   - 保护系统文件和默认资源

## 7. 错误处理规范

### 7.1 自定义错误类使用
```javascript
const { 
  AppError, 
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError 
} = require('../utils/errors');

// 参数验证错误
throw new ValidationError('参数不完整', errors);

// 认证错误
throw new AuthenticationError('用户未认证');

// 权限错误
throw new AuthorizationError('没有操作权限');

// 资源未找到
throw new NotFoundError('用户不存在');

// 通用应用错误
throw new AppError('操作失败', 500);
```

### 7.2 错误处理中间件
```javascript
const errorHandler = require('../middleware/errorHandler');

// 注册错误处理中间件
app.use(errorHandler);

// 错误处理示例
try {
  // 业务逻辑
} catch (error) {
  this.logError('操作失败', error);
  throw new AppError('操作失败，请稍后重试', 500);
}
```

## 8. JSON 数据处理规范

### 8.1 解析 JSON 字段
```javascript
// 安全的 JSON 解析
try {
  const data = typeof field === 'string' 
    ? JSON.parse(field) 
    : field || {};
} catch (error) {
  this.logError('JSON解析错误', error);
  return {};
}
```

### 8.2 存储 JSON 数据
```javascript
// 存储到数据库
const jsonData = JSON.stringify(data);
await pool.query(
  'UPDATE table_name SET json_field = ? WHERE id = ?',
  [jsonData, id]
);
```

## 9. 身份验证使用规范

### 9.1 身份验证中间件
```javascript
const identityCheck = require('../middleware/identityCheck');

// 单一身份验证
router.use('/api/farmer', 
  identityCheck('FARMER'), 
  farmerRoutes
);

// 多身份验证 (ANY模式)
router.use('/api/business', 
  identityCheck(['FARMER', 'DEALER'], { mode: 'ANY' }), 
  businessRoutes
);

// 多身份验证 (ALL模式)
router.use('/api/special', 
  identityCheck(['EXPERT', 'DEALER'], { mode: 'ALL' }), 
  specialRoutes
);
```

### 9.2 身份类型常量
```javascript
const { IdentityTypes } = require('../config/identityTypes');

// 获取身份类型信息
const farmerInfo = IdentityTypes.FARMER;

// 检查是否需要认证
if (farmerInfo.needCertification) {
  // 处理认证逻辑
}

// 获取认证要求
const requirements = farmerInfo.certificationRequirements;
```

## 10. 验证码使用规范

### 10.1 生成验证码
```javascript
const captchaController = require('../controllers/captchaController');

// 路由配置
router.get('/captcha', captchaController.generateCaptcha);

// 验证码配置
const captchaOptions = {
  size: 4,        // 验证码长度
  noise: 2,       // 干扰线条数
  color: true,    // 字符颜色
  background: '#f0f0f0'  // 背景色
};
```

### 10.2 验证码验证
```javascript
// 中间件使用
router.post('/login', 
  captchaController.verifyCaptcha,
  loginController.login
);

// 手动验证
if (!req.session.captcha || captcha.toLowerCase() !== req.session.captcha) {
  throw new ValidationError('验证码错误');
}

// 验证后清除session中的验证码
req.session.captcha = null;
```

