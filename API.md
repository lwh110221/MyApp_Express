# API 文档

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