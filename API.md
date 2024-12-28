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
    "newPassword": "string"  // 必须��含大小写字母和数字，长度至少6位
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
- **描述**：获取用户相关的统计数据
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