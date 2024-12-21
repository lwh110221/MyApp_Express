# API 文档

## 基础信息

- 基础URL: `http://127.0.0.1:3000/api`
- 所有需要认证的接口都需要在请求头中携带 `Authorization: Bearer <token>`
- 所有响应格式均为 JSON
- 默认错误响应格式：
  ```json
  {
    "success": false,
    "message": "错误信息"
  }
  ```

## 1. 用户管理

### 1.1 用户注册

- **接口**: `/users/register`
- **方法**: `POST`
- **描述**: 新用户注册
- **需要验证码**: 是
- **请求体**:
  ```json
  {
    "username": "用户名", // 必填，字符串，唯一
    "email": "邮箱", // 必填，字符串，唯一
    "password": "密码", // 必填，字符串
    "captcha": "验证码" // 必填，字符串
  }
  ```
- **响应**: 
  ```json
  {
    "message": "注册成功"
  }
  ```
- **错误响应示例**:
  ```json
  {
    "success": false,
    "message": "用户名或邮箱已存在"
  }
  ```

### 1.2 用户登录

- **接口**: `/users/login`
- **方法**: `POST`
- **描述**: 用户登录获取token
- **请求体**:
  ```json
  {
    "username": "用户名", // 必填，字符串
    "password": "密码" // 必填，字符串
  }
  ```
- **响应**: 
  ```json
  {
    "token": "JWT令牌",
    "username": "用户名",
    "email": "邮箱"
  }
  ```
- **错误响应示例**:
  ```json
  {
    "success": false,
    "message": "用户名或密码错误"
  }
  ```

### 1.3 获取用户信息

- **接口**: `/users/profile`
- **方法**: `GET`
- **描述**: 获取当前登录用户信息
- **需要认证**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **响应**: 
  ```json
  {
    "id": "用户ID",
    "username": "用户名",
    "email": "邮箱",
    "points": "积分",
    "created_at": "注册时间",
    "bio": "个人简介",
    "profile_picture": "头像URL"
  }
  ```
- **错误响应示例**:
  ```json
  {
    "success": false,
    "message": "认证失败"
  }
  ```

### 1.4 更新用户信息

- **接口**: `/users/profile`
- **方法**: `PUT`
- **描述**: 更新用户个人资料
- **需要认证**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "bio": "个人简介" // 可选，字符串
  }
  ```
- **响应**: 
  ```json
  {
    "message": "个人资料更新成功"
  }
  ```

### 1.5 更新用户头像

- **接口**: `/users/profile/avatar`
- **方法**: `PUT`
- **描述**: 更新用户头像
- **需要认证**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **请求体**: `multipart/form-data`
  - `avatar`: 图片文件（最大5MB）
- **响应**: 
  ```json
  {
    "message": "头像更新成功",
    "avatarUrl": "头像URL"
  }
  ```

### 1.6 修改密码

- **接口**: `/users/password`
- **方法**: `PUT`
- **描述**: 修改用户密码
- **需要认证**: 是
- **需要验证码**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "oldPassword": "原密码", // 必填，字符串
    "newPassword": "新密码", // 必填，字符串
    "captcha": "验证码" // 必填，字符串
  }
  ```
- **响应**: 
  ```json
  {
    "message": "密码修改成功"
  }
  ```

### 1.7 获取用户积分

- **接口**: `/users/points`
- **方法**: `GET`
- **描述**: 获取用户当前积分
- **需要认证**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **响应**: 
  ```json
  {
    "points": 100
  }
  ```

## 2. 动态管理

### 2.1 发布动态

- **接口**: `/moments`
- **方法**: `POST`
- **描述**: 发布新动态
- **需要认证**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **请求体**: `multipart/form-data`
  - `content`: 动态内容 // 必填，字符串
  - `images`: 图片文件（最多9张，每张最大5MB）
- **响应**: 
  ```json
  {
    "success": true,
    "message": "动态发布成功",
    "moment": {
      "id": "动态ID",
      "content": "动态内容",
      "created_at": "创建时间",
      "username": "发布者用户名",
      "user_id": "发布者ID",
      "profile_picture": "发布者头像",
      "images": ["图片URL数组"]
    }
  }
  ```

### 2.2 获取用户动态列表

- **接口**: `/moments/user/:userId?`
- **方法**: `GET`
- **描述**: 获取指定用户的动态列表，不传userId则获取当前用户的动态
- **需要认证**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页条数（默认10）
- **响应**: 
  ```json
  [
    {
      "id": "动态ID",
      "content": "动态内容",
      "created_at": "创建时间",
      "username": "发布者用户名",
      "user_id": "发布者ID",
      "profile_picture": "发布者头像",
      "images": ["图片URL数组"]
    }
  ]
  ```

### 2.3 删除动态

- **接口**: `/moments/:momentId`
- **方法**: `DELETE`
- **描述**: 删除指定动态
- **需要认证**: 是
- **请求头**:
  - `Authorization: Bearer <token>`
- **响应**: 
  ```json
  {
    "message": "动态已删除"
  }
  ```

## 3. 验证码

### 3.1 生成验证码

- **接口**: `/captcha/generate`
- **方法**: `GET`
- **描述**: 生成SVG格式的验证码
- **响应**: SVG图片

## 4. 安全限制

### 4.1 请求限制
- 每个IP 15分钟内最多允许100个请求
- 超出限制将返回 429 状态码

### 4.2 文件上传限制
- 仅支持图片文件格式
- 单个文件最大 5MB
- 动态图片最多 9 张
- 头像存储路径: `/uploads/avatars`
- 动态图片存储路径: `/uploads/moments`

### 4.3 CORS 配置
- 仅允许配置的域名进行跨域请求
- 支持的请求方法: GET, POST, PUT, DELETE, OPTIONS
- 允许的请求头: Content-Type, Authorization

## 5. 错误码说明

- 200: 请求成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证或认证失败
- 403: 无权限
- 404: 资源不存在
- 429: 请求过于频繁
- 500: 服务器内部错误 