# API 文档

## 基础信息

- **基础URL**: `http://127.0.0.1:3000/api`
- **认证方式**: Bearer Token
- **请求头格式**: `Authorization: Bearer <token>`
- **响应格式**: JSON
- **文件上传**: `multipart/form-data`

### 认证说明

#### Token 说明
- Token 采用 JWT 格式
- 有效期：24小时
- 需要在每个需要认证的请求的 Header 中携带
- 格式：`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`

#### 需要认证的接口
以下接口需要在请求头中携带有效的 Token：
1. 用户信息相关：
   - 获取用户信息
   - 更新用户信息
   - 更新头像
   - 修改密码
2. 动态相关：
   - 发布动态
   - 删除动态
   - 评论动态
3. 积分相关：
   - 获取积分信息

#### Token 过期处理
- 当 Token 过期时，接口会返回 401 状态码
- 此时需要重新登录获取新的 Token
- 建议在前端做统一的 401 状态处理，跳转到登录页面

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

## 通用响应格式

### 成功响应
```json
{
  "code": 200,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误信息描述"
}
```

## 1. 用户模块

### 1.1 用户注册

#### 请求信息
- **接口**: `/users/register`
- **方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数
| 参数名   | 类型   | 必填 | 说明     | 验证规则 |
|----------|--------|------|----------|----------|
| username | string | 是   | 用户名   | 长度3-20，只能包含字母、数字、下划线 |
| email    | string | 是   | 邮箱     | 有效的邮箱格式 |
| password | string | 是   | 密码     | 长度6-20，必须包含大小写字母和数字 |
| captcha  | string | 是   | 验证码   | 长度4，不区分大小写 |

#### 请求示例
```json
{
  "username": "test_user",
  "email": "test@example.com",
  "password": "Test123456",
  "captcha": "1234"
}
```

#### 响应示例（成功）
```json
{
  "code": 200,
  "message": "注册成功"
}
```

#### 响应示例（失败）
```json
{
  "code": 400,
  "message": "用户名或邮箱已存在"
}
```

### 1.2 用户登录

#### 请求信息
- **接口**: `/users/login`
- **方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数
| 参数名   | 类型   | 必填 | 说明   | 验证规则 |
|----------|--------|------|--------|----------|
| email    | string | 是   | 邮箱   | 有效的邮箱格式 |
| password | string | 是   | 密码   | 长度6-20 |

#### 请求示例
```json
{
  "email": "test@example.com",
  "password": "Test123456"
}
```

#### 响应示例（成功）
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

#### 响应示例（失败）
```json
{
  "success": false,
  "message": "邮箱或密码错误"
}
```

### 1.3 获取用户信息

#### 请求信息
- **接口**: `/users/profile`
- **方法**: `GET`
- **需要认证**: 是
- **请求头**: `Authorization: Bearer <token>`

#### 响应示例
```json
{
  "id": 1,
  "username": "test_user",
  "email": "test@example.com",
  "points": 100,
  "status": 1,
  "created_at": "2024-01-20T10:00:00Z",
  "bio": "用户简介",
  "profile_picture": "/uploads/avatars/default-avatar.jpg"
}
```

### 1.4 更新用户资料

#### 请求信息
- **接口**: `/users/profile`
- **方法**: `PUT`
- **需要认证**: 是
- **Content-Type**: `application/json`
- **请求头**: `Authorization: Bearer <token>`

#### 请求参数
| 参数名 | 类型   | 必填 | 说明     | 验证规则 |
|--------|--------|------|----------|----------|
| bio    | string | 是   | 个人简介 | 长度0-200 |

#### 请求示例
```json
{
  "bio": "这是我的个人简介"
}
```

#### 响应示例
```json
{
  "message": "个人资料更新成功"
}
```

### 1.5 更新用户头像

#### 请求信息
- **接口**: `/users/profile/avatar`
- **方法**: `PUT`
- **需要认证**: 是
- **Content-Type**: `multipart/form-data`
- **请求头**: `Authorization: Bearer <token>`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明     | 验证规则 |
|--------|------|------|----------|----------|
| avatar | file | 是   | 头像文件 | ≤2MB，格式：jpg,jpeg,png |

#### 响应示例
```json
{
  "message": "头像更新成功",
  "avatarUrl": "/uploads/avatars/avatar-1705743258999.jpg"
}
```

### 1.6 修改密码

#### 请求信息
- **接口**: `/users/password`
- **方法**: `PUT`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 请求参数
| 参数名      | 类型   | 必填 | 说明     | 验证规则 |
|-------------|--------|------|----------|----------|
| oldPassword | string | 是   | 原密码   | 长度6-20 |
| newPassword | string | 是   | 新密码   | 长度6-20，必须包含大小写字母和数字 |
| captcha     | string | 是   | 验证码   | 长度4，不区分大小写 |

#### 响应示例
```json
{
  "code": 200,
  "message": "密码修改成功"
}
```

### 1.7 获取用户积分

#### 请求信息
- **接口**: `/users/points`
- **方法**: `GET`
- **需要认证**: 是

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "points": 100,
    "history": [
      {
        "id": 1,
        "points": 10,
        "type": "签到",
        "created_at": "2024-01-20T10:00:00Z"
      }
    ]
  }
}
```

## 2. 动态模块

### 2.1 发布动态

#### 请求信息
- **接口**: `/moments`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `multipart/form-data`

#### 请求参数
| 参数名  | 类型   | 必填 | 说明                                |
|---------|--------|------|-------------------------------------|
| content | string | 是   | 动态内容，最大长度1000字           |
| images  | file[] | 否   | 图片文件，最多9张，每张不超过5MB |

#### 请求示例
```http
POST /api/moments
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="content"

今天天气真好，和朋友一起去爬山了！#户外运动# 
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="images"; filename="photo1.jpg"
Content-Type: image/jpeg

[二进制图片数据]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### 2.2 获取动态列表

#### 请求信息
- **接口**: `/moments/user/:userId?`
- **方法**: `GET`
- **需要认证**: 是

#### 路径参数
| 参数名  | 类型   | 必填 | 说明                           |
|---------|--------|------|--------------------------------|
| userId  | number | 否   | 用户ID，不传则获取所有用户动态 |

#### 查询参数
| 参数名    | 类型   | 必填 | 说明                           | 默认值 |
|-----------|--------|------|--------------------------------|---------|
| page      | number | 否   | 页码                           | 1       |
| limit     | number | 否   | 每页条数                       | 10      |
| following | number | 否   | 1=只看关注的人的动态           | 0       |

#### 请求示例
```http
GET /api/moments/user/1?page=1&limit=10&following=1
```

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": 10001,
        "user": {
          "id": 10001,
          "nickname": "张三",
          "avatar": "/uploads/avatars/user-123456.jpg"
        },
        "content": "今天天气真好，和朋友一起去爬山了！#户外运动#",
        "images": [
          "/uploads/moments/202401/photo1-123456.jpg",
          "/uploads/moments/202401/photo2-123456.jpg"
        ],
        "like_count": 5,
        "comment_count": 2,
        "is_liked": true,
        "created_at": "2024-01-20T10:00:00Z"
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

### 2.3 获取动态详情

#### 请求信息
- **接口**: `/moments/:momentId`
- **方法**: `GET`

#### 路径参数
| 参数名   | 类型   | 说明    |
|----------|--------|---------|
| momentId | number | 动态ID  |

#### 请求示例
```http
GET /api/moments/1
```

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "user_id": 10001,
    "user": {
      "id": 10001,
      "nickname": "张三",
      "avatar": "/uploads/avatars/user-123456.jpg"
    },
    "content": "今天天气真好，和朋友一起去爬山了！#户外运动#",
    "images": [
      "/uploads/moments/202401/photo1-123456.jpg",
      "/uploads/moments/202401/photo2-123456.jpg"
    ],
    "like_count": 5,
    "comment_count": 2,
    "is_liked": true,
    "created_at": "2024-01-20T10:00:00Z",
    "comments": [
      {
        "id": 1,
        "user": {
          "id": 10002,
          "nickname": "李四",
          "avatar": "/uploads/avatars/user-234567.jpg"
        },
        "content": "风景真不错！",
        "created_at": "2024-01-20T10:05:00Z"
      }
    ]
  }
}
```

### 2.4 点赞/取消点赞动态

#### 请求信息
- **接口**: `/moments/:momentId/like`
- **方法**: `POST`

#### 路径参数
| 参数名   | 类型   | 说明    |
|----------|--------|---------|
| momentId | number | 动态ID  |

#### 请求示例
```http
POST /api/moments/1/like
```

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "is_liked": true,
    "like_count": 6
  }
}
```

### 2.5 评论动态

#### 请求信息
- **接口**: `/moments/:momentId/comments`
- **方法**: `POST`
- **Content-Type**: `application/json`

#### 路径参数
| 参数名   | 类型   | 说明    |
|----------|--------|---------|
| momentId | number | 动态ID  |

#### 请求参数
| 参数名  | 类型   | 必填 | 说明                     |
|---------|--------|------|--------------------------|
| content | string | 是   | 评论内容，最大长度200字  |

#### 请求示例
```http
POST /api/moments/1/comments
Content-Type: application/json

{
  "content": "风景真不错！"
}
```

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "user": {
      "id": 10002,
      "nickname": "李四",
      "avatar": "/uploads/avatars/user-234567.jpg"
    },
    "content": "风景真不错！",
    "created_at": "2024-01-20T10:05:00Z"
  }
}
```

### 2.6 删除动态

#### 请求信息
- **接口**: `/moments/:momentId`
- **方法**: `DELETE`

#### 路径参数
| 参数名   | 类型   | 说明    |
|----------|--------|---------|
| momentId | number | 动态ID  |

#### 请求示例
```http
DELETE /api/moments/1
```

#### 响应示例
```json
{
  "code": 200,
  "message": "删除成功"
}
```

#### 注意事项
1. 发布动态时：
   - 图片格式支持：JPG、PNG、GIF
   - 图片大小限制：每张不超过10MB
   - 图片数量限制：最多9张
   - 内容长度：1-1000字
2. 评论限制：
   - 内容长度：1-200字
   - 需要登录才能评论
3. 删除动态：
   - 只能删除自己发布的动态
   - 删除动态会同时删除相关的评论和点赞记录
4. 图片上传：
   - 上传的图片会自动压缩和裁剪
   - 生成不同尺寸的缩略图
   - 图片URL格式：/uploads/moments/YYYYMM/filename-{random}.ext
5. 时间显示：
   - 所有时间字段均使用 ISO 8601 格式的 UTC 时间

## 3. 验证码模块

### 3.1 生成验证码

#### 请求信息
- **接口**: `/captcha/generate`
- **方法**: `GET`
- **响应类型**: `image/svg+xml`

#### 响应说明
- 直接返回SVG格式的验证码图片
- 验证码会存储在session中
- 不区分大小写


## 4. 新闻模块（用户端）

### 4.1 获取新闻分类

#### 请求信息
- **接口**: `/news/categories`
- **方法**: `GET`

#### 响应示例
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

### 4.2 获取新闻列表

#### 请求信息
- **接口**: `/news/articles`
- **方法**: `GET`

#### 查询参数
| 参数名      | 类型   | 必填 | 说明       | 默认值 |
|-------------|--------|------|------------|---------|
| page        | number | 否   | 页码       | 1       |
| limit       | number | 否   | 每页条数   | 10      |
| category_id | number | 否   | 分类ID     | -       |
| keyword     | string | 否   | 搜索关键词 | -       |

#### 请求示例
```http
GET /api/news/articles?page=1&limit=10&category_id=1&keyword=科技
```

#### 响应示例
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
        "cover_image": "/uploads/news/cover-123456.jpg",
        "author": "作者",
        "view_count": 100,
        "is_featured": 1,
        "publish_time": "2024-01-20T10:00:00Z"
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

### 4.3 获取新闻详情

#### 请求信息
- **接口**: `/news/articles/:articleId`
- **方法**: `GET`

#### 路径参数
| 参数名    | 类型   | 说明    |
|-----------|--------|---------|
| articleId | number | 文章ID  |

#### 请求示例
```http
GET /api/news/articles/1
```

#### 响应示例
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
    "cover_image": "/uploads/news/cover-123456.jpg",
    "author": "作者",
    "source": "来源",
    "view_count": 100,
    "is_featured": 1,
    "is_published": 1,
    "publish_time": "2024-01-20T10:00:00Z",
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-01-20T10:00:00Z"
  }
}
```

### 4.4 获取热门新闻

#### 请求信息
- **接口**: `/news/articles/featured`
- **方法**: `GET`

#### 查询参数
| 参数名 | 类型   | 必填 | 说明     | 默认值 | 最大值 |
|--------|--------|------|----------|---------|---------|
| limit  | number | 否   | 返回数量 | 5       | 20      |

#### 响应示例
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "title": "热门文章标题",
      "summary": "文章摘要",
      "cover_image": "/uploads/news/cover-123456.jpg",
      "view_count": 1000,
      "publish_time": "2024-01-20T10:00:00Z",
      "category_name": "最新资讯"
    }
  ]
}
```

#### 热门文章获取规则
1. 文章必须是已发布状态（`is_published = 1`）
2. 按以下优先级排序：
   - 首先是被设置为热门的文章（`is_featured = 1`）
   - 其次是浏览量超过100的文章
3. 在同等条件下，按发布时间倒序排序

### 4.5 获取相关新闻

#### 请求信息
- **接口**: `/news/articles/:articleId/related`
- **方法**: `GET`

#### 路径参数
| 参数名    | 类型   | 说明   |
|-----------|--------|--------|
| articleId | number | 文章ID |

#### 查询参数
| 参数名 | 类型   | 必填 | 说明     | 默认值 | 最大值 |
|--------|--------|------|----------|---------|---------|
| limit  | number | 否   | 返回数量 | 5       | 20      |

#### 响应示例
```json
{
  "code": 200,
  "data": [
    {
      "id": 2,
      "title": "相关文章标题",
      "summary": "文章摘要",
      "cover_image": "/uploads/news/cover-123456.jpg",
      "view_count": 50,
      "publish_time": "2024-01-20T10:00:00Z",
      "category_name": "最新资讯"
    }
  ]
}
```

#### 相关文章获取规则
1. 优先返回同分类下的文章：
   - 优先选择发布时间接近的文章（前后7天内）
   - 其次考虑浏览量较高的文章
2. 如果同分类文章数量不足，则补充其他分类的热门文章：
   - 补充的文章必须是热门文章（`is_featured = 1`）或浏览量超过100
   - 按浏览量降序排序
3. 排除当前正在查看的文章
4. 只返回已发布的文章（`is_published = 1`）

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 1001   | 用户名已存在 |
| 1002   | 邮箱已注册 |
| 1003   | 验证码错误 |
| 1004   | 密码错误 |
| 1005   | 账号不存在 |
| 2001   | 文件上传失败 |
| 2002   | 文件格式不支持 |
| 2003   | 文件大小超限 |
| 3001   | 没有操作权限 |
| 3002   | Token已过期 |
| 3003   | Token无效 |

## 注意事项

1. 所有时间字段均使用 ISO 8601 格式的 UTC 时间
2. 文件上传限制：
   - 头像：≤2MB，尺寸不超过
   - 动态图片：≤5MB/张，最多9张
   - 新闻封面：≤5MB，尺寸不超过
3. 支持的图片格式：
   - 头像：jpg、jpeg、png
   - 动态图片：jpg、jpeg、png、gif
   - 新闻封面：jpg、jpeg、png、webp
4. 图片处理说明：
   - 头像会自动裁剪为正方形
   - 动态图片会生成等比例缩略图
   - 新闻封面会按照指定尺寸裁剪
5. 分页接口说明：
   - page：页码，从1开始
   - limit：每页条数，默认10，最大100
6. 安全限制：
   - 用户密码必须包含大小写字母和数字，长度6-20位
   - 验证码有效期5分钟
   - 同一IP每分钟最多请求10次验证码