# 聊天功能API文档

## 1. 概述

本文档详细说明了聊天功能的API接口，包括获取会话列表、发送消息、获取聊天记录等功能。这些接口遵循RESTful规范，使用JWT进行身份验证。

## 2. 基础URL

```
http://localhost:3000/api
```

## 3. 认证

所有聊天相关接口都需要用户登录并提供JWT令牌。在请求头中添加：

```
Authorization: Bearer <token>
```

## 4. 接口列表

### 4.1 获取聊天会话列表

#### 请求

```
GET /chat/sessions
```

#### 请求头

| 参数名        | 必填 | 说明         |
| ------------- | ---- | ------------ |
| Authorization | 是   | Bearer Token |

#### 返回示例

```json
{
  "code": 200,
  "message": "获取聊天会话列表成功",
  "data": [
    {
      "sessionId": 1,
      "partnerId": 2,
      "partnerName": "张三",
      "partnerAvatar": "/uploads/avatars/avatar-123.jpeg",
      "lastMessage": "明天见",
      "lastTime": "2025-03-31T07:35:51.000Z",
      "unreadCount": 2
    }
  ]
}
```

### 4.2 获取与特定用户的聊天历史

#### 请求

```
GET /chat/history/:partnerId
```

#### 请求参数

| 参数名    | 类型  | 必填 | 说明             |
| --------- | ----- | ---- | ---------------- |
| partnerId | path  | 是   | 对话伙伴的用户ID |
| page      | query | 否   | 页码，默认1      |
| limit     | query | 否   | 每页条数，默认20 |

#### 返回示例

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 5,
        "session_id": 3,
        "sender_id": 1,
        "receiver_id": 2,
        "content": "收到了，这是回复消息",
        "is_read": 1,
        "content_type": 0,
        "media_url": null,
        "send_time": "2025-03-31T07:35:51.000Z",
        "read_time": "2025-03-31T07:36:38.000Z",
        "sender_name": "testuser1",
        "sender_avatar": null
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "pageSize": 20
    }
  },
  "message": "获取成功"
}
```

### 4.3 发送消息

#### 请求

```
POST /chat/message
```

#### 请求头

| 参数名        | 必填 | 说明             |
| ------------- | ---- | ---------------- |
| Authorization | 是   | Bearer Token     |
| Content-Type  | 是   | application/json |

#### 请求体

```json
{
  "receiverId": 2,
  "content": "你好，这是一条消息",
  "contentType": 0,
  "mediaUrl": null
}
```

| 参数名      | 类型   | 必填 | 说明                                    |
| ----------- | ------ | ---- | --------------------------------------- |
| receiverId  | number | 是   | 接收者ID                                |
| content     | string | 是   | 消息内容                                |
| contentType | number | 否   | 消息类型：0-文本(默认)，1-图片          |
| mediaUrl    | string | 否   | 媒体文件URL，仅当contentType不为0时需要 |

#### 返回示例

```json
{
  "code": 200,
  "message": "消息发送成功",
  "data": {
    "id": 6,
    "session_id": 3,
    "sender_id": 2,
    "receiver_id": 1,
    "content": "你好，这是一条消息",
    "is_read": 0,
    "content_type": 0,
    "media_url": null,
    "send_time": "2025-03-31T07:40:12.000Z",
    "read_time": null,
    "sender_name": "test",
    "sender_avatar": "/uploads/avatars/avatar-1742800436869-710857436.jpeg"
  }
}
```

### 4.4 上传聊天图片

#### 请求

```
POST /chat/upload/image
```

#### 请求头

| 参数名        | 必填 | 说明                |
| ------------- | ---- | ------------------- |
| Authorization | 是   | Bearer Token        |
| Content-Type  | 是   | multipart/form-data |

#### 请求体

FormData格式，包含以下字段：

| 参数名 | 类型 | 必填 | 说明                                        |
| ------ | ---- | ---- | ------------------------------------------- |
| image  | file | 是   | 图片文件，支持jpg、jpeg、png、gif等常见格式 |

#### 返回示例

```json
{
  "code": 200,
  "message": "图片上传成功",
  "data": {
    "url": "/uploads/chat/chat-1648193285432-123456789.jpg"
  }
}
```

### 4.5 标记会话消息为已读

#### 请求

```
PUT /chat/sessions/:sessionId/read
```

#### 请求参数

| 参数名    | 类型 | 必填 | 说明   |
| --------- | ---- | ---- | ------ |
| sessionId | path | 是   | 会话ID |

#### 返回示例

```json
{
  "code": 200,
  "message": "消息已标记为已读"
}
```

### 4.6 获取未读消息数量

#### 请求

```
GET /chat/unread
```

#### 返回示例

```json
{
  "code": 200,
  "message": "获取未读消息数量成功",
  "data": {
    "total": 5,
    "sessions": [
      {
        "sessionId": 1,
        "unreadCount": 3
      },
      {
        "sessionId": 2,
        "unreadCount": 2
      }
    ]
  }
}
```

### 4.7 删除会话

#### 请求

```
DELETE /chat/sessions/:sessionId
```

#### 请求参数

| 参数名    | 类型 | 必填 | 说明   |
| --------- | ---- | ---- | ------ |
| sessionId | path | 是   | 会话ID |

#### 返回示例

```json
{
  "code": 200,
  "message": "聊天会话已删除"
}
```

### 4.8 搜索聊天记录

#### 请求

```
GET /chat/search
```

#### 请求参数

| 参数名  | 类型  | 必填 | 说明             |
| ------- | ----- | ---- | ---------------- |
| keyword | query | 是   | 搜索关键词       |
| page    | query | 否   | 页码，默认1      |
| limit   | query | 否   | 每页条数，默认20 |

#### 返回示例

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 4,
        "session_id": 3,
        "sender_id": 2,
        "receiver_id": 1,
        "content": "你好，这是测试消息",
        "is_read": 1,
        "content_type": 0,
        "media_url": null,
        "send_time": "2025-03-31T07:35:42.000Z",
        "read_time": "2025-03-31T07:36:38.000Z",
        "sender_name": "test",
        "sender_avatar": "/uploads/avatars/avatar-1742800436869-710857436.jpeg",
        "user1_id": 1,
        "user2_id": 2
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "pageSize": 10
    }
  },
  "message": "获取成功"
}
```

## 5. WebSocket通信

### 5.1 连接WebSocket服务器

前端需要连接WebSocket服务器来实现实时通信：

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 5.2 WebSocket事件

#### 接收新消息

```javascript
socket.on('new_message', (message) => {
  console.log('收到新消息:', message);
});
```

接收到的消息格式：

```json
{
  "id": 7,
  "session_id": 3,
  "sender_id": 1,
  "receiver_id": 2,
  "content": "实时消息",
  "is_read": 0,
  "content_type": 0,
  "media_url": null,
  "send_time": "2025-03-31T07:45:20.000Z",
  "read_time": null,
  "sender_name": "testuser1",
  "sender_avatar": null,
  "sessionId": 3
}
```

#### 消息已读通知

```javascript
socket.on('message_read', (data) => {
  console.log('消息已读通知:', data);
});
```

接收到的消息格式：

```json
{
  "sessionId": 3
}
```

## 6. 状态码说明

| 状态码 | 说明             |
| ------ | ---------------- |
| 200    | 请求成功         |
| 400    | 请求参数错误     |
| 401    | 未授权/token无效 |
| 404    | 资源不存在       |
| 500    | 服务器内部错误   |

## 7. 前端接入指南

### 7.1 聊天功能流程

1. 用户登录后获取JWT令牌
2. 连接WebSocket服务
3. 获取聊天会话列表
4. 点击会话查看聊天历史
5. 发送消息（文本或图片）
6. 监听实时消息

### 7.2 图片消息处理

1. 上传图片获取URL
2. 使用获取的URL发送图片消息（contentType=1）

### 7.3 会话管理

1. 定期获取未读消息数量更新UI
2. 进入会话自动将消息标记为已读
3. 长期未使用的会话可以提供删除功能

### 7.4 安全性考虑

1. 所有请求都需要包含有效的JWT令牌
2. 用户只能访问自己参与的会话
3. WebSocket连接也需要认证