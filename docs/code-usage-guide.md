# 项目工具类使用规范指南

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
```

### 1.2 注意事项
- 不要使用解构方式引入 `ResponseUtil`
- 确保传入正确的 `res` 对象
- 错误信息使用中文，面向用户友好
- 不要在响应后继续操作 res 对象
- 在 catch 块中记录错误日志后再返回错误响应

## 2. BaseController 基础控制器使用规范

### 2.1 继承方式
```javascript
const BaseController = require('../baseController');

class FeatureController extends BaseController {
  constructor() {
    super();
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
const { page, limit, skip } = this.getPaginationParams(req);

// 排序参数获取
const sort = this.getSortParams(req);

// 搜索参数获取
const searchParams = this.getSearchParams(req, ['name', 'description']);

// 日志记录
this.logInfo('操作信息', { userId: req.userData.userId });
this.logError('错误信息', error);
this.logBusiness('创建用户', '用户注册成功', { userId });
this.logDatabase('INSERT', sql, params, result);
this.logPerformance('查询用户列表', duration);
this.logSecurity('密码修改', { userId });
```

## 3. 数据库连接池使用规范

### 3.1 基本查询
```javascript
const pool = require('../config/database');

// 单条查询
const [rows] = await pool.query('SELECT * FROM table_name WHERE id = ?', [id]);

// 分页查询
const offset = (page - 1) * pageSize;
const [rows] = await pool.query(
  'SELECT * FROM table_name LIMIT ? OFFSET ?',
  [pageSize, offset]
);

// 多表联查
const [rows] = await pool.query(`
  SELECT t1.*, t2.name 
  FROM table1 t1 
  LEFT JOIN table2 t2 ON t1.t2_id = t2.id 
  WHERE t1.status = ?
`, [status]);
```

### 3.2 事务处理
```javascript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // 执行多个查询
  await connection.query('INSERT INTO table1 SET ?', [data1]);
  await connection.query('UPDATE table2 SET ? WHERE id = ?', [data2, id]);
  
  await connection.commit();
  return ResponseUtil.success(res, null, '操作成功');
} catch (error) {
  await connection.rollback();
  this.logError('操作失败:', error);
  return ResponseUtil.error(res, '操作失败', 500);
} finally {
  connection.release();
}
```

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

## 6. 文件上传工具使用规范

### 6.1 Multer 配置使用
```javascript
const upload = require('../utils/upload');

// 单文件上传
router.post('/upload', upload.single('file'), controller.upload);

// 多文件上传（最多5个文件）
router.post('/uploads', upload.array('files', 5), controller.uploads);

// 获取上传的文件信息
const file = req.file;
const filePath = file.path;
const fileName = file.originalname;
```

### 6.2 文件上传配置
```javascript
// 支持的文件类型
const allowedMimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

// 文件大小限制
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 5 // 最多5个文件
};

// 存储路径配置
const storage = {
  news: 'public/uploads/news/',
  avatar: 'public/uploads/avatars/',
  moment: 'public/uploads/moments/'
};
```

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

