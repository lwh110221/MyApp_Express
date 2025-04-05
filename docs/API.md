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
  "username": "用户名",
  "email": "邮箱",
  "password": "密码",
  "captcha": "验证码"
}
```

#### 响应示例（成功）
```json
{
  "code": 201,
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
  "email": "邮箱",
  "password": "密码"
}
```

#### 响应示例（成功）
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "username": "用户名",
    "email": "邮箱"
  }
}
```

#### 响应示例（失败）
```json
{
  "code": 401,
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
   "id": ID,
   "username": "用户名",
   "email": "邮箱",
   "points": 积分数,
   "status": 1,
   "created_at": "2024-12-29T09:37:24.000Z",
   "bio": "简介",
   "profile_picture": "/uploads/avatars/default-avatar.jpg"
}
```

### 1.4 更新用户资料（简介）

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

#### 请求示例

```json
{
  "oldPassword": "原密码",
  "newPassword": "新密码",
  "captcha": "验证码"
}
```

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
    "points": 300
}
```

### 1.8 获取用户积分记录

#### 请求信息
- **接口**: `/users/points/records`
- **方法**: `GET`
- **需要认证**: 是

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |

#### 响应示例
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "items": [
      {
        "id": 5,
        "user_id": 3,
        "points": 10,
        "type": "post_create",
        "related_id": 15,
        "description": "发布社区帖子（ID: 15）",
        "created_at": "2025-01-10T14:25:30.000Z"
      },
      {
        "id": 4,
        "user_id": 3,
        "points": 2,
        "type": "post_like",
        "related_id": 12,
        "description": "帖子获得点赞（ID: 12）",
        "created_at": "2025-01-10T14:20:15.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 1.9 获取用户主页资料

#### 请求信息
- **接口**: `/users/:userId/profile`
- **方法**: `GET`
- **需要认证**: 否 (提供token可获取是否已关注该用户)

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 3,
    "username": "张三",
    "profile_picture": "/uploads/avatars/avatar-123.jpg",
    "bio": "热爱农业的普通用户",
    "created_at": "2025-01-01T10:00:00.000Z",
    "post_count": 15,
    "follower_count": 5,
    "following_count": 10,
    "is_followed": false,
    "identity_types": ["FARMER"],
    "points": 325
  }
}
```

### 1.10 关注用户

#### 请求信息
- **接口**: `/users/:userId/follow`
- **方法**: `POST`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "关注成功"
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "已经关注过该用户"
}
```

### 1.11 取消关注用户

#### 请求信息
- **接口**: `/users/:userId/unfollow`
- **方法**: `POST`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "取消关注成功"
}
```

### 1.12 获取用户关注列表

#### 请求信息
- **接口**: `/users/:userId/following`
- **方法**: `GET`
- **需要认证**: 否 (提供token可获取是否已关注列表中的用户)

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 20 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 5,
        "username": "李四",
        "profile_picture": "/uploads/avatars/avatar-456.jpg",
        "bio": "专注水稻种植技术研究10年",
        "is_followed": true
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20
    }
  }
}
```

### 1.13 获取用户粉丝列表

#### 请求信息
- **接口**: `/users/:userId/followers`
- **方法**: `GET`
- **需要认证**: 否 (提供token可获取是否已关注列表中的用户)

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 20 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 8,
        "username": "王五",
        "profile_picture": "/uploads/avatars/avatar-789.jpg",
        "bio": "对农业充满热情的新手",
        "is_followed": false
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20
    }
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

#### 响应示例（有图片）
```json
{
    "success": true,
    "message": "动态发布成功",
    "moment": {
        "id": 28,
        "content": "这是一条有图片动态",
        "created_at": "2025-01-02T14:28:06.000Z",
        "username": "lwh",
        "user_id": 3,
        "profile_picture": "/uploads/avatars/avatar-1735827505008-630083796.jpeg",
        "images": [
            "/uploads/moments/moment-1735828086704-831884323.png"
        ] //无图片这里为空
    }
}
```

### 2.2 获取动态列表

#### 请求信息
- **接口**: `/moments/user/:userId?`
- **方法**: `GET`
- **需要认证**: 是

#### 不需要填入userid，直接通过token认证获得对应用户的动态
#### 查询参数
| 参数名    | 类型   | 必填 | 说明                           | 默认值 |
|-----------|--------|------|--------------------------------|---------|
| page      | number | 否   | 页码                           | 1       |
| limit     | number | 否   | 每页条数                       | 10      |

#### 请求示例
```http
GET /moments/user/:userId?page=1&limit=10
```

#### 响应示例
```json
[
    {
        "id": 28,
        "content": "这是一条有图片动态",
        "created_at": "2025-01-02T14:28:06.000Z",
        "username": "lwh",
        "user_id": 3,
        "profile_picture": "/uploads/avatars/avatar-1735827505008-630083796.jpeg",
        "images": [
            "/uploads/moments/moment-1735828086704-831884323.png"
        ]
    },
    {
        "id": 27,
        "content": "这是一条无图片的动态",
        "created_at": "2025-01-02T14:22:37.000Z",
        "username": "lwh",
        "user_id": 3,
        "profile_picture": "/uploads/avatars/avatar-1735827505008-630083796.jpeg",
        "images": []
    }
]
```

### 2.3 删除动态

#### 请求信息
- **接口**: `/moments/:momentId`
- **方法**: `DELETE`

#### 路径参数
| 参数名   | 类型   | 说明    |
|----------|--------|---------|
| momentId | number | 动态ID  |

#### 响应示例
```json
{
    "message": "动态已删除"
}
```

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
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "name": "最新资讯",
            "code": "latest"
        },
        {
            "id": 2,
            "name": "热点资讯",
            "code": "hot"
        },
        {
            "id": 3,
            "name": "政策资讯",
            "code": "policy"
        },
        {
            "id": 4,
            "name": "每周周刊",
            "code": "weekly"
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
| category_id | number | 否   | 分类ID     | -可选     |
| keyword     | string | 否   | 搜索关键词 | -可选 支持标题和摘要模糊搜索 |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "items": [
            {
                "id": 1,
                "category_id": 2,
                "category_name": "热点资讯",
                "title": "标题.",
                "summary": "摘要",
                "cover_image": "封面",
                "author": "作者",
                "view_count": 浏览量,
                "is_featured": 1,
                "publish_time": "2024-12-30T13:22:10.000Z"
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

#### 说明
1. 只返回有效的分类(status = 1)
2. 按sort_order升序排序
3. 返回字段:id、name、code

### 4.3 获取新闻详情

#### 请求信息
- **接口**: `/news/articles/:articleId`
- **方法**: `GET`

#### 路径参数
| 参数名    | 类型   | 说明   |
|-----------|--------|--------|
| articleId | number | 文章ID |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "category_id": 2,
        "title": "Miss.",
        "summary": "qynaN2hId4",
        "content": "内容（支持quill富文本格式）",
        "cover_image": "",
        "author": "zqrJZoaKlU",
        "source": "LJvwGdFSMV",
        "view_count": 206,
        "is_featured": 1,
        "is_published": 1,
        "publish_time": "2024-12-30T13:22:10.000Z",
        "status": 1,
        "created_by": 1,
        "updated_by": 1,
        "created_at": "2004-09-20T02:37:33.000Z",
        "updated_at": "2025-01-02T14:52:24.000Z",
        "category_name": "热点资讯"
    }
}
```

#### 说明

1. 只能获取已发布(is_published = 1)且有效(status = 1)的文章
2. 每次访问文章详情,会在事务中:
   - 更新浏览量(view_count + 1)
   - 获取文章详情(包含分类信息)
3. 如果文章不存在或未发布,返回404错误

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
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "title": "Miss.",
            "summary": "qynaN2hId4",
            "cover_image": "",
            "view_count": 206,
            "publish_time": "2024-12-30T13:22:10.000Z",
            "category_name": "热点资讯"
        }
    ]
}
```

#### 热门文章获取规则
1. 默认返回5条记录(可通过limit参数调整,最大20条)
2. 只返回已发布(is_published = 1)且有效(status = 1)的文章
3. 优先返回设置为热门的文章(is_featured = 1),按发布时间降序排序
4. 如果热门文章数量不足limit值:
   - 补充浏览量>=100的非热门文章
   - 补充文章按浏览量降序、发布时间降序排序
   - 排除已返回的热门文章

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
    "message": "操作成功",
    "data": [] //当前无相关
}
```

#### 相关文章获取规则

1. 默认返回5条记录(可通过limit参数调整,最大20条)
2. 只返回已发布(is_published = 1)且有效(status = 1)的文章
3. 优先返回同分类下的文章:
   - 按发布时间接近程度排序(使用TIMESTAMPDIFF计算时间差)
   - 时间差相同时,按浏览量降序排序
4. 如果同分类文章数量不足limit值:
   - 补充其他分类的文章
   - 补充条件:is_featured = 1 或 view_count >= 100
   - 按浏览量降序排序
5. 排除当前正在查看的文章(id != articleId)

## 5. 身份认证模块

### 5.1 获取身份类型列表

#### 请求信息
- **接口**: `/identities/types`
- **方法**: `GET`
- **需要认证**: 否

#### 响应示例
```json
{
    "code": 200,
    "message": "获取身份类型列表成功",
    "data": [
        {
            "code": "NORMAL",
            "name": "普通用户",
            "needCertification": false
        },
        {
            "code": "FARMER",
            "name": "农户",
            "needCertification": true,
            "requirements": {
                "requiredFields": [
                    "idCard",
                    "landCertificate"
                ],
                "description": "需要提供身份证和土地证明"
            }
        },
        {
            "code": "DEALER",
            "name": "经销商",
            "needCertification": true,
            "requirements": {
                "requiredFields": [
                    "businessLicense",
                    "foodPermit"
                ],
                "description": "需要提供营业执照和食品经营许可证"
            }
        },
        {
            "code": "EXPERT",
            "name": "农业专家",
            "needCertification": true,
            "requirements": {
                "requiredFields": [
                    "professionalCert",
                    "workProof"
                ],
                "description": "需要提供职称证书和工作证明"
            }
        }
    ]
}
```

### 5.2 获取当前用户身份列表

#### 请求信息
- **接口**: `/identities/my`
- **方法**: `GET`
- **需要认证**: 是

#### 响应示例
```json
{
    "code": 200,
    "message": "获取用户身份列表成功",
    "data": [
        {
            "id": 1,
            "user_id": 3,
            "identity_type": "FARMER",
            "status": 1,
            "certification_time": "2025-01-07T08:15:31.000Z",
            "expiration_time": "2026-01-07T08:15:31.000Z",
            "meta_data": {},
            "created_at": "2025-01-07T08:15:31.000Z",
            "updated_at": "2025-01-07T08:15:31.000Z",
            "typeInfo": {
                "code": "FARMER",
                "name": "农户",
                "needCertification": true,
                "validityDays": 365,
                "certificationRequirements": {
                    "requiredFields": [
                        "idCard",
                        "landCertificate"
                    ],
                    "description": "需要提供身份证和土地证明"
                }
            }
        }
    ]
}
```

### 5.3 申请身份认证

#### 请求信息
- **接口**: `/identities/apply`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| identityType | string | 是 | 身份类型编码 | 必须是有效的身份类型 |
| certificationData | object | 是 | 认证资料 | 必须包含该身份类型要求的所有必需字段 |

#### 请求示例
```json
{
    "identityType": "EXPERT",
    "certificationData": {
        "professionalCert": "http://example.com/path/to/idcard.jpg",
        "workProof": "http://example.com/path/to/land.jpg"
    }
}
```

#### 响应示例
```json
{
    "code": 200,
    "message": "认证申请提交成功",
    "data": {
        "id": 3,
        "status": 0,
        "message": "认证申请已提交，等待审核"
    }
}
```


## 注意事项

1. 所有时间字段均使用 ISO 8601 格式的 UTC 时间

2. 文件上传限制：
   - 新闻图片：≤5MB
   - 支持格式：jpg、jpeg、png、gif、webp

3. 图片处理说明：
   - 新闻内容中的base64图片会自动转存到服务器
   - 图片存储路径：/uploads/news/
   - 自动清理不再使用的图片文件

4. 分页接口说明：
   - page：页码，从1开始
   - limit：每页条数，默认10

## 6. 专家求助模块

### 6.1 获取求助分类列表

#### 请求信息
- **接口**: `/help/categories`
- **方法**: `GET`
- **需要认证**: 否

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": [
        {
            "id": 1,
            "name": "种植技术",
            "sort_order": 1,
            "status": 1
        },
        {
            "id": 2,
            "name": "病虫害防治",
            "sort_order": 2,
            "status": 1
        }
    ]
}
```

### 6.2 发布求助

#### 请求信息
- **接口**: `/help/posts`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| title | string | 是 | 求助标题 | 长度：1-100字符 |
| content | string | 是 | 求助内容 | 长度：1-2000字符 |
| category_id | number | 是 | 分类ID | 大于0的整数 |
| images | array | 否 | 图片URL数组 | 最多9张图片 |

#### 请求示例
```json
{
    "title": "玉米苗期管理问题",
    "content": "玉米苗期出现黄叶，请问是什么原因？",
    "category_id": 1,
    "images": [
        "/uploads/help/image-1234567890.jpg"
    ]
}
```

#### 响应示例
```json
{
    "code": 200,
    "message": "发布成功",
    "data": {
        "id": 1
    }
}
```

### 6.3 获取求助列表

#### 请求信息
- **接口**: `/help/posts`
- **方法**: `GET`
- **需要认证**: 否

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |
| category_id | number | 否 | 分类ID | - |
| status | number | 否 | 状态(1-待解决,2-已解决) | - |
| keyword | string | 否 | 搜索关键词 | - |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "items": [
            {
                "id": 4,
                "user_id": 1,
                "title": "玉米苗期发黄怎么处理？",
                "content": "最近种植的玉米苗期出现大面积发黄现象，请问可能是什么原因导致的？该如何处理？",
                "images": [],
                "category_id": 1,
                "status": 1,
                "view_count": 0,
                "created_at": "2025-03-23T12:26:46.000Z",
                "updated_at": "2025-03-23T12:26:46.000Z",
                "author_name": "testuser1",
                "category_name": "种植技术",
                "answer_count": 0
            },
            {
                "id": 5,
                "user_id": 1,
                "title": "水稻纹枯病如何防治",
                "content": "水稻出现纹枯病症状，面积较大，求专业的防治方案。",
                "images": [],
                "category_id": 2,
                "status": 1,
                "view_count": 0,
                "created_at": "2025-03-23T12:26:46.000Z",
                "updated_at": "2025-03-23T12:26:46.000Z",
                "author_name": "testuser1",
                "category_name": "病虫害防治",
                "answer_count": 0
            },
            {
                "id": 3,
                "user_id": 2,
                "title": "水稻种植问题",
                "content": "今年水稻叶片发黄，请问是什么原因？",
                "images": [
                    {
                        "url": "/uploads/help/help-1742732712636-460822328.jpg",
                        "filename": "help-1742732712636-460822328.jpg"
                    }
                ],
                "category_id": 1,
                "status": 1,
                "view_count": 0,
                "created_at": "2025-03-23T12:25:26.000Z",
                "updated_at": "2025-03-23T12:25:26.000Z",
                "author_name": "test",
                "category_name": "种植技术",
                "answer_count": 0
            },
            {
                "id": 1,
                "user_id": 1,
                "title": "玉米苗期发黄怎么处理？",
                "content": "最近种植的玉米苗期出现大面积发黄现象，请问可能是什么原因导致的？该如何处理？",
                "images": [],
                "category_id": 1,
                "status": 1,
                "view_count": 0,
                "created_at": "2025-03-23T12:08:53.000Z",
                "updated_at": "2025-03-23T12:08:53.000Z",
                "author_name": "testuser1",
                "category_name": "种植技术",
                "answer_count": 1
            },
            {
                "id": 2,
                "user_id": 1,
                "title": "水稻纹枯病如何防治",
                "content": "水稻出现纹枯病症状，面积较大，求专业的防治方案。",
                "images": [],
                "category_id": 2,
                "status": 1,
                "view_count": 0,
                "created_at": "2025-03-23T12:08:53.000Z",
                "updated_at": "2025-03-23T12:08:53.000Z",
                "author_name": "testuser1",
                "category_name": "病虫害防治",
                "answer_count": 0
            }
        ],
        "pagination": {
            "total": 5,
            "page": 1,
            "limit": 10
        }
    }
}
```

### 6.4 获取求助详情

#### 请求信息
- **接口**: `/help/posts/:postId`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 求助ID |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "user_id": 1,
        "title": "玉米苗期发黄怎么处理？",
        "content": "最近种植的玉米苗期出现大面积发黄现象，请问可能是什么原因导致的？该如何处理？",
        "images": [],
        "category_id": 1,
        "status": 1,
        "view_count": 1,
        "created_at": "2025-03-23T12:08:53.000Z",
        "updated_at": "2025-03-23T12:49:07.000Z",
        "author_name": "testuser1",
        "category_name": "种植技术"
    }
}
```

### 6.5 更新求助状态

#### 请求信息
- **接口**: `/help/posts/:postId/status`
- **方法**: `PUT`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 求助ID |

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| status | number | 是 | 状态 | 0-删除,1-待解决,2-已解决 |

#### 响应示例
```json
{
    "code": 200,
    "message": "更新成功"
}
```

### 6.6 发表回答

#### 请求信息
- **接口**: `/help/posts/:postId/answers`
- **方法**: `POST`
- **需要认证**: 是
- **需要专家身份**: 是
- **Content-Type**: `application/json`

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 求助ID |

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| content | string | 是 | 回答内容 | 长度：1-2000字符 |
| images | array | 否 | 图片URL数组 | 最多9张图片 |

#### 请求示例
```json
{
    "content": "这种情况可能是缺素导致，建议...",
    "images": [
        "/uploads/help/answer-1234567890.jpg"
    ]
}
```

#### 响应示例
```json
{
    "code": 200,
    "message": "回答成功",
    "data": {
        "id": 1
    }
}
```

### 6.7 获取回答列表

#### 请求信息
- **接口**: `/help/posts/:postId/answers`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 求助ID |

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |

#### 响应示例
```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "items": [
            {
                "id": 1,
                "post_id": 1,
                "expert_id": 2,
                "content": "根据描述，玉米苗期发黄可能有以下几个原因：\n1. 氮肥不足\n2. 土壤板结\n3. 缺铁或锌\n建议：\n1. 追施氮肥\n2. 中耕松土\n3. 喷施微量元素",
                "images": [
                    {
                        "url": "/uploads/help/help-1742732712636-460822328.jpg",
                        "filename": "help-1742732712636-460822328.jpg"
                    }
                ],
                "is_accepted": 0,
                "created_at": "2025-03-23T12:35:50.000Z",
                "updated_at": "2025-03-23T12:35:50.000Z",
                "expert_name": "test"
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

### 6.8 采纳回答

#### 请求信息
- **接口**: `/help/answers/:answerId/accept`
- **方法**: `PUT`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| answerId | number | 回答ID |

#### 响应示例
```json
{
    "code": 200,
    "message": "采纳成功"
}
```

### 6.9 删除回答

#### 请求信息
- **接口**: `/help/answers/:answerId`
- **方法**: `DELETE`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| answerId | number | 回答ID |

#### 响应示例
```json
{
    "code": 200,
    "message": "删除成功"
}
```

### 6.10 上传图片

#### 请求信息
- **接口**: `/help/upload`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `multipart/form-data`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| images | file[] | 是 | 图片文件 | 1. 每个文件≤5MB<br>2. 格式：jpg,jpeg,png<br>3. 最多9张 |

#### 响应示例
```json
{
    "code": 200,
    "message": "图片上传成功",
    "data": [
        {
            "url": "/uploads/help/image-1234567890.jpg",
            "filename": "image-1234567890.jpg"
        }
    ]
}
```

## 7. 社区模块 (Community)

### 7.1 获取帖子列表

#### 请求信息
- **接口**: `/community/posts`
- **方法**: `GET`
- **需要认证**: 否

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |
| tag | string | 否 | 标签筛选 | - |
| keyword | string | 否 | 搜索关键词 | - |
| sort | string | 否 | 排序方式：latest(最新), popular(热门), hot(最热) | latest |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "一个有趣的话题",
        "content": "这是帖子内容...",
        "images": ["http://example.com/image1.jpg", "http://example.com/image2.jpg"],
        "tags": ["娱乐", "生活"],
        "author": {
          "id": 1,
          "username": "user1",
          "avatar": "http://example.com/avatar.jpg"
        },
        "view_count": 120,
        "like_count": 35,
        "comment_count": 15,
        "created_at": "2024-01-15T08:30:00.000Z",
        "updated_at": "2024-01-15T09:15:00.000Z",
        "is_liked": false
      }
      // ... 更多帖子
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 7.2 搜索帖子

#### 请求信息
- **接口**: `/community/posts/search`
- **方法**: `GET`
- **需要认证**: 否

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| keyword | string | 否 | 搜索关键词 | - |
| tags | string/array | 否 | 标签筛选（多个标签用逗号分隔或传递数组） | - |
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |
| sort | string | 否 | 排序方式：latest(最新), popular(热门), hot(最热) | latest |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "搜索结果帖子",
        "content": "包含关键词的内容...",
        "images": ["http://example.com/image1.jpg"],
        "tags": ["旅行", "分享"],
        "author": {
          "id": 1,
          "username": "user1",
          "avatar": "http://example.com/avatar.jpg"
        },
        "view_count": 56,
        "like_count": 12,
        "comment_count": 5,
        "created_at": "2024-01-16T10:20:00.000Z",
        "updated_at": "2024-01-16T10:25:00.000Z",
        "is_liked": false
      }
      // ... 更多搜索结果
    ],
    "pagination": {
      "total": 24,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 7.3 获取热门标签

#### 请求信息
- **接口**: `/community/tags/hot`
- **方法**: `GET`
- **需要认证**: 否

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| limit | number | 否 | 返回标签数量 | 10 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "tags": [
      {
        "id": 2,
        "name": "旅行",
        "used_count": 156
      },
      {
        "id": 5,
        "name": "美食",
        "used_count": 124
      },
      {
        "id": 1,
        "name": "生活",
        "used_count": 98
      }
      // ... 更多标签
    ]
  }
}
```

### 7.4 获取特定标签下的帖子

#### 请求信息
- **接口**: `/community/tags/{tagName}/posts`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| tagName | string | 标签名称 |

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 5,
        "title": "带有指定标签的帖子",
        "content": "帖子内容...",
        "images": ["http://example.com/tag_post_image.jpg"],
        "tags": ["旅行", "分享", "摄影"],
        "author": {
          "id": 3,
          "username": "user3",
          "avatar": "http://example.com/avatar3.jpg"
        },
        "view_count": 78,
        "like_count": 23,
        "comment_count": 8,
        "created_at": "2024-01-17T14:30:00.000Z",
        "updated_at": "2024-01-17T14:35:00.000Z",
        "is_liked": false
      }
      // ... 更多帖子
    ],
    "pagination": {
      "total": 32,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 7.5 获取帖子详情

#### 请求信息
- **接口**: `/community/posts/{postId}`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 帖子ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "一个有趣的话题",
    "content": "这是完整的帖子内容...",
    "images": ["http://example.com/image1.jpg", "http://example.com/image2.jpg"],
    "tags": ["娱乐", "生活"],
    "author": {
      "id": 1,
      "username": "user1",
      "avatar": "http://example.com/avatar.jpg"
    },
    "view_count": 121,
    "like_count": 35,
    "comment_count": 15,
    "created_at": "2024-01-15T08:30:00.000Z",
    "updated_at": "2024-01-15T09:15:00.000Z",
    "is_liked": false
  }
}
```

### 7.6 创建帖子

#### 请求信息
- **接口**: `/community/posts`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 帖子标题 (5-50字符) |
| content | string | 是 | 帖子内容 (10-5000字符) |
| images | array | 否 | 图片URL数组 (最多9张) |
| tags | array | 否 | 标签数组 (最多5个) |

#### 请求示例
```json
{
  "title": "分享一个有趣的经历",
  "content": "今天我遇到了...",
  "images": ["http://example.com/upload1.jpg", "http://example.com/upload2.jpg"],
  "tags": ["旅行", "分享"]
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "发布成功",
  "data": {
    "id": 101,
    "title": "分享一个有趣的经历",
    "created_at": "2024-01-16T10:30:00.000Z"
  }
}
```

### 7.7 更新帖子

#### 请求信息
- **接口**: `/community/posts/{postId}`
- **方法**: `PUT`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 帖子ID |

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 否 | 帖子标题 (5-50字符) |
| content | string | 否 | 帖子内容 (10-5000字符) |
| images | array | 否 | 图片URL数组 (最多9张) |
| tags | array | 否 | 标签数组 (最多5个) |

#### 请求示例
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容...",
  "images": ["http://example.com/new_image.jpg"],
  "tags": ["更新", "分享"]
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "更新成功"
}
```

### 7.8 删除帖子

#### 请求信息
- **接口**: `/community/posts/{postId}`
- **方法**: `DELETE`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 帖子ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "删除成功"
}
```

### 7.9 获取帖子评论

#### 请求信息
- **接口**: `/community/posts/{postId}/comments`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 帖子ID |

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |
| sort | string | 否 | 排序方式：latest(最新), popular(热门) | latest |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "content": "这是一条评论",
        "images": ["http://example.com/comment_img.jpg"],
        "author": {
          "id": 2,
          "username": "user2",
          "avatar": "http://example.com/avatar2.jpg"
        },
        "like_count": 5,
        "created_at": "2024-01-15T10:30:00.000Z",
        "is_liked": false
      }
      // ... 更多评论
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 7.10 发表评论

#### 请求信息
- **接口**: `/community/posts/{postId}/comments`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 帖子ID |

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | string | 是 | 评论内容 (1-500字符) |
| images | array | 否 | 图片URL数组 (最多3张) |

#### 请求示例
```json
{
  "content": "这是我的评论内容",
  "images": ["http://example.com/comment_image.jpg"]
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "评论成功",
  "data": {
    "id": 16,
    "created_at": "2024-01-16T11:30:00.000Z"
  }
}
```

### 7.11 删除评论

#### 请求信息
- **接口**: `/community/comments/{commentId}`
- **方法**: `DELETE`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| commentId | number | 评论ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "删除成功"
}
```

### 7.12 点赞/取消点赞帖子

#### 请求信息
- **接口**: `/community/posts/{postId}/like`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| postId | number | 帖子ID |

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | string | 是 | 操作：like(点赞)、unlike(取消点赞) |

#### 请求示例
```json
{
  "action": "like"
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "is_liked": true
  }
}
```

### 7.13 点赞/取消点赞评论

#### 请求信息
- **接口**: `/community/comments/{commentId}/like`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| commentId | number | 评论ID |

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | string | 是 | 操作：like(点赞)、unlike(取消点赞) |

#### 请求示例
```json
{
  "action": "like"
}
```

#### 响应示例
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "is_liked": true
  }
}
```

### 7.14 获取用户积分记录

#### 请求信息
- **接口**: `/users/points/records`
- **方法**: `GET`
- **需要认证**: 是

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "points": 10,
        "type": "post_create",
        "description": "发布社区帖子",
        "created_at": "2024-01-15T08:30:00.000Z"
      },
      {
        "id": 2,
        "points": 2,
        "type": "comment_create",
        "description": "发表评论",
        "created_at": "2024-01-15T10:45:00.000Z"
      }
      // ... 更多记录
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 7.15 获取用户主页资料

#### 请求信息
- **接口**: `/users/{userId}/profile`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "user1",
    "avatar": "http://example.com/avatar.jpg",
    "bio": "用户个人简介",
    "points": 235,
    "post_count": 12,
    "comment_count": 48,
    "follower_count": 25,
    "following_count": 30,
    "is_following": false,
    "created_at": "2023-12-01T08:00:00.000Z"
  }
}
```

### 7.16 关注用户

#### 请求信息
- **接口**: `/users/{userId}/follow`
- **方法**: `POST`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 要关注的用户ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "关注成功",
  "data": {
    "is_following": true
  }
}
```

### 7.17 取消关注用户

#### 请求信息
- **接口**: `/users/{userId}/unfollow`
- **方法**: `POST`
- **需要认证**: 是

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 要取消关注的用户ID |

#### 响应示例
```json
{
  "code": 200,
  "message": "已取消关注",
  "data": {
    "is_following": false
  }
}
```

### 7.18 获取用户关注列表

#### 请求信息
- **接口**: `/users/{userId}/following`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 2,
        "username": "user2",
        "avatar": "http://example.com/avatar2.jpg",
        "bio": "用户2的简介",
        "is_following": true,
        "followed_at": "2024-01-10T14:30:00.000Z"
      }
      // ... 更多用户
    ],
    "pagination": {
      "total": 30,
      "page": 1,
      "limit": 10
    }
  }
}
```

### 7.19 获取用户粉丝列表

#### 请求信息
- **接口**: `/users/{userId}/followers`
- **方法**: `GET`
- **需要认证**: 否

#### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| userId | number | 用户ID |

#### 查询参数
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|---------|
| page | number | 否 | 页码 | 1 |
| limit | number | 否 | 每页条数 | 10 |

#### 响应示例
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 3,
        "username": "user3",
        "avatar": "http://example.com/avatar3.jpg",
        "bio": "用户3的简介",
        "is_following": false,
        "followed_at": "2024-01-12T09:15:00.000Z"
      }
      // ... 更多用户
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10
    }
  }
}
```

## 7. AI农业知识助手API

### 7.1 会话管理相关接口

#### 7.1.1 创建新会话

##### 请求信息
- **接口**: `/ai/sessions`
- **方法**: `POST`
- **需要认证**: 是

##### 响应示例
```json
{
  "code": 200,
  "message": "会话创建成功",
  "data": {
    "sessionId": "1_a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"
  }
}
```

#### 7.1.2 获取用户会话列表

##### 请求信息
- **接口**: `/ai/sessions`
- **方法**: `GET`
- **需要认证**: 是

##### 响应示例
```json
{
  "code": 200,
  "message": "获取会话列表成功",
  "data": {
    "sessions": [
      {
        "sessionId": "1_a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
        "createdAt": "2024-04-10T08:30:00.000Z",
        "updatedAt": "2024-04-10T09:15:00.000Z"
      }
    ]
  }
}
```

#### 7.1.3 删除会话

##### 请求信息
- **接口**: `/ai/sessions/:sessionId`
- **方法**: `DELETE`
- **需要认证**: 是

##### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| sessionId | string | 会话ID |

##### 响应示例
```json
{
  "code": 200,
  "message": "会话已删除"
}
```

#### 7.1.4 清空会话消息

##### 请求信息
- **接口**: `/ai/sessions/:sessionId/clear`
- **方法**: `POST`
- **需要认证**: 是

##### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| sessionId | string | 会话ID |

##### 响应示例
```json
{
  "code": 200,
  "message": "会话消息已清空"
}
```

#### 7.1.5 获取会话消息

##### 请求信息
- **接口**: `/ai/sessions/:sessionId/messages`
- **方法**: `GET`
- **需要认证**: 是

##### 路径参数
| 参数名 | 类型 | 说明 |
|--------|------|------|
| sessionId | string | 会话ID |

##### 响应示例
```json
{
  "code": 200,
  "message": "获取会话消息成功",
  "data": {
    "sessionId": "1_a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
    "messages": [
      {
        "role": "user",
        "content": "水稻种植有哪些注意事项？"
      },
      {
        "role": "assistant",
        "content": "水稻种植的主要注意事项包括以下几点：\n\n1. 选择适合的品种：根据当地气候和土壤条件选择适合的水稻品种。\n\n2. 合理整地：确保田地平整，有利于灌溉和排水。\n\n..."
      }
    ]
  }
}
```

### 7.2 获取AI助手回复

#### 请求信息
- **接口**: `/ai/chat`
- **方法**: `POST`
- **需要认证**: 是
- **Content-Type**: `application/json`

#### 请求参数
| 参数名   | 类型   | 必填 | 说明                                      |
|----------|--------|------|------------------------------------------|
| messages | array  | 是   | 消息列表，包含角色和内容                  |
| sessionId | string | 否   | 会话ID，不提供则创建新会话               |

每条消息的格式：
```json
{
  "role": "user",
  "content": "问题内容"
}
```

其中`role`字段可以是以下值：
- `user`：用户消息
- `assistant`：AI助手回复消息
- `system`：系统指令（通常不需要手动添加，系统会自动添加农业知识助手的角色设定）

#### 备注
1. 系统会自动为每次对话添加农业知识助手的角色设定提示，无需用户手动添加
2. 当提供sessionId时，服务器会从Redis获取历史对话，只需在messages中提供最新一条用户消息
3. 当未提供sessionId时，会创建新会话并返回sessionId
4. 服务器会自动管理会话消息数量，超出限制时会自动清理最早的消息（保留系统提示）
5. **重要**: 系统使用`req.userData.userId`获取用户ID，JWT令牌中应包含`userId`字段作为用户标识符
6. 会话ID的格式为`{userId}_{uuid}`，前端可通过此格式识别会话所属用户

#### 请求示例（无会话ID，创建新会话）
```json
{
  "messages": [
    {
      "role": "user",
      "content": "水稻常见的病虫害有哪些？如何防治？"
    }
  ]
}
```

#### 请求示例（有会话ID，使用已有会话）
```json
{
  "sessionId": "1_a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "messages": [
    {
      "role": "user",
      "content": "谢谢，那么播种时间和密度应该如何把握？"
    }
  ]
}
```

#### 特殊请求
如果使用GET方法，可以通过EventSource API进行流式获取AI回复：

```javascript
// 示例：使用EventSource接收流式回复
const messages = [
  { role: "user", content: "水稻常见的病虫害有哪些？" }
];
const token = "您的JWT令牌"; // 令牌中应包含userId字段作为用户标识
const sessionId = "1_a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6"; // 可选
const encodedMessages = encodeURIComponent(JSON.stringify(messages));
let url = `/api/ai/chat/stream?messages=${encodedMessages}&token=${token}`;

// 如果有会话ID，添加到URL
if (sessionId) {
  url += `&sessionId=${sessionId}`;
}

const eventSource = new EventSource(url);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'start') {
    // 开始回复，获取会话ID
    console.log('开始回复，会话ID:', data.sessionId);
  } else if (data.type === 'update') {
    // 增量更新内容
    console.log('收到内容片段:', data.content);
    // 累积的完整内容
    console.log('当前完整内容:', data.fullContent);
  } else if (data.type === 'end') {
    // 回复结束
    console.log('回复结束，完整内容:', data.fullContent);
    eventSource.close();
  } else if (data.type === 'error') {
    // 发生错误
    console.error('错误:', data.error);
    eventSource.close();
  }
};

eventSource.onerror = (error) => {
  console.error('EventSource错误:', error);
  eventSource.close();
};
```
