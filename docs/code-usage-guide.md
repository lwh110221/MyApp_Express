# 项目工具类使用规范指南

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

// 日志记录
this.logInfo('操作信息', { userId: req.userData.userId });
this.logError('错误信息', error);
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
  console.error('操作失败:', error);
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
  return ResponseUtil.error(res, '用户未认证', 401);
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
  return ResponseUtil.error(res, '管理员未认证', 401);
}

// 权限检查
if (!req.admin.permissions.includes('permission:code')) {
  return ResponseUtil.error(res, '没有操作权限', 403);
}
```

## 5. 日志工具使用规范

### 5.1 错误日志
```javascript
// 记录错误详情
console.error('操作失败:', error);

// 记录带上下文的错误
console.error(`用户 ${userId} 操作失败:`, error);

// 记录详细错误信息
console.error('操作失败:', {
  error: error.message,
  stack: error.stack,
  userId: req.userData?.userId
});
```

### 5.2 调试日志
```javascript
// 记录请求信息
console.info('开始处理请求:', {
  method: req.method,
  path: req.path,
  query: req.query,
  body: req.body
});

// 记录关键操作
console.debug('数据处理结果:', result);
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

## 7. 错误处理规范

### 7.1 异常捕获
```javascript
try {
  // 业务逻辑
} catch (error) {
  console.error('错误描述:', error);
  return ResponseUtil.error(res, '用户友好的错误信息', 500);
}
```

### 7.2 数据验证
```javascript
// 参数验证
if (!userId || !data) {
  return ResponseUtil.error(res, '参数不完整', 400);
}

// 业务规则验证
if (amount <= 0) {
  return ResponseUtil.error(res, '金额必须大于0', 400);
}

// 权限验证
if (!req.admin.permissions.includes('required:permission')) {
  return ResponseUtil.error(res, '没有操作权限', 403);
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
  console.error('JSON解析错误:', error);
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

## 9. 常见错误处理示例

### 9.1 数据库操作错误
```javascript
try {
  const [rows] = await pool.query(sql, params);
  if (!rows.length) {
    return ResponseUtil.error(res, '未找到相关数据', 404);
  }
} catch (error) {
  console.error('数据库查询错误:', error);
  return ResponseUtil.error(res, '数据查询失败', 500);
}
```

### 9.2 文件操作错误
```javascript
try {
  // 文件处理逻辑
} catch (error) {
  console.error('文件处理错误:', error);
  return ResponseUtil.error(res, '文件处理失败', 500);
}
```

### 9.3 认证错误
```javascript
// 用户认证错误
if (!req.userData?.userId) {
  console.error('用户未认证');
  return ResponseUtil.error(res, '用户未认证', 401);
}

// 管理员认证错误
if (!req.admin?.id) {
  console.error('管理员未认证');
  return ResponseUtil.error(res, '管理员未认证', 401);
}

// 权限错误
if (!req.admin.permissions.includes('required:permission')) {
  console.error('没有操作权限');
  return ResponseUtil.error(res, '没有操作权限', 403);
}
``` 