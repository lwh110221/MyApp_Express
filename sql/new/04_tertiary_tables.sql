-- 三级依赖的表
-- 这些表依赖于03_secondary_tables.sql中创建的表

-- 购物车项表
CREATE TABLE `cart_items` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '购物车项ID',
  `cart_id` BIGINT NOT NULL COMMENT '购物车ID',
  `product_id` BIGINT NOT NULL COMMENT '产品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `selected` TINYINT DEFAULT 1 COMMENT '是否选中：0-未选中，1-已选中',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  UNIQUE INDEX `idx_cart_product` (`cart_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车项表';

-- 订单项表
CREATE TABLE `order_items` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单项ID',
  `order_id` BIGINT NOT NULL COMMENT '订单ID',
  `product_id` BIGINT NOT NULL COMMENT '产品ID',
  `product_title` VARCHAR(100) NOT NULL COMMENT '产品名称（冗余存储，防止产品修改）',
  `product_image` VARCHAR(255) COMMENT '产品图片',
  `price` DECIMAL(10,2) NOT NULL COMMENT '购买单价',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '总金额',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  INDEX `idx_order` (`order_id`),
  INDEX `idx_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单项表';

-- 聊天消息表
CREATE TABLE `chat_messages` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
  `session_id` BIGINT NOT NULL COMMENT '会话ID',
  `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
  `receiver_id` BIGINT NOT NULL COMMENT '接收者ID',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
  `content_type` TINYINT DEFAULT 0 COMMENT '内容类型：0-文本，1-图片，2-语音，3-视频，4-文件',
  `media_url` VARCHAR(255) COMMENT '媒体文件URL',
  `send_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `read_time` TIMESTAMP NULL COMMENT '已读时间',
  FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_session` (`session_id`),
  INDEX `idx_sender_receiver` (`sender_id`, `receiver_id`),
  INDEX `idx_send_time` (`send_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息表';

-- 未读消息统计表
CREATE TABLE `chat_unread_counts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `session_id` BIGINT NOT NULL COMMENT '会话ID',
  `unread_count` INT DEFAULT 0 COMMENT '未读消息数量',
  `last_read_time` TIMESTAMP NULL COMMENT '上次阅读时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON DELETE CASCADE,
  UNIQUE INDEX `uk_user_session` (`user_id`, `session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='未读消息统计表'; 