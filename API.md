# API 文档

作者：罗文浩

## 接口说明

- 基础URL: `http://127.0.0.1:3000/api`
- 认证方式: Bearer Token (`Authorization: Bearer <token>`)
- 响应格式: JSON
- 文件上传: `multipart/form-data`

## 接口列表

### 1. 用户模块

#### 1.1 用户注册
```http
POST /users/register
Content-Type: application/json
```

**请求参数**
| 参数名   | 类型   | 必填 | 说明     |
|----------|--------|------|----------|
| username | string | 是   | 用户名   |
| email    | string | 是   | 邮箱     |
| password | string | 是   | 密码     |
| captcha  | string | 是   | 验证码   |

**请求示例**
```json
{
  "username": "test",
  "email": "test@test.com",
  "password": "123456",
  "captcha": "####"
}
```

**响应示例**
```json
{
  "success": true,
  "message": "注册成功"
}
```

#### 1.2 用户登录
```http
POST /users/login
Content-Type: application/json
```

**请求参数**
| 参数名   | 类型   | 必填 | 说明   |
|----------|--------|------|--------|
| email    | string | 是   | 邮箱   |
| password | string | 是   | 密码   |

**请求示例**
```json
{
  "email": "test@example.com",
  "password": "Test123456"
}
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "username": "test_user",
    "email": "test@example.com"
  }
}
```

#### 1.3 获取用户信息
```http
GET /users/profile
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "test_user",
    "email": "test@example.com",
    "points": 100,
    "created_at": "2024-12-21T10:00:00Z",
    "bio": "用户简介",
    "profile_picture": "http://example.com/avatar.jpg"
  }
}
```

### 2. 动态模块

#### 2.1 发布动态
```http
POST /moments
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**
| 参数名  | 类型   | 必填 | 说明                    |
|---------|--------|------|-------------------------|
| content | string | 是   | 动态内容                |
| images  | file[] | 否   | 图片文件，最多9张，每张≤5MB |

**请求示例（Form Data）**
```json
{
  "content": "这是一条测试动态",
  "images": [
    "file1.jpg",
    "file2.jpg"
  ]
}
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "id": "moment_id",
    "content": "动态内容",
    "created_at": "2024-12-21T10:00:00Z",
    "username": "test_user",
    "user_id": "user_id",
    "profile_picture": "http://example.com/avatar.jpg",
    "images": [
      "http://example.com/image1.jpg",
      "http://example.com/image2.jpg"
    ]
  }
}
```

#### 2.2 获取动态列表
```http
GET /moments/user/:userId?page=1&limit=10
Authorization: Bearer <token>
```

**查询参数**
| 参数名 | 类型   | 必填 | 说明             | 默认值 |
|--------|--------|------|------------------|--------|
| page   | number | 否   | 页码             | 1      |
| limit  | number | 否   | 每页条数         | 10     |

**响应示例**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "moment_id",
        "content": "动态内容",
        "created_at": "2024-12-21T10:00:00Z",
        "username": "test_user",
        "user_id": "user_id",
        "profile_picture": "http://example.com/avatar.jpg",
        "images": ["http://example.com/image1.jpg"]
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "total_pages": 10
    }
  }
}
```

#### 2.3 删除动态
```http
DELETE /moments/:momentId
Authorization: Bearer <token>
```

**请求示例**
| key | value |
|-----|-------|
| momentId | 1 |

**响应示例**
```json
{
  "success": true,
  "message": "动态已删除"
} 
```

### 3. 验证码模块

#### 3.1 生成验证码
```http
GET /captcha/generate
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "captchaId": "unique_captcha_id",
    "captchaImage": "base64_encoded_image"
  }
}
```

### 4. 用户扩展功能

#### 4.1 更新用户信息
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
| 参数名 | 类型   | 必填 | 说明     |
|--------|--------|------|----------|
| bio    | string | 否   | 用户简介 |

**请求示例**
```json
{
  "bio": "这是我的新简介",
}
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "username": "test_user",
    "bio": "这是我的新简介"
  }
}
```

#### 4.2 更新用户头像
```http
PUT /users/profile/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**
| 参数名 | 类型 | 必填 | 说明           |
|--------|------|------|----------------|
| avatar | file | 是   | 头像文件，≤2MB |

**请求示例（Form Data）**
```
avatar: (binary)profile.jpg
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "profile_picture": "http://example.com/new_avatar.jpg"
  }
}
```

#### 4.3 修改密码
```http
PUT /users/password
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**
| 参数名      | 类型   | 必填 | 说明     |
|-------------|--------|------|----------|
| oldPassword | string | 是   | 原密码   |
| newPassword | string | 是   | 新密码   |
| captcha     | string | 是   | 验证码   |

**请求示例**
```json
{
  "oldPassword": "OldTest123456",
  "newPassword": "NewTest123456",
  "captcha": "1234"
}
```

**响应示例**
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

#### 4.4 获取用户积分
```http
GET /users/points
Authorization: Bearer <token>
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "points": 100
  }
}
```

### 5. 管理员模块 API

### 认证相关

#### 管理员登录
- **接口**：`POST /admin/auth/login`
- **描述**：管理员账号登录
- **请求头**：
  ```http
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "username": "string", // 用户名
    "password": "string"  // 密码
  }
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "data": {
      "token": "string",
      "admin": {
        "id": "number",
        "username": "string",
        "email": "string",
        "roles": [
          {
            "name": "string",
            "description": "string"
          }
        ]
      }
    }
  }
  ```

#### 获取管理员信息
- **接口**：`GET /admin/auth/profile`
- **描述**：获取当前登录管理员的详细信息
- **请求头**：
  ```
  Authorization: Bearer <token>
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "status": "number",
      "created_at": "string",
      "last_login": "string",
      "roles": [
        {
          "name": "string",
          "description": "string"
        }
      ],
      "permissions": [
        {
          "name": "string",
          "code": "string"
        }
      ]
    }
  }
  ```

#### 修改密码
- **接口**：`PUT /admin/auth/password`
- **描述**：修改当前管理员密码
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "oldPassword": "string",
    "newPassword": "string"  // 必须含大小写字母和数字，长度至少6位
  }
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "message": "密码修改成功"
  }
  ```

### 用户管理

#### 获取用户列表
- **接口**：`GET /admin/users`
- **描述**：获取用户列表，支持分页和条件筛选
- **请求头**：
  ```
  Authorization: Bearer <token>
  ```
- **查询参数**：
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `username`: 用户名搜索
  - `email`: 邮箱搜索
  - `startDate`: 开始日期
  - `endDate`: 结束日期
- **带参数请求示例**
  ```http
  GET http://127.0.0.1:3000/api/admin/users?page=1&limit=10&username=test
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "data": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "users": [
        {
          "id": "number",
          "username": "string",
          "email": "string",
          "points": "number",
          "created_at": "string",
          "bio": "string",
          "profile_picture": "string"
        }
      ]
    }
  }
  ```

#### 获取用户详情
- **接口**：`GET /admin/users/:userId`
- **描述**：获取指定用户的详细信息
- **请求头**：
  ```
  Authorization: Bearer <token>
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "data": {
      "id": "number",
      "username": "string",
      "email": "string",
      "points": "number",
      "created_at": "string",
      "bio": "string",
      "profile_picture": "string",
      "recent_moments": [
        {
          "id": "number",
          "content": "string",
          "created_at": "string",
          "images": ["string"]
        }
      ]
    }
  }
  ```

#### 修改用户状态
- **接口**：`PUT /admin/users/:userId/status`
- **描述**：启用或禁用用户
- **请求头**：
  ```
  Authorization: Bearer <token>
  ```
- **请求体**：
  ```json
  {
    "status": "boolean"  // true: 启用, false: 禁用
  }
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "message": "用户状态修改成功"
  }
  ```

#### 删除用户
- **接口**：`DELETE /admin/users/:userId`
- **描述**：删除指定用户及其所有相关数据
- **请求头**：
  ```
  Authorization: Bearer <token>
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "message": "用户删除成功"
  }
  ```

#### 获取用户统计数据
- **接口**：`GET /admin/users/stats/overview`
- **描述**：获取用户相关统计数据
- **请求头**：
  ```
  Authorization: Bearer <token>
  ```
- **响应**：
  ```json
  {
    "code": 200,
    "data": {
      "total_users": "number",
      "today_new_users": "number",
      "monthly_active_users": "number",
      "growth_trend": [
        {
          "date": "string",
          "count": "number"
        }
      ]
    }
  }
  ```

### 管理员管理

#### 获取管理员列表
- 请求路径：`GET /admin/admins`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 请求参数：
  ```json
  {
    "page": "当前页码，默认1",
    "limit": "每页数量，默认10",
    "username": "管理员用户名（可选）",
    "email": "管理员邮箱（可选）"
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "data": {
      "items": [
        {
          "id": 1,
          "username": "admin",
          "email": "admin@example.com",
          "status": 1,
          "last_login": "2024-01-20 10:00:00",
          "created_at": "2024-01-01 12:00:00",
          "roles": ["超级管理员"]
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10
      }
    }
  }
  ```

#### 创建管理员
- 请求路径：`POST /admin/admins`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 请求体：
  ```json
  {
    "username": "管理员用户名",
    "email": "管理员邮箱",
    "password": "密码（必须包含大小写字母和数字，长度不少于6位）",
    "roleIds": [1, 2] // 角色ID数组
  }
  ```
- 角色数组说明：
  - 1: 超级管理员
  - 2: 管理员
- 响应示例：
  ```json
  {
    "code": 201,
    "message": "管理员创建成功"
  }
  ```

#### 更新管理员状态
- 请求路径：`PUT /admin/admins/:adminId/status`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 请求体：
  ```json
  {
    "status": true // 或 false，启用或禁用管理员
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "管理员状态更新成功"
  }
  ```

#### 更新管理员角色
- 请求路径：`PUT /admin/admins/:adminId/roles`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 请求体：
  ```json
  {
    "roleIds": [1, 2] // 新的角色ID数组
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "角色更新成功"
  }
  ```

#### 删除管理员
- 请求路径：`DELETE /admin/admins/:adminId`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "管理员删除成功"
  }
  ```

### 动态管理

#### 获取动态列表
- 请求路径：`GET /admin/moments`
- 请求参数：
  ```json
  {
    "page": "当前页码，默认1",
    "limit": "每页数量，默认10",
    "startDate": "开始日期（可选，YYYY-MM-DD）",
    "endDate": "结束日期（可选，YYYY-MM-DD）"
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "data": {
      "items": [
        {
          "id": 1,
          "content": "动态内容",
          "user_id": 1,
          "username": "用户名",
          "nickname": "用户昵称",
          "created_at": "2024-01-20 10:00:00"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10
      }
    }
  }
  ```

#### 删除动态
- 请求路径：`DELETE /admin/moments/:momentId`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 请求体需要在params中传递momentId
- 响应示例：
  ```json
  {
    "code": 200,
    "message": "动态删除成功"
  }
  ```

#### 获取动态统计数据
- 请求路径：`GET /admin/moments/stats/overview`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "data": {
      "total": 100,
      "today": 5,
      "month": 50,
      "trend": [
        {
          "date": "2024-01-20",
          "count": 5
        }
      ]
    }
  }
  ```

### 日志管理

#### 获取操作日志列表
- 请求路径：`GET /admin/logs`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 请求参数：
  ```json
  {
    "page": "当前页码，默认1",
    "limit": "每页数量，默认10",
    "startDate": "开始日期（可选，YYYY-MM-DD）",
    "endDate": "结束日期（可选，YYYY-MM-DD）"
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "data": {
      "items": [
        {
          "id": 1,
          "admin_id": 1,
          "admin_username": "admin",
          "operation_type": "创建用户",
          "operation_desc": "创建了新用户",
          "ip_address": "127.0.0.1",
          "created_at": "2024-01-20 10:00:00"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10
      }
    }
  }
  ```

#### 获取日志统计数据
- 请求路径：`GET /admin/logs/stats`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "data": {
      "total": 1000,
      "today": 50,
      "operationStats": [
        {
          "operation_type": "创建用户",
          "count": 100
        }
      ],
      "trend": [
        {
          "date": "2024-01-20",
          "count": 50
        }
      ]
    }
  }
  ```

#### 清理日志
- 请求路径：`POST /admin/logs/clean`
- 请求头：
  ```http
  Authorization: Bearer <token>
  ```
- 请求体：
  ```json
  {
    "beforeDate": "2024-01-01" // 删除此日期之前的日志
  }
  ```
- 响应示例：
  ```json
  {
    "code": 200,
    "data": {
      "affectedRows": 100
    },
    "message": "日志清理成功"
  }
  ```

### 6. 新闻资讯模块

#### 6.1 新闻分类管理

##### 获取新闻分类列表
- **接口**：`GET /admin/news/categories`
- **权限**：`news:category:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": 1,
        "name": "最新资讯",
        "code": "latest",
        "sort_order": 1,
        "status": 1,
        "created_at": "2024-01-20T10:00:00.000Z",
        "updated_at": "2024-01-20T10:00:00.000Z"
      }
    ]
  }
  ```

##### 创建新闻分类
- **接口**：`POST /admin/news/categories`
- **权限**：`news:category:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "name": "分类名称",
    "code": "category_code",
    "sort_order": 0
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1
    },
    "message": "新闻分类创建成功"
  }
  ```

##### 更新新闻分类
- **接口**：`PUT /admin/news/categories/:categoryId`
- **权限**：`news:category:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "name": "更新后的分类名称",
    "sort_order": 1,
    "status": 1
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "新闻分类更新成功"
  }
  ```

##### 删除新闻分类
- **接口**：`DELETE /admin/news/categories/:categoryId`
- **权限**：`news:category:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "新闻分类删除成功"
  }
  ```

#### 6.2 新闻文章管理

##### 获取新闻文章列表
- **接口**：`GET /admin/news/articles`
- **权限**：`news:article:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  ```
- **查询参数**：
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `category_id`: 分类ID（可选）
  - `is_published`: 发布状态（可选）
  - `keyword`: 搜索关键词（可选）
  - `is_featured`: 是否热门（可选）
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "total": 100,
      "items": [
        {
          "id": 1,
          "category_id": 1,
          "category_name": "最新资讯",
          "title": "文章标题",
          "summary": "文章摘要",
          "author": "作者",
          "view_count": 0,
          "is_featured": 0,
          "is_published": 1,
          "publish_time": "2024-01-20T10:00:00.000Z",
          "created_at": "2024-01-20T10:00:00.000Z"
        }
      ]
    }
  }
  ```

##### 获取新闻文章详情
- **接口**：`GET /admin/news/articles/:articleId`
- **权限**：`news:article:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  ```
- **请求参数**：
  - `articleId`: 文章ID
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "category_id": 1,
      "category_name": "最新资讯",
      "title": "文章标题",
      "summary": "文章摘要",
      "content": "文章内容",
      "cover_image": "封面图片URL",
      "author": "作者",
      "source": "来源",
      "view_count": 0,
      "is_featured": 0,
      "is_published": 1,
      "publish_time": "2024-01-20T10:00:00.000Z",
      "created_at": "2024-01-20T10:00:00.000Z",
      "updated_at": "2024-01-20T10:00:00.000Z",
      "creator_name": "创建人"
    }
  }
  ```

##### 创建新闻文章
- **接口**：`POST /admin/news/articles`
- **权限**：`news:article:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "category_id": 1,
    "title": "文章标题",
    "summary": "文章摘要（可选）",
    "content": "<p>这是一段测试内容</p>",  // 支持HTML格式或Quill Delta格式
    "cover_image": "/uploads/news/cover.jpg",
    "author": "作者",
    "source": "来源",
    "is_featured": 0,
    "is_published": 0
  }
  ```
- **Quill Delta格式示例**：
  ```json
  {
    "category_id": 4,
    "title": "测试测试",
    "content": {
      "ops": [
        { "insert": "Hello " },
        { "insert": "World", "attributes": { "bold": true } },
        { "insert": "\n" },
        { 
          "insert": { 
            "image": "###" 
          }
        }
      ]
    },
    "author": "测试作者",  // 必需字段
    "source": "测试来源",  // 可选字段
    "is_featured": 0,     // 可选字段，默认 0
    "is_published": 0     // 可选字段，默认 0
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1
    },
    "message": "新闻文章创建成功"
  }
  ```

##### 更新新闻文章
- **接口**：`PUT /admin/news/articles/:articleId`
- **权限**：`news:article:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "category_id": 1,
    "title": "更新后的标题",
    "summary": "更新后的摘要",
    "content": "更新后的内容",
    "cover_image": "http://example.com/new_image.jpg",
    "author": "新作者",
    "source": "新来源",
    "is_featured": true,
    "is_published": true
  }
  ```
- **更新文章Quill Delta格式示例**：
  ```json
  {
    "category_id": 4,
    "title": "测试测试",
    "content": {
      "ops": [
        { "insert": "Hello " },
        { "insert": "World", "attributes": { "bold": true } },
        { "insert": "\n" },
        { 
          "insert": { 
            "image": "###" 
          }
        }
      ]
    }
    "author": "测试作者",  // 必需字段
    "source": "测试来源",  // 可选字段
    "is_featured": 0,     // 可选字段，默认 0
    "is_published": 0     // 可选字段，默认 0
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "新闻文章更新成功"
  }
  ```

##### 删除新闻文章
- **接口**：`DELETE /admin/news/articles/:articleId`
- **权限**：`news:article:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "新闻文章删除成功"
  }
  ```

##### 更新文章发布状态
- **接口**：`PUT /admin/news/articles/:articleId/publish`
- **权限**：`news:publish`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "is_published": 1  // 1: 发布, 0: 下线
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "文章已发布"  // 或 "文章已下线"
  }
  ```

##### 更新文章热门状态
- **接口**：`PUT /admin/news/articles/:articleId/featured`
- **权限**：`news:article:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **请求体**：
  ```json
  {
    "is_featured": 1  // 1: 设为热门, 0: 取消热门
  }
  ```
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "文章已设为热门"  // 或 "文章已取消热门"
  }
  ```

#### 6.3 图片上传

##### 上传图片
- **接口**：`POST /admin/news/upload`
- **权限**：`news:article:manage`
- **请求头**：
  ```http
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
- **请求参数**：
  - Form Data:
    - `image`: 图片文件
  - 支持格式：jpeg, jpg, png, gif, webp
  - 大小限制：5MB
- **响应示例**：
  ```json
  {
    "code": 200,
    "message": "图片上传成功",
    "data": {
      "url": "/uploads/news/1705743258999-123456789.jpg"
    }
  }
  ```

#### 6.4 注意事项

1. 所有请求都需要携带有效的管理员 token
2. 图片上传使用 multipart/form-data 格式
3. 其他请求使用 application/json 格式
4. 文章内容支持两种格式：
   - HTML 格式：直接传入 HTML 字符串
   - Quill Delta 格式：传入 Quill 编辑器的 Delta 对象
5. 图片支持两种上传方式：
   - 单独上传：使用图片上传接口
   - 内嵌到内容：直接在 content 中使用 base64 格式的图片，系统会自动处理并转换为文件
6. 权限要求：
   - `news:category:manage`: 分类管理权限
   - `news:article:manage`: 文章管理权限
   - `news:publish`: 文章发布权限

### 7. 用户端新闻模块

#### 7.1 获取新闻分类
- **接口**：`GET /news/categories`
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": 1,
        "name": "最新资讯",
        "code": "latest"
      }
    ]
  }
  ```

#### 7.2 获取新闻列表
- **接口**：`GET /news/articles`
- **查询参数**：
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `category_id`: 分类ID（可选）
  - `keyword`: 搜索关键词（可选）
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "items": [
        {
          "id": 1,
          "category_id": 1,
          "category_name": "最新资讯",
          "title": "文章标题",
          "summary": "文章摘要",
          "cover_image": "封面图片URL",
          "author": "作者",
          "view_count": 100,
          "is_featured": 1,
          "publish_time": "2024-01-20T10:00:00.000Z"
        }
      ],
      "pagination": {
        "total": 100,
        "page": 1,
        "limit": 10
      }
    }
  }
  ```

#### 7.3 获取新闻详情
- **接口**：`GET /news/articles/:articleId`
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "category_id": 1,
      "category_name": "最新资讯",
      "title": "文章标题",
      "summary": "文章摘要",
      "content": "文章内容",
      "cover_image": "封面图片URL",
      "author": "作者",
      "source": "来源",
      "view_count": 100,
      "publish_time": "2024-01-20T10:00:00.000Z"
    }
  }
  ```

#### 7.4 获取热门新闻
- **接口**：`GET /news/articles/featured`
- **说明**：获取热门新闻列表，优先返回手动设置为热门的文章，如果数量不足则补充高浏览量文章
- **查询参数**：
  - `limit`: 返回数量（默认5，最大20）
- **返回规则**：
  1. 优先返回被设置为热门的文章（`is_featured = 1`）
  2. 如果热门文章数量不足指定数量，则补充浏览量超过100的文章
  3. 按发布时间降序排序热门文章，按浏览量降序排序高浏览量文章
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": 1,
        "title": "热门文章标题",
        "summary": "文章摘要",
        "cover_image": "封面图片URL",
        "view_count": 1000,
        "publish_time": "2024-01-20T10:00:00.000Z",
        "category_name": "最新资讯",
        "is_featured": 1
      }
    ]
  }
  ```

#### 7.5 获取相关新闻
- **接口**：`GET /news/articles/:articleId/related`
- **说明**：获取与指定文章相关的新闻推荐
- **路径参数**：
  - `articleId`: 当前文章ID
- **查询参数**：
  - `limit`: 返回数量（默认5，最大20）
- **返回规则**：
  1. 优先返回同分类下的文章
     - 优先选择发布时间接近的文章
     - 其次考虑浏览量较高的文章
  2. 如果同分类文章数量不足，则补充其他分类的热门文章
     - 补充的文章必须是热门文章或浏览量超过100
     - 按浏览量降序排序
  3. 排除当前正在查看的文章
- **响应示例**：
  ```json
  {
    "code": 200,
    "data": [
      {
        "id": 2,
        "title": "相关文章标题",
        "summary": "文章摘要",
        "cover_image": "封面图片URL",
        "view_count": 50,
        "publish_time": "2024-01-20T10:00:00.000Z",
        "category_name": "最新资讯"
      }
    ]
  }
  ```

#### 7.6 注意事项
1. 所有接口只返回已发布的文章（`is_published = 1`）
2. 查看文章详情时会自动增加浏览次数
3. 热门新闻的条件：
   - 被设置为热门（`is_featured = 1`）
   - 或浏览次数超过100
4. 相关新闻是基于同分类推荐