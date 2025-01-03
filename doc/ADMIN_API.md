# 后台管理 API 文档

## 基础信息

- **基础URL**: `http://127.0.0.1:3000/api/admin`
- **认证方式**: Bearer Token
- **请求头格式**: `Authorization: Bearer <token>`
- **响应格式**: JSON
- **文件上传**: `multipart/form-data`

### 认证说明

#### Token 说明
- Token 采用 JWT 格式
- 有效期：24小时
- 需要在每个请求的 Header 中携带
- 格式：`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`

#### Token 过期处理
- 当 Token 过期时，接口会返回 401 状态码
- 此时需要重新登录获取新的 Token
- 建议在前端做统一的 401 状态处理，跳转到登录页面

### 权限验证说明

#### 权限验证流程
1. 登录成功后获取 Token 和权限列表
2. 每个请求需要携带 Token
3. 服务端会根据 Token 获取用户角色和权限
4. 检查用户是否具有接口所需权限
5. 权限不足返回 403 状态码

#### 超级管理员
- 角色代码：`super_admin`
- 默认拥有所有权限
- 可以管理其他管理员
- 可以分配角色和权限

#### 普通管理员
- 角色代码：`admin`
- 权限需要单独分配
- 无法管理其他管理员
- 无法分配角色和权限

### 通用参数验证规则

#### 分页参数
| 参数名 | 类型   | 说明     | 验证规则 |
|--------|--------|----------|----------|
| page   | number | 页码     | 1. 必须大于0的整数<br>2. 默认值：1 |
| limit  | number | 每页条数 | 1. 必须在1-100之间的整数<br>2. 默认值：10 |

#### 日期参数
| 参数名    | 类型   | 说明     | 验证规则 |
|-----------|--------|----------|----------|
| startDate | string | 开始日期 | 1. 格式：YYYY-MM-DD<br>2. 不能大于结束日期 |
| endDate   | string | 结束日期 | 1. 格式：YYYY-MM-DD<br>2. 不能小于开始日期 |

### 响应状态码

| 状态码 | 说明 | 示例消息 |
|--------|------|----------|
| 200    | 操作成功 | "用户创建成功" |
| 400    | 请求参数错误 | "无效的参数：用户名长度必须在3-20之间" |
| 401    | 未认证或token过期 | "未认证或token已过期，请重新登录" |
| 403    | 权限不足 | "没有执行该操作的权限" |
| 404    | 资源不存在 | "用户不存在" |
| 500    | 服务器内部错误 | "服务器内部错误，请稍后重试" |

## 权限说明

### 角色类型
| 角色代码 | 角色名称 | 说明 |
|----------|----------|------|
| super_admin | 超级管理员 | 拥有所有权限 |
| admin | 管理员 | 拥有部分权限 |

### 权限代码
| 权限代码 | 说明 |
|----------|------|
| admin:list | 查看管理员列表 |
| admin:create | 创建新管理员 |
| admin:update | 更新管理员信息 |
| admin:delete | 删除管理员 |
| user:list | 查看用户列表 |
| user:detail | 查看用户详情 |
| user:update | 更新用户信息 |
| user:delete | 删除用户 |
| user:stats | 查看用户统计数据 |
| moment:list | 查看动态列表 |
| moment:delete | 删除动态 |
| moment:stats | 查看动态统计 |
| news:category:manage | 管理新闻分类（增删改查）|
| news:article:manage | 管理新闻文章（增删改查）|
| news:publish | 发布或下线新闻文章 |
| log:list | 查看操作日志 |
| log:stats | 查看日志统计 |
| log:clean | 清理历史日志 |

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
| password | string | 是   | 密码   | 长度6-20，必须包含大小写字母和数字 |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "admin": {
            "id": 1,
            "username": "lwhadmin",
            "email": "admin@example.com",
            "roles": [
                {
                    "name": "超级管理员",
                    "description": "系统超级管理员，拥有所有权限"
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
    "message": "操作成功",
    "data": {
        "id": 1,
        "username": "lwhadmin",
        "email": "admin@example.com",
        "status": 1,
        "created_at": "2024-12-28T14:44:55.000Z",
        "last_login": "2025-01-03T06:10:59.000Z",
        "roles": [
            {
                "name": "超级管理员",
                "description": "系统超级管理员，拥有所有权限"
            }
        ],
        "permissions": [
            {
                "name": "管理员列表",
                "code": "admin:list"
            },
            {
                "name": "创建管理员",
                "code": "admin:create"
            },
            {
                "name": "更新管理员",
                "code": "admin:update"
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
- **所需权限**: `user:list`

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
    "message": "操作成功",
    "data": {
        "items": [
            {
                "id": 1,
                "username": "testuser1",
                "password": "$2a$10$wpd59N.CfSbDUEj2nJmuh.3BCe4Dsd923EPw8zO6sYH5Qoqdc9vQS",
                "email": "test1@example.com",
                "points": 100,
                "status": 1,
                "created_at": "2024-12-28T14:44:55.000Z",
                "bio": "这是测试用户1的简介",
                "profile_picture": null
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

### 2.2 获取用户详情

#### 请求信息
- **接口**: `/users/:userId`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `user:detail`

#### 路径参数
| 参数名 | 类型   | 说明   |
|--------|--------|--------|
| userId | number | 用户ID |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "username": "testuser1",
        "password": "$2a$10$wpd59N.CfSbDUEj2nJmuh.3BCe4Dsd923EPw8zO6sYH5Qoqdc9vQS",
        "email": "test1@example.com",
        "points": 100,
        "status": 1,
        "created_at": "2024-12-28T14:44:55.000Z",
        "bio": "这是测试用户1的简介",
        "profile_picture": null,
        "recent_moments": []
    }
}
```

### 2.3 修改用户状态

#### 请求信息
- **接口**: `/users/:userId/status`
- **方法**: `PUT`
- **需要认证**: 是
- **所需权限**: `user:update`
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
    "message": "用户启用成功"
}
```

### 2.4 删除用户

#### 请求信息
- **接口**: `/users/:userId`
- **方法**: `DELETE`
- **需要认证**: 是
- **所需权限**: `user:delete`

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
- **所需权限**: `user:stats`

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "total_users": 8,
        "today_new_users": 0,
        "monthly_active_users": 2,
        "growth_trend": [
            {
                "date": "2024-12-27T16:00:00.000Z",
                "count": 1
            },
            {
                "date": "2024-12-28T16:00:00.000Z",
                "count": 4
            },
            {
                "date": "2024-12-31T16:00:00.000Z",
                "count": 1
            },
            {
                "date": "2025-01-01T16:00:00.000Z",
                "count": 2
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
- **所需权限**: `moment:list`

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
    "message": "操作成功",
    "data": {
        "items": [
            {
                "id": 27,
                "user_id": 3,
                "content": "这是一条无图片的动态",
                "created_at": "2025-01-02T14:22:37.000Z",
                "username": "lwh",
                "images": [] //无图片时
            }
        ],
        "pagination": {
            "total": 3,
            "page": 1,
            "limit": 10
        }
    }
}
```

### 3.2 删除动态

#### 请求信息
- **接口**: `/moments/:momentId`
- **方法**: `DELETE`
- **需要认证**: 是
- **所需权限**: `moment:delete`

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
- **所需权限**: `moment:stats`

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "total_moments": 2,
        "today_new_moments": 0,
        "growth_trend": [
            {
                "date": "2024-12-31T16:00:00.000Z",
                "count": 2
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
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "name": "最新资讯",
            "code": "latest",
            "sort_order": 1,
            "status": 1,
            "created_at": "2024-12-28T16:56:26.000Z",
            "updated_at": "2024-12-28T16:56:26.000Z"
        },
        {
            "id": 2,
            "name": "热点资讯",
            "code": "hot",
            "sort_order": 2,
            "status": 1,
            "created_at": "2024-12-28T16:56:26.000Z",
            "updated_at": "2024-12-28T16:56:26.000Z"
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
| name       | string | 是   | 分类名称 | 1. 长度2-20个字符 |
| code       | string | 是   | 分类代码 | 1. 长度2-20个字符<br>2. 只能包含小写字母、数字、下划线<br>3. 必须以字母开头 |
| sort_order | number | 否   | 排序     | 1. 最小值0 |
| status | number | 否 | 状态 | 0-禁用，1-启用 |

##### 请求示例

```json
{
  "name": "测试",
  "code": "test",
  "sort_order": 7,
  "status": "1"
}
```



##### 响应示例

```json
{
    "code": 200,
    "message": "新闻分类创建成功",
    "data": {
        "id": 7
    }
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
| code       | string | 是 | 分类代码 | 长度2-20 |
| sort_order | number | 否   | 排序     | 最小0 |
| status | number | 是 | 状态 | 0-禁用，1-启用 |

##### 请求示例

```json
{
  "name": "test3",
  "code": "test_code",
  "sort_order": 7,
  "status": 1
}
```

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
| is_published | number | 否   | 发布状态   | - 0：未发布，1：已发布 |
| keyword      | string | 否   | 搜索关键词 | -       |
| is_featured  | number | 否   | 是否热门   | - 0：未推荐，1：已推荐 |
| status | number | 否 | 文章状态 | - 1（0：禁用，1：启用） |

##### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "items": [
            {
                "id": 1,
                "category_id": 2,
                "title": "标题",
                "summary": "摘要",
                "cover_image": "封面图片",
                "author": "作者",
                "source": "来源",
                "view_count": 20,
                "is_featured": 1,
                "is_published": 1,
                "status": 1,
                "publish_time": "2024-12-30T13:22:10.000Z",
                "created_by": 1,
                "updated_by": 1,
                "created_at": "2024-01-02T02:37:33.000Z",
                "updated_at": "2024-01-02T14:52:24.000Z",
                "category_name": "热点资讯"
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
    "message": "操作成功",
    "data": {
        "id": 1,
        "category_id": 2,
        "title": "标题",
        "summary": "摘要",
        "content": "文章内容",
        "cover_image": "封面图片",
        "author": "作者",
        "source": "来源",
        "view_count": 20,
        "is_featured": 1,
        "is_published": 1,
        "publish_time": "2024-12-30T13:22:10.000Z",
        "status": 1,
        "created_by": 1,
        "updated_by": 1,
        "created_at": "2024-01-02T02:37:33.000Z",
        "updated_at": "2024-01-02T14:52:24.000Z",
        "category_name": "热点资讯"
    }
}
```

#### 4.2.1 创建文章

##### 请求信息
- **接口**: `/news/articles`
- **方法**: `POST`
- **需要认证**: 是
- **所需权限**: `news:article:manage`
- **Content-Type**: `application/json`

##### 请求参数
| 参数名       | 类型   | 必填 | 说明     | 验证规则 |
|--------------|--------|------|----------|----------|
| category_id  | number | 是   | 分类ID   | 大于0的整数 |
| title        | string | 是   | 文章标题 | 长度：1-100字符 |
| content      | string/object | 是 | 文章内容 | 支持HTML或Quill Delta格式 |
| summary      | string | 否   | 文章摘要 | 长度：0-200字符，不提供时自动从content生成 |
| cover_image  | string | 否   | 封面图片 | 必须是通过图片上传接口获得的URL |
| author       | string | 否   | 作者     | 长度：0-50字符 |
| source       | string | 否   | 来源     | 长度：0-100字符 |
| is_featured  | number | 否   | 是否推荐 | 0或1，默认0 |
| is_published | number | 否   | 是否发布 | 0或1，默认0 |
| publish_time | string | 否   | 发布时间 | ISO 8601格式，不提供时取当前时间 |

##### 请求示例（HTML格式）
```json
{
  "category_id": 1,
  "title": "示例新闻标题",
  "content": "<h1>新闻标题</h1><p>这是一段新闻正文，支持HTML格式。</p><p><strong>粗体文本</strong></p><p><em>斜体文本</em></p><p><a href='https://example.com' target='_blank' rel='noopener noreferrer'>链接文本</a></p><p><img src='/uploads/news/news-1704321234567-123456789.jpg' alt='示例图片' style='max-width: 100%'/></p><ul><li>列表项1</li><li>列表项2</li></ul><blockquote><p>这是一段引用文本</p></blockquote>",
  "summary": "这是一篇示例新闻的摘要内容",
  "cover_image": "/uploads/news/news-1704321234567-987654321.jpg",
  "author": "张三",
  "source": "官方发布",
  "is_featured": 1,
  "is_published": 1,
  "publish_time": "2024-01-20T10:00:00.000Z"
}
```

##### 请求示例（Quill Delta格式）
```json
{
  "category_id": 1,
  "title": "示例新闻标题",
  "content": {
    "ops": [
      {
        "insert": "新闻标题",
        "attributes": {
          "header": 1
        }
      },
      {
        "insert": "\n这是一段普通段落文本。\n"
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
          "image": "/uploads/news/news-1704321234567-123456789.jpg"
        },
        "attributes": {
          "style": {
            "max-width": "100%"
          },
          "alt": "示例图片"
        }
      },
      {
        "insert": "\n"
      },
      {
        "insert": "列表项1",
        "attributes": {
          "list": "bullet"
        }
      },
      {
        "insert": "列表项2",
        "attributes": {
          "list": "bullet"
        }
      },
      {
        "insert": "这是一段引用文本",
        "attributes": {
          "blockquote": true
        }
      },
      {
        "insert": "\n"
      }
    ]
  },
  "summary": "这是一篇示例新闻的摘要内容",
  "cover_image": "/uploads/news/news-1704321234567-987654321.jpg",
  "author": "张三",
  "source": "官方发布",
  "is_featured": 1,
  "is_published": 1,
  "publish_time": "2024-01-20T10:00:00.000Z"
}
```

##### 响应示例
```json
{
  "code": 200,
  "message": "新闻文章创建成功",
  "data": {
    "id": 1
  }
}
```

##### 注意事项
1. 内容格式说明：
   - HTML格式：直接传入HTML字符串
   - Quill Delta格式：传入Quill编辑器的Delta对象
   - 所有HTML内容都会经过安全过滤，不支持的标签和属性会被移除
2. 图片处理：
   - 支持在content中使用base64格式的图片，会自动转换为文件并存储
   - 图片文件统一存储在 public/uploads/news/ 目录下
   - 自动生成的图片文件名格式：news-时间戳-随机数.扩展名
3. 封面图片：
   - cover_image 必须是通过图片上传接口获得的URL
   - URL格式：/uploads/news/news-*.jpg
4. 摘要生成：
   - 如果不提供summary，会自动从content中提取文本并生成摘要
   - 自动生成的摘要最大长度为200字符

#### 4.2.2 更新文章

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
| 参数名       | 类型   | 必填 | 说明     | 验证规则 |
|--------------|--------|------|----------|----------|
| category_id  | number | 否   | 分类ID   | 大于0的整数 |
| title        | string | 否   | 文章标题 | 长度：1-100字符 |
| content      | string/object | 否 | 文章内容 | 支持HTML或Quill Delta格式 |
| summary      | string | 否   | 文章摘要 | 长度：0-200字符 |
| cover_image  | string | 否   | 封面图片 | 必须是通过图片上传接口获得的URL |
| author       | string | 否   | 作者     | 长度：0-50字符 |
| source       | string | 否   | 来源     | 长度：0-100字符 |
| is_featured  | number | 否   | 是否推荐 | 0或1 |
| is_published | number | 否   | 是否发布 | 0或1 |
| publish_time | string | 否   | 发布时间 | ISO 8601格式 |
| status       | number | 否   | 状态     | 0：草稿，1：正常 |

##### 请求示例
```json
{
  "title": "更新后的标题",
  "content": "<h1>更新后的标题</h1><p>这是更新后的内容。</p><p><strong>新增的粗体文本</strong></p><p><img src='/uploads/news/news-1704321234567-123456789.jpg' alt='更新的图片' style='max-width: 100%'/></p>",
  "summary": "更新后的摘要",
  "is_featured": 0,
  "status": 1
}
```

##### 更新文章请求示例（部分更新 - Quill Delta格式）
```json
{
  "title": "更新后的标题",
  "content": {
    "ops": [
      {
        "insert": "更新后的标题",
        "attributes": {
          "header": 1
        }
      },
      {
        "insert": "\n这是更新后的内容。\n"
      },
      {
        "insert": "新增的粗体文本",
        "attributes": {
          "bold": true
        }
      },
      {
        "insert": "\n"
      },
      {
        "insert": {
          "image": "/uploads/news/news-1704321234567-123456789.jpg"
        },
        "attributes": {
          "style": {
            "max-width": "100%"
          },
          "alt": "更新的图片"
        }
      },
      {
        "insert": "\n"
      }
    ]
  },
  "summary": "更新后的摘要",
  "is_featured": 0,
  "status": 1
}
```

##### 响应示例
```json
{
  "code": 200,
  "message": "新闻文章更新成功"
}
```

##### 注意事项
1. 所有字段都是可选的，支持部分字段更新
2. 内容处理：
   - 支持HTML和Quill Delta两种格式
   - 如果提供content，会自动：
     - 将Quill Delta格式转换为HTML
     - 处理base64格式的图片并保存到服务器
     - 清理不再使用的图片文件
3. 摘要处理：
   - 如果提供了新的content但未提供summary
   - 会自动从新的content中提取摘要
4. 图片处理：
   - 更新content时会自动清理不再使用的图片
   - 更新cover_image时会自动清理旧的封面图片
5. 发布状态：
   - 当is_published从0改为1时，会自动更新publish_time为当前时间
   - 如果同时提供了publish_time，则使用提供的时间


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
    "message": "文章发布成功"
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
    "message": "文章取消推荐成功"
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
| image  | file | 是   | 图片文件 | 1. 大小限制：5MB<br>2. 格式：jpg, jpeg, png, gif, webp |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "url": "/uploads/news/news-1704321234567-123456789.jpg"
    }
}
```

#### 注意事项
1. 图片存储规则：
   - 存储路径：public/uploads/news/
   - 文件命名格式：news-时间戳-随机数.扩展名
   - 自动创建存储目录（如果不存在）
2. 图片限制：
   - 文件大小：最大5MB
   - 支持格式：jpg、jpeg、png、gif、webp
3. 返回的url为相对路径，前端需要拼接域名使用
4. 图片处理：
   - 文章内容中的base64图片会自动转换为文件并存储
   - 删除文章时会自动清理相关的图片文件
   - 更新文章时会自动清理不再使用的图片
5. 图片访问：
   - 图片通过 /uploads/news/* 路径可直接访问
   - 支持跨域访问和缓存控制



## 5. 日志管理模块

### 5.1 获取操作日志列表

#### 请求信息
- **接口**: `/logs`
- **方法**: `GET`
- **需要认证**: 是
- **所需权限**: `log:list`

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
    "message": "操作成功",
    "data": {
        "items": [
            {
                "id": 26,
                "admin_id": 1,
                "operation_type": "GET /",
                "operation_desc": "lwhadmin 执行了 GET / 操作",
                "ip_address": "::ffff:127.0.0.1",
                "request_data": "{}",
                "response_data": "{\"code\":200,\"success\":true,\"message\":\"操作成功\",\"data\":{\"items\":[{\"id\":25,\"admin_id\":1,\"operation_type\":\"POST /clean\",\"operation_desc\":\"lwhadmin 执行了 POST /clean 操作\",\"ip_address\":\"::ffff:127.0.0.1\",\"request_data\":\"{\\\"beforeDate\\\":\\\"2024-12-29\\\"}\",\"response_data\":\"{\\\"code\\\":200,\\\"success\\\":true,\\\"message\\\":\\\"日志清理成功\\\",\\\"data\\\":{\\\"affectedRows\\\":24}}\",\"status_code\":200,\"created_at\":\"2024-12-28T15:12:25.000Z\",\"admin_username\":\"lwhadmin\"}],\"pagination\":{\"total\":1,\"page\":1,\"limit\":10}}}",
                "status_code": 200,
                "created_at": "2024-12-28T15:13:13.000Z",
                "admin_username": "lwhadmin"
            },
            {
                "id": 25,
                "admin_id": 1,
                "operation_type": "POST /clean",
                "operation_desc": "lwhadmin 执行了 POST /clean 操作",
                "ip_address": "::ffff:127.0.0.1",
                "request_data": "{\"beforeDate\":\"2024-12-29\"}",
                "response_data": "{\"code\":200,\"success\":true,\"message\":\"日志清理成功\",\"data\":{\"affectedRows\":24}}",
                "status_code": 200,
                "created_at": "2024-12-28T15:12:25.000Z",
                "admin_username": "lwhadmin"
            }
        ],
        "pagination": {
            "total": 2,
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
- **所需权限**: `log:stats`

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "total": 2,
        "today": 0,
        "operationStats": [
            {
                "operation_type": "POST /clean",
                "count": 1
            },
            {
                "operation_type": "GET /",
                "count": 1
            }
        ],
        "trend": [
            {
                "date": "2024-12-27T16:00:00.000Z",
                "count": 2
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
- **所需权限**: `log:clean`
- **Content-Type**: `application/json`

#### 请求参数
| 参数名     | 类型   | 必填 | 说明           | 验证规则 |
|------------|--------|------|----------------|----------|
| beforeDate | string | 是   | 清理此日期之前的日志 | YYYY-MM-DD格式 |

#### 响应示例
```json
{
    "code": 200,
    "message": "日志清理成功",
    "data": {
        "affectedRows": 2
    }
}
```

## 注意事项

1. 所有请求都需要携带有效的管理员 token

2. 所有时间字段均使用 ISO 8601 格式的 UTC 时间

3. 图片上传和处理：
   - 上传方式：
     - 通过 /news/upload 接口直接上传图片文件
     - 在文章内容中使用 base64 格式的图片（会自动转换为文件）
   - 存储规则：
     - 统一存储在 public/uploads/news/ 目录下
     - 文件命名格式：news-时间戳-随机数.扩展名
     - 自动创建存储目录（如果不存在）
   - 文件限制：
     - 支持格式：jpeg, jpg, png, gif, webp
     - 大小限制：5MB
   - 图片清理：
     - 删除文章时自动清理相关的所有图片
     - 更新文章时自动清理不再使用的图片
     - 更新封面图片时自动清理旧的封面图片
   - 图片访问：
     - 通过 /uploads/news/* 路径直接访问
     - 支持跨域访问和缓存控制

4. 文章内容支持两种格式：
   - HTML 格式：直接传入 HTML 字符串
   - Quill Delta 格式：传入 Quill 编辑器的 Delta 对象
   - 所有HTML内容都会经过安全过滤，不支持的标签和属性会被移除
   - 支持的HTML标签和属性详见"新闻内容格式说明"

5. 分页接口统一说明：
   - page：页码，从1开始
   - limit：每页条数，默认10

6. 权限验证：
   - 每个接口都需要相应的权限
   - 具体权限要求见各接口说明

7. 新闻内容格式说明：
   - 支持的HTML标签：
     - 文本格式：p, strong, em, u, s, blockquote, sub, sup
     - 标题：h1 ~ h6
     - 列表：ul, ol, li
     - 代码：pre, code
     - 表格：table, thead, tbody, tr, td, th
     - 多媒体：img, a
     - 通用：div, span, br
   - 支持的属性：
     - 通用：class, style
     - 链接：href, target, rel
     - 图片：src, alt, width, height, style, class
     - 列表：start
     - 表格：colspan, rowspan
   - 支持的样式：
     - 文本对齐：left, right, center, justify
     - 颜色：文本颜色、背景色
     - 字体：大小、行高
     - 缩进：padding-left, margin-left
     - 图片：width, height, max-width, max-height

2. 所有时间字段说明：
   - 支持 ISO 8601 格式：`YYYY-MM-DDThh:mm:ssZ`
   - 数据库使用 TIMESTAMP 类型存储，自动处理时区转换
   - 示例：
     - 创建/更新文章时：`2024-01-20T10:00:00Z`
     - 响应数据中：`2024-01-20T10:00:00.000Z`