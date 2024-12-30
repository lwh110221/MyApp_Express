# 后台管理 API 文档

## 基础信息

- **基础URL**: `http://127.0.0.1:3000/api/admin`
- **认证方式**: Bearer Token
- **请求头格式**: `Authorization: Bearer <token>`
- **响应格式**: JSON
- **文件上传**: `multipart/form-data`

## 权限说明

### 角色类型
| 角色ID | 角色名称 | 说明 |
|--------|----------|------|
| 1      | 超级管理员 | 拥有所有权限 |
| 2      | 管理员 | 拥有部分权限 |

### 权限代码
| 权限代码 | 说明 |
|----------|------|
| user:manage | 用户管理权限 |
| moment:manage | 动态管理权限 |
| news:category:manage | 新闻分类管理权限 |
| news:article:manage | 新闻文章管理权限 |
| news:publish | 新闻发布权限 |
| log:manage | 日志管理权限 |

## 1. 认证模块

### 1.1 管理员登录

#### 请求信息
- **接口**: `/auth/login`
- **方法**: `POST`
- **Content-Type**: `application/json`

#### 请求参数
| 参数名   | 类型   | 必填 | 说明   | 验证规则 |
|----------|--------|------|--------|----------|
| username | string | 是   | 用户名 | 长度3-20 |
| password | string | 是   | 密码   | 长度6-20 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "roles": [
        {
          "id": 1,
          "name": "超级管理员",
          "description": "拥有所有权限"
        }
      ]
    }
  }
}
```

### 1.2 获取管理员信息

#### 请求信息
- **接口**: `/auth/profile`
- **方法**: `GET`
- **需要认证**: 是

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "status": 1,
    "created_at": "2024-01-20T10:00:00Z",
    "last_login": "2024-01-20T10:00:00Z",
    "roles": [
      {
        "id": 1,
        "name": "超级管理员",
        "description": "拥有所有权限"
      }
    ],
    "permissions": [
      {
        "code": "user:manage",
        "name": "用户管理"
      }
    ]
  }
}
```

### 1.3 修改密码

#### 请求信息
- **接口**: `/auth/password`
- **方法**: `PUT`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 请求参数
| 参数名      | 类型   | 必填 | 说明   | 验证规则 |
|-------------|--------|------|--------|----------|
| oldPassword | string | 是   | 原密码 | 长度6-20 |
| newPassword | string | 是   | 新密码 | 长度6-20，必须包含大小写字母和数字 |

#### 响应示例
```json
{
  "code": 200,
  "message": "密码修改成功"
}
```

## 2. 用户管理模块

### 2.1 获取用户列表

#### 请求信息
- **接口**: `/users`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `user:manage`

#### 查询参数
| 参数名    | 类型   | 必填 | 说明       | 默认值 |
|-----------|--------|------|------------|---------|
| page      | number | 否   | 页码       | 1       |
| limit     | number | 否   | 每页条数   | 10      |
| username  | string | 否   | 用户名搜索 | -       |
| email     | string | 否   | 邮箱搜索   | -       |
| startDate | string | 否   | 开始日期   | -       |
| endDate   | string | 否   | 结束日期   | -       |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "items": [
      {
        "id": 1,
        "username": "test_user",
        "email": "test@example.com",
        "points": 100,
        "created_at": "2024-01-20T10:00:00Z",
        "status": 1,
        "bio": "用户简介",
        "profile_picture": "http://example.com/avatar.jpg"
      }
    ]
  }
}
```

### 2.2 获取用户详情

#### 请求信息
- **接口**: `/users/:userId`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `user:manage`

#### 路径参数
| 参数名 | 类型   | 说明   |
|--------|--------|--------|
| userId | number | 用户ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "test_user",
    "email": "test@example.com",
    "points": 100,
    "created_at": "2024-01-20T10:00:00Z",
    "status": 1,
    "bio": "用户简介",
    "profile_picture": "http://example.com/avatar.jpg",
    "recent_moments": [
      {
        "id": 1,
        "content": "动态内容",
        "created_at": "2024-01-20T10:00:00Z",
        "images": ["http://example.com/image1.jpg"]
      }
    ]
  }
}
```

### 2.3 修改用户状态

#### 请求信息
- **接口**: `/users/:userId/status`
- **方法**: `PUT`
- **需要认证**: 是
- **所需权限**: `user:manage`
- **Content-Type**: `application/json`

#### 路径参数
| 参数名 | 类型   | 说明   |
|--------|--------|--------|
| userId | number | 用户ID |

#### 请求参数
| 参数名 | 类型    | 必填 | 说明     | 取值   |
|--------|---------|------|----------|--------|
| status | boolean | 是   | 用户状态 | true/false |

#### 响应示例
```json
{
  "code": 200,
  "message": "用户状态修改成功"
}
```

### 2.4 删除用户

#### 请求信息
- **接口**: `/users/:userId`
- **方法**: `DELETE`
- **需要认证**: 是
- **所需权限**: `user:manage`

#### 路径参数
| 参数名 | 类型   | 说明   |
|--------|--------|--------|
| userId | number | 用户ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "用户删除成功"
}
```

### 2.5 获取用户统计数据

#### 请求信息
- **接口**: `/users/stats/overview`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `user:manage`

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "total_users": 1000,
    "today_new_users": 10,
    "monthly_active_users": 500,
    "growth_trend": [
      {
        "date": "2024-01-20",
        "count": 5
      }
    ]
  }
}
```

## 3. 动态管理模块

### 3.1 获取动态列表

#### 请求信息
- **接口**: `/moments`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `moment:manage`

#### 查询参数
| 参数名    | 类型   | 必填 | 说明     | 默认值 |
|-----------|--------|------|----------|---------|
| page      | number | 否   | 页码     | 1       |
| limit     | number | 否   | 每页条数 | 10      |
| startDate | string | 否   | 开始日期 | -       |
| endDate   | string | 否   | 结束日期 | -       |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "items": [
      {
        "id": 1,
        "content": "动态内容",
        "user_id": 1,
        "username": "test_user",
        "created_at": "2024-01-20T10:00:00Z",
        "images": ["http://example.com/image1.jpg"]
      }
    ]
  }
}
```

### 3.2 删除动态

#### 请求信息
- **接口**: `/moments/:momentId`
- **方法**: `DELETE`
- **需要认证**: 是
- **所需权限**: `moment:manage`

#### 路径参数
| 参数名   | 类型   | 说明   |
|----------|--------|--------|
| momentId | number | 动态ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "动态删除成功"
}
```

### 3.3 获取动态统计数据

#### 请求信息
- **接口**: `/moments/stats/overview`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `moment:manage`

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "total": 1000,
    "today": 50,
    "month": 500,
    "trend": [
      {
        "date": "2024-01-20",
        "count": 5
      }
    ]
  }
}
```

## 4. 新闻管理模块

### 4.1 新闻分类管理

#### 4.1.1 获取分类列表

##### 请求信息
- **接口**: `/news/categories`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `news:category:manage`

##### 响应示例
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
      "created_at": "2024-01-20T10:00:00Z",
      "updated_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

#### 4.1.2 创建分类

##### 请求信息
- **接口**: `/news/categories`
- **方法**: `POST`
- **需要认证**: 是
- **所需权限**: `news:category:manage`
- **Content-Type**: `application/json`

##### 请求参数
| 参数名     | 类型   | 必填 | 说明     | 验证规则 |
|------------|--------|------|----------|----------|
| name       | string | 是   | 分类名称 | 长度2-20 |
| code       | string | 是   | 分类代码 | 长度2-20，只能包含字母、数字、下划线 |
| sort_order | number | 否   | 排序     | 最小0 |

##### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1
  },
  "message": "新闻分类创建成功"
}
```

#### 4.1.3 更新分类

##### 请求信息
- **接口**: `/news/categories/:categoryId`
- **方法**: `PUT`
- **需要认证**: 是
- **所需权限**: `news:category:manage`
- **Content-Type**: `application/json`

##### 路径参数
| 参数名     | 类型   | 说明     |
|------------|--------|----------|
| categoryId | number | 分类ID   |

##### 请求参数
| 参数名     | 类型   | 必填 | 说明     | 验证规则 |
|------------|--------|------|----------|----------|
| name       | string | 否   | 分类名称 | 长度2-20 |
| sort_order | number | 否   | 排序     | 最小0 |
| status     | number | 否   | 状态     | 0或1 |

##### 响应示例
```json
{
  "code": 200,
  "message": "新闻分类更新成功"
}
```

#### 4.1.4 删除分类

##### 请求信息
- **接口**: `/news/categories/:categoryId`
- **方法**: `DELETE`
- **需要认证**: 是
- **所需权限**: `news:category:manage`

##### 路径参数
| 参数名     | 类型   | 说明   |
|------------|--------|--------|
| categoryId | number | 分类ID |

##### 响应示例
```json
{
  "code": 200,
  "message": "新闻分类删除成功"
}
```

### 4.2 新闻文章管理

#### 4.2.1 获取文章列表

##### 请求信息
- **接口**: `/news/articles`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `news:article:manage`

##### 查询参数
| 参数名       | 类型   | 必填 | 说明       | 默认值 |
|--------------|--------|------|------------|---------|
| page         | number | 否   | 页码       | 1       |
| limit        | number | 否   | 每页条数   | 10      |
| category_id  | number | 否   | 分类ID     | -       |
| is_published | number | 否   | 发布状态   | -       |
| keyword      | string | 否   | 搜索关键词 | -       |
| is_featured  | number | 否   | 是否热门   | -       |

##### 响应示例
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
        "publish_time": "2024-01-20T10:00:00Z",
        "created_at": "2024-01-20T10:00:00Z"
      }
    ]
  }
}
```

#### 4.2.2 获取文章详情

##### 请求信息
- **接口**: `/news/articles/:articleId`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `news:article:manage`

##### 路径参数
| 参数名    | 类型   | 说明    |
|-----------|--------|---------|
| articleId | number | 文章ID  |

##### 响应示例
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
    "publish_time": "2024-01-20T10:00:00Z",
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-01-20T10:00:00Z",
    "creator_name": "创建人"
  }
}
```

#### 4.2.3 创建文章

##### 请求信息
- **接口**: `/news/articles`
- **方法**: `POST`
- **需要认证**: 是
- **所需权限**: `news:article:manage`
- **Content-Type**: `application/json`

##### 请求参数
| 参数名       | 类型   | 必填 | 说明       | 验证规则 |
|--------------|--------|------|------------|----------|
| category_id  | number | 是   | 分类ID     | 大于0 |
| title        | string | 是   | 标题       | 长度2-100 |
| summary      | string | 否   | 摘要       | 长度0-200 |
| content      | string/object | 是 | 内容   | HTML或Quill Delta格式 |
| cover_image  | string | 否   | 封面图片   | 有效的URL |
| author       | string | 是   | 作者       | 长度2-20 |
| source       | string | 否   | 来源       | 长度0-50 |
| is_featured  | number | 否   | 是否热门   | 0或1 |
| is_published | number | 否   | 是否发布   | 0或1 |

##### 请求示例（HTML格式）
```json
{
  "category_id": 1,
  "title": "示例新闻标题",
  "summary": "这是一篇示例新闻的摘要内容",
  "content": "<h1>新闻标题</h1><p>这是一段新闻正文，支持HTML格式。</p><p><strong>粗体文本</strong></p><p><em>斜体文本</em></p><p><a href='https://example.com'>链接文本</a></p><p><img src='https://example.com/image.jpg' alt='图片描述'/></p>",
  "cover_image": "/uploads/news/cover-123456.jpg",
  "author": "张三",
  "source": "官方发布",
  "is_featured": 1,
  "is_published": 1
}
```

##### 请求示例（Quill Delta格式）
```json
{
  "category_id": 1,
  "title": "示例新闻标题",
  "summary": "这是一篇示例新闻的摘要内容",
  "content": {
    "ops": [
      {
        "insert": "新闻标题\n",
        "attributes": {
          "header": 1
        }
      },
      {
        "insert": "这是普通段落文本。\n"
      },
      {
        "insert": "这是粗体文本",
        "attributes": {
          "bold": true
        }
      },
      {
        "insert": "\n"
      },
      {
        "insert": "这是斜体文本",
        "attributes": {
          "italic": true
        }
      },
      {
        "insert": "\n"
      },
      {
        "insert": {
          "image": "https://example.com/image.jpg"
        }
      },
      {
        "insert": "\n"
      },
      {
        "insert": "带链接的文本",
        "attributes": {
          "link": "https://example.com"
        }
      },
      {
        "insert": "\n"
      },
      {
        "insert": "项目列表：\n",
        "attributes": {
          "header": 2
        }
      },
      {
        "insert": "列表项目1\n",
        "attributes": {
          "list": "bullet"
        }
      },
      {
        "insert": "列表项目2\n",
        "attributes": {
          "list": "bullet"
        }
      }
    ]
  },
  "cover_image": "/uploads/news/cover-123456.jpg",
  "author": "张三",
  "source": "官方发布",
  "is_featured": 1,
  "is_published": 1
}
```

##### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "示例新闻标题",
    "category_id": 1,
    "category_name": "最新资讯",
    "summary": "这是一篇示例新闻的摘要内容",
    "cover_image": "/uploads/news/cover-123456.jpg",
    "author": "张三",
    "source": "官方发布",
    "is_featured": 1,
    "is_published": 1,
    "created_at": "2024-01-20T10:00:00Z"
  },
  "message": "新闻文章创建成功"
}
```

#### 4.2.4 更新文章

##### 请求信息
- **接口**: `/news/articles/:articleId`
- **方法**: `PUT`
- **需要认证**: 是
- **所需权限**: `news:article:manage`
- **Content-Type**: `application/json`

##### 路径参数
| 参数名    | 类型   | 说明   |
|-----------|--------|--------|
| articleId | number | 文章ID |

##### 请求参数
| 参数名       | 类型   | 必填 | 说明       | 验证规则 |
|--------------|--------|------|------------|----------|
| category_id  | number | 否   | 分类ID     | 大于0 |
| title        | string | 否   | 标题       | 长度2-100 |
| summary      | string | 否   | 摘要       | 长度0-200 |
| content      | string/object | 否 | 内容   | HTML或Quill Delta格式 |
| cover_image  | string | 否   | 封面图片   | 有效的URL |
| author       | string | 否   | 作者       | 长度2-20 |
| source       | string | 否   | 来源       | 长度0-50 |
| is_featured  | number | 否   | 是否热门   | 0或1 |
| is_published | number | 否   | 是否发布   | 0或1 |

##### 请求示例（部分更新）
```json
{
  "title": "更新后的标题",
  "summary": "更新后的摘要",
  "content": {
    "ops": [
      {
        "insert": "更新后的标题\n",
        "attributes": {
          "header": 1
        }
      },
      {
        "insert": "这是更新后的内容。\n"
      },
      {
        "insert": "新增的粗体文本",
        "attributes": {
          "bold": true
        }
      },
      {
        "insert": "\n"
      }
    ]
  },
  "is_featured": 0
}
```

##### 响应示例
```json
{
  "code": 200,
  "message": "新闻文章更新成功",
  "data": {
    "id": 1,
    "title": "更新后的标题",
    "category_id": 1,
    "category_name": "最新资讯",
    "summary": "更新后的摘要",
    "is_featured": 0,
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

#### 4.2.5 删除文章

##### 请求信息
- **接口**: `/news/articles/:articleId`
- **方法**: `DELETE`
- **需要认证**: 是
- **所需权限**: `news:article:manage`

##### 路径参数
| 参数名    | 类型   | 说明   |
|-----------|--------|--------|
| articleId | number | 文章ID |

##### 响应示例
```json
{
  "code": 200,
  "message": "新闻文章删除成功"
}
```

#### 4.2.6 更新文章发布状态

##### 请求信息
- **接口**: `/news/articles/:articleId/publish`
- **方法**: `PUT`
- **需要认证**: 是
- **所需权限**: `news:publish`
- **Content-Type**: `application/json`

##### 路径参数
| 参数名    | 类型   | 说明   |
|-----------|--------|--------|
| articleId | number | 文章ID |

##### 请求参数
| 参数名       | 类型   | 必填 | 说明     | 取值 |
|--------------|--------|------|----------|------|
| is_published | number | 是   | 发布状态 | 0或1 |

##### 响应示例
```json
{
  "code": 200,
  "message": "文章已发布"
}
```

#### 4.2.7 更新文章热门状态

##### 请求信息
- **接口**: `/news/articles/:articleId/featured`
- **方法**: `PUT`
- **需要认证**: 是
- **所需权限**: `news:article:manage`
- **Content-Type**: `application/json`

##### 路径参数
| 参数名    | 类型   | 说明   |
|-----------|--------|--------|
| articleId | number | 文章ID |

##### 请求参数
| 参数名      | 类型   | 必填 | 说明     | 取值 |
|-------------|--------|------|----------|------|
| is_featured | number | 是   | 热门状态 | 0或1 |

##### 响应示例
```json
{
  "code": 200,
  "message": "文章已设为热门"
}
```

### 4.3 图片上传

#### 请求信息
- **接口**: `/news/upload`
- **方法**: `POST`
- **需要认证**: 是
- **所需权限**: `news:article:manage`
- **Content-Type**: `multipart/form-data`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明     | 验证规则 |
|--------|------|------|----------|----------|
| image  | file | 是   | 图片文件 | ≤5MB，格式：jpg,jpeg,png,gif,webp |

#### 响应示例
```json
{
  "code": 200,
  "message": "图片上传成功",
  "data": {
    "url": "/uploads/news/1705743258999-123456789.jpg"
  }
}
```

## 5. 日志管理模块

### 5.1 获取操作日志列表

#### 请求信息
- **接口**: `/logs`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `log:manage`

#### 查询参数
| 参数名    | 类型   | 必填 | 说明     | 默认值 |
|-----------|--------|------|----------|---------|
| page      | number | 否   | 页码     | 1       |
| limit     | number | 否   | 每页条数 | 10      |
| startDate | string | 否   | 开始日期 | -       |
| endDate   | string | 否   | 结束日期 | -       |

#### 响应示例
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

### 5.2 获取日志统计数据

#### 请求信息
- **接口**: `/logs/stats`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `log:manage`

#### 响应示例
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

### 5.3 清理日志

#### 请求信息
- **接口**: `/logs/clean`
- **方法**: `POST`
- **需要认证**: 是
- **所需权限**: `log:manage`
- **Content-Type**: `application/json`

#### 请求参数
| 参数名     | 类型   | 必填 | 说明           | 验证规则 |
|------------|--------|------|----------------|----------|
| beforeDate | string | 是   | 清理此日期之前的日志 | YYYY-MM-DD格式 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "affectedRows": 100
  },
  "message": "日志清理成功"
}
```

## 注意事项

1. 所有请求都需要携带有效的管理员 token
2. 所有时间字段均使用 ISO 8601 格式的 UTC 时间
3. 图片上传相关说明：
   - 使用 multipart/form-data 格式
   - 支持格式：jpeg, jpg, png, gif, webp
   - 大小限制：5MB
4. 文章内容支持两种格式：
   - HTML 格式：直接传入 HTML 字符串
   - Quill Delta 格式：传入 Quill 编辑器的 Delta 对象
5. 分页接口统一说明：
   - page：页码，从1开始
   - limit：每页条数，默认10
6. 权限验证：
   - 每个接口都需要相应的权限
   - 超级管理员默认拥有所有权限
   - 普通管理员需要单独分配权限 