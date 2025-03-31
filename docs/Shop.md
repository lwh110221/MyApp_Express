# 农产品交易模块API文档

## 目录

- [产品管理](#产品管理)
- [购物车管理](#购物车管理)
- [订单管理](#订单管理)

## 产品管理

### 获取产品分类列表

获取所有可用的产品分类。

- **URL**: `/api/products/categories`
- **Method**: `GET`
- **需要认证**: 否

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "蔬菜",
      "description": "新鲜蔬菜",
      "icon": "/uploads/icons/vegetable.png",
      "parent_id": null
    },
    {
      "id": 2,
      "name": "水果",
      "description": "时令水果",
      "icon": "/uploads/icons/fruit.png",
      "parent_id": null
    }
  ],
  "message": "操作成功"
}
```

### 获取产品列表

获取产品列表，支持分页、排序和筛选。

- **URL**: `/api/products`
- **Method**: `GET`
- **需要认证**: 否

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | Number | 否 | 页码，默认为1 |
| limit | Number | 否 | 每页数量，默认为10 |
| category_id | Number | 否 | 分类ID |
| keyword | String | 否 | 搜索关键词 |
| min_price | Number | 否 | 最低价格 |
| max_price | Number | 否 | 最高价格 |
| sort_by | String | 否 | 排序字段，可选值：created_at, price, view_count, sales_count |
| sort_order | String | 否 | 排序方式，可选值：asc, desc |

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "有机蔬菜",
        "description": "新鲜无污染蔬菜",
        "price": 29.9,
        "original_price": 39.9,
        "stock": 100,
        "unit": "斤",
        "location": "山东省",
        "images": ["/uploads/products/veggie1.jpg", "/uploads/products/veggie2.jpg"],
        "status": 1,
        "is_featured": 1,
        "view_count": 120,
        "sales_count": 30,
        "is_bulk": 0,
        "min_order_quantity": 1,
        "created_at": "2023-05-01T10:00:00Z",
        "category_name": "蔬菜",
        "username": "农户小李"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  },
  "message": "操作成功"
}
```

### 获取推荐产品

获取推荐的特色产品。

- **URL**: `/api/products/featured`
- **Method**: `GET`
- **需要认证**: 否

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| limit | Number | 否 | 返回数量，默认为6 |

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "title": "有机蔬菜",
      "price": 29.9,
      "original_price": 39.9,
      "images": ["/uploads/products/veggie1.jpg"],
      "stock": 100,
      "unit": "斤",
      "sales_count": 30
    }
  ],
  "message": "操作成功"
}
```

### 获取产品详情

获取单个产品的详细信息。

- **URL**: `/api/products/:id`
- **Method**: `GET`
- **需要认证**: 否

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "有机蔬菜",
    "description": "新鲜无污染蔬菜",
    "price": 29.9,
    "original_price": 39.9,
    "stock": 100,
    "unit": "斤",
    "location": "山东省",
    "images": ["/uploads/products/veggie1.jpg", "/uploads/products/veggie2.jpg"],
    "status": 1,
    "is_featured": 1,
    "view_count": 121,
    "sales_count": 30,
    "is_bulk": 0,
    "min_order_quantity": 1,
    "created_at": "2023-05-01T10:00:00Z",
    "category_id": 1,
    "category_name": "蔬菜",
    "username": "农户小李",
    "user_id": 10,
    "profile_picture": "/uploads/avatars/user10.jpg",
    "attributes": {
      "产地": "山东省",
      "保存方式": "冷藏"
    },
    "related": [
      {
        "id": 2,
        "title": "新鲜水果",
        "price": 39.9,
        "images": ["/uploads/products/fruit1.jpg"],
        "stock": 50,
        "unit": "箱"
      }
    ]
  },
  "message": "操作成功"
}
```

### 发布新产品

发布新的农产品。

- **URL**: `/api/products`
- **Method**: `POST`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| title | String | 是 | 产品标题 |
| description | String | 是 | 产品描述 |
| price | Number | 是 | 价格 |
| original_price | Number | 否 | 原价 |
| stock | Number | 否 | 库存数量 |
| unit | String | 是 | 计量单位 |
| category_id | Number | 是 | 分类ID |
| location | String | 否 | 产地 |
| attributes | Object/String | 否 | 产品属性，JSON格式 |
| is_bulk | Boolean | 否 | 是否批量订购 |
| min_order_quantity | Number | 否 | 最低起订数量 |
| images | File[] | 否 | 产品图片，最多5张 |

**响应示例**:

```json
{
  "success": true,
  "message": "产品发布成功",
  "product": {
    "id": 5,
    "title": "有机草莓",
    "description": "自然生长，无农药",
    "price": 45.8,
    "original_price": 56.0,
    "stock": 80,
    "unit": "盒",
    "category_id": 2,
    "category_name": "水果",
    "location": "云南省",
    "images": ["/uploads/products/strawberry1.jpg", "/uploads/products/strawberry2.jpg"],
    "username": "农户小王"
  }
}
```

### 更新产品

更新已存在的产品信息。

- **URL**: `/api/products/:id`
- **Method**: `PUT`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| title | String | 是 | 产品标题 |
| description | String | 是 | 产品描述 |
| price | Number | 是 | 价格 |
| original_price | Number | 否 | 原价 |
| stock | Number | 否 | 库存数量 |
| unit | String | 是 | 计量单位 |
| category_id | Number | 是 | 分类ID |
| location | String | 否 | 产地 |
| attributes | Object/String | 否 | 产品属性，JSON格式 |
| is_bulk | Boolean | 否 | 是否批量订购 |
| min_order_quantity | Number | 否 | 最低起订数量 |
| keepImages | String | 否 | 保留的图片URL数组，JSON格式 |
| images | File[] | 否 | 新增产品图片，最多5张 |

**响应示例**:

```json
{
  "success": true,
  "message": "产品更新成功",
  "product": {
    "id": 5,
    "title": "有机草莓",
    "description": "自然生长，无农药，新鲜采摘",
    "price": 49.8,
    "original_price": 56.0,
    "stock": 75,
    "unit": "盒",
    "category_id": 2,
    "category_name": "水果",
    "location": "云南省",
    "images": ["/uploads/products/strawberry1.jpg", "/uploads/products/strawberry3.jpg"]
  }
}
```

### 更新产品状态

上架或下架产品。

- **URL**: `/api/products/:id/status`
- **Method**: `PUT`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| status | Number | 是 | 产品状态：0(下架)或1(上架) |

**响应示例**:

```json
{
  "success": true,
  "message": "产品已上架"
}
```

### 删除产品

删除(下架)产品。

- **URL**: `/api/products/:id`
- **Method**: `DELETE`
- **需要认证**: 是

**响应示例**:

```json
{
  "success": true,
  "message": "产品已下架"
}
```

### 获取用户的产品列表

获取当前用户发布的产品列表。

- **URL**: `/api/products/user`
- **Method**: `GET`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | Number | 否 | 页码，默认为1 |
| limit | Number | 否 | 每页数量，默认为10 |

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 5,
        "title": "有机草莓",
        "description": "自然生长，无农药",
        "price": 49.8,
        "original_price": 56.0,
        "stock": 75,
        "unit": "盒",
        "location": "云南省",
        "images": ["/uploads/products/strawberry1.jpg"],
        "status": 1,
        "view_count": 68,
        "sales_count": 15,
        "created_at": "2023-05-01T10:00:00Z",
        "category_name": "水果"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10
  },
  "message": "操作成功"
}
```

## 购物车管理

### 获取购物车

获取当前用户的购物车信息。

- **URL**: `/api/cart`
- **Method**: `GET`
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "cart_id": 10,
    "items": [
      {
        "id": 25,
        "product_id": 5,
        "quantity": 2,
        "selected": 1,
        "name": "有机草莓",
        "price": 49.8,
        "original_price": 56.0,
        "stock": 75,
        "unit": "盒",
        "seller_name": "农户小王",
        "location": "云南省",
        "product_image": "/uploads/products/strawberry1.jpg",
        "total_price": "99.60"
      }
    ],
    "total": "99.60",
    "item_count": 1
  },
  "message": "操作成功"
}
```

### 添加商品到购物车

添加商品到购物车。

- **URL**: `/api/cart/items`
- **Method**: `POST`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| product_id | Number | 是 | 产品ID |
| quantity | Number | 否 | 数量，默认为1 |

**响应示例**:

```json
{
  "success": true,
  "message": "商品已添加到购物车"
}
```

### 更新购物车商品数量

更新购物车中商品的数量。

- **URL**: `/api/cart/items/:itemId`
- **Method**: `PUT`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| quantity | Number | 是 | 新的数量，必须大于0 |

**响应示例**:

```json
{
  "success": true,
  "message": "购物车商品已更新"
}
```

### 删除购物车商品

从购物车中删除商品。

- **URL**: `/api/cart/items/:itemId`
- **Method**: `DELETE`
- **需要认证**: 是

**响应示例**:

```json
{
  "success": true,
  "message": "商品已从购物车移除"
}
```

### 更新购物车商品选中状态

更新购物车中商品的选中状态。

- **URL**: `/api/cart/selected`
- **Method**: `PUT`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| selected | Boolean | 是 | 选中状态 |
| items | Number[] | 否 | 商品ID数组，不提供则更新所有商品 |

**响应示例**:

```json
{
  "success": true,
  "message": "购物车商品选中状态已更新"
}
```

### 清空购物车

清空当前用户的购物车。

- **URL**: `/api/cart`
- **Method**: `DELETE`
- **需要认证**: 是

**响应示例**:

```json
{
  "success": true,
  "message": "购物车已清空"
}
```

## 订单管理

### 创建订单

创建新订单。

- **URL**: `/api/orders`
- **Method**: `POST`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| contact_name | String | 是 | 联系人姓名 |
| contact_phone | String | 是 | 联系电话 |
| address | String | 是 | 收货地址 |
| note | String | 否 | 订单备注 |
| cart_items | Number[] | 是 | 购物车商品ID数组 |

**响应示例**:

```json
{
  "success": true,
  "message": "订单创建成功",
  "order": {
    "id": 100,
    "order_no": "O20230610123456789",
    "total_amount": 99.60
  }
}
```

### 获取订单列表

获取当前用户的订单列表。

- **URL**: `/api/orders`
- **Method**: `GET`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | Number | 否 | 页码，默认为1 |
| limit | Number | 否 | 每页数量，默认为10 |
| status | Number | 否 | 订单状态：0(待付款)、1(待发货)、2(已发货)、3(已完成)、4(已取消)、5(已退款) |

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "orders": [
      {
        "id": 100,
        "order_no": "O20230610123456789",
        "total_amount": 99.60,
        "status": 0,
        "status_text": "待付款",
        "contact_name": "张三",
        "contact_phone": "13800138000",
        "address": "北京市海淀区",
        "payment_method": null,
        "payment_time": null,
        "created_at": "2023-06-10T12:34:56Z",
        "shipping_time": null,
        "completion_time": null,
        "items": [
          {
            "id": 150,
            "product_id": 5,
            "product_title": "有机草莓",
            "product_image": "/uploads/products/strawberry1.jpg",
            "price": 49.8,
            "quantity": 2,
            "total_amount": 99.60
          }
        ]
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "message": "获取订单列表成功"
}
```

### 获取订单详情

获取单个订单的详细信息。

- **URL**: `/api/orders/:orderId`
- **Method**: `GET`
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "id": 100,
    "order_no": "O20230610123456789",
    "total_amount": 99.60,
    "status": 0,
    "status_text": "待付款",
    "contact_name": "张三",
    "contact_phone": "13800138000",
    "address": "北京市海淀区",
    "note": "请尽快发货",
    "payment_method": null,
    "payment_time": null,
    "shipping_time": null,
    "completion_time": null,
    "created_at": "2023-06-10T12:34:56Z",
    "updated_at": "2023-06-10T12:34:56Z",
    "items": [
      {
        "id": 150,
        "product_id": 5,
        "product_title": "有机草莓",
        "product_image": "/uploads/products/strawberry1.jpg",
        "price": 49.8,
        "quantity": 2,
        "total_amount": 99.60
      }
    ]
  },
  "message": "操作成功"
}
```

### 取消订单

取消待付款的订单。

- **URL**: `/api/orders/:orderId/cancel`
- **Method**: `PUT`
- **需要认证**: 是

**响应示例**:

```json
{
  "success": true,
  "message": "订单已取消"
}
```

### 确认收货

确认已发货订单的收货。

- **URL**: `/api/orders/:orderId/confirm`
- **Method**: `PUT`
- **需要认证**: 是

**响应示例**:

```json
{
  "success": true,
  "message": "订单已完成"
}
```

### 支付订单

支付待付款订单。

- **URL**: `/api/orders/:orderId/pay`
- **Method**: `PUT`
- **需要认证**: 是

**请求参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| payment_method | Number | 是 | 支付方式：1(微信)、2(支付宝)、3(银行卡) |

**响应示例**:

```json
{
  "success": true,
  "message": "订单支付成功"
}
```

### 获取订单统计

获取当前用户的订单统计信息。

- **URL**: `/api/orders/stats`
- **Method**: `GET`
- **需要认证**: 是

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "pending_payment": 2,
    "pending_shipment": 1,
    "pending_receipt": 0,
    "completed": 5,
    "cancelled": 1,
    "total": 9
  },
  "message": "操作成功"
}
```
