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
