-- 二级依赖的表
-- 这些表依赖于02_relation_tables.sql中创建的表

-- 动态图片表
CREATE TABLE `moment_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '图片唯一标识',
    `moment_id` BIGINT NOT NULL COMMENT '关联的动态ID',
    `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (`moment_id`) REFERENCES `user_moments`(`id`) ON DELETE CASCADE,
    INDEX `idx_moment_id` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='动态图片表';

-- 专家回答表
CREATE TABLE `help_answers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '回答ID',
    `post_id` BIGINT NOT NULL COMMENT '帖子ID',
    `expert_id` BIGINT NOT NULL COMMENT '专家用户ID',
    `content` TEXT NOT NULL COMMENT '回答内容',
    `images` JSON COMMENT '图片列表',
    `is_accepted` TINYINT DEFAULT 0 COMMENT '是否被采纳：0-否，1-是',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`post_id`) REFERENCES `help_posts`(`id`),
    FOREIGN KEY (`expert_id`) REFERENCES `users`(`id`),
    INDEX `idx_post_expert` (`post_id`, `expert_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专家回答表';

-- 社区帖子评论表
CREATE TABLE IF NOT EXISTS `community_comments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
    `post_id` BIGINT NOT NULL COMMENT '帖子ID',
    `user_id` BIGINT NOT NULL COMMENT '评论用户ID',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `parent_id` BIGINT DEFAULT NULL COMMENT '父评论ID，用于回复其他评论',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`parent_id`) REFERENCES `community_comments`(`id`) ON DELETE SET NULL,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区评论表';

-- 帖子-标签关联表
CREATE TABLE IF NOT EXISTS `community_post_tags` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
    `post_id` BIGINT NOT NULL COMMENT '帖子ID',
    `tag_id` BIGINT NOT NULL COMMENT '标签ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`tag_id`) REFERENCES `community_tags`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_post_tag` (`post_id`, `tag_id`),
    INDEX `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子-标签关联表';

-- 农产品表
CREATE TABLE `products` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '产品ID',
  `user_id` BIGINT NOT NULL COMMENT '发布用户ID（农户）',
  `category_id` BIGINT NOT NULL COMMENT '产品类别ID',
  `title` VARCHAR(100) NOT NULL COMMENT '产品名称',
  `description` TEXT NOT NULL COMMENT '产品描述',
  `price` DECIMAL(10,2) NOT NULL COMMENT '产品价格',
  `original_price` DECIMAL(10,2) COMMENT '原价',
  `stock` INT DEFAULT 0 COMMENT '库存数量',
  `unit` VARCHAR(20) NOT NULL COMMENT '计量单位（如：公斤、袋、箱）',
  `location` VARCHAR(100) COMMENT '产地',
  `images` JSON COMMENT '产品图片列表',
  `attributes` JSON COMMENT '产品属性（如：品种、等级、保质期等）',
  `is_bulk` TINYINT DEFAULT 0 COMMENT '是否批量订购：0-否，1-是',
  `min_order_quantity` INT DEFAULT 1 COMMENT '最低起订数量',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-下架，1-上架',
  `is_featured` TINYINT DEFAULT 0 COMMENT '是否推荐：0-否，1-是',
  `view_count` INT DEFAULT 0 COMMENT '浏览次数',
  `sales_count` INT DEFAULT 0 COMMENT '销售数量',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_category` (`category_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_featured` (`is_featured`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='农产品信息表';

-- 购物车表
CREATE TABLE `carts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '购物车ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  UNIQUE INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- 订单表
CREATE TABLE `orders` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL COMMENT '订单编号',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
  `status` TINYINT DEFAULT 0 COMMENT '订单状态：0-待付款，1-已付款待发货，2-已发货，3-已完成，4-已取消，5-已退款',
  `contact_name` VARCHAR(50) NOT NULL COMMENT '联系人姓名',
  `contact_phone` VARCHAR(20) NOT NULL COMMENT '联系人电话',
  `address` VARCHAR(255) NOT NULL COMMENT '收货地址',
  `note` VARCHAR(255) COMMENT '订单备注',
  `payment_method` TINYINT COMMENT '支付方式：1-微信，2-支付宝，3-银行卡',
  `payment_time` TIMESTAMP NULL COMMENT '支付时间',
  `shipping_time` TIMESTAMP NULL COMMENT '发货时间',
  `tracking_number` VARCHAR(50) NULL COMMENT '物流单号',
  `shipping_company` VARCHAR(50) NULL COMMENT '物流公司',
  `completion_time` TIMESTAMP NULL COMMENT '完成时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  UNIQUE INDEX `idx_order_no` (`order_no`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 聊天会话表
CREATE TABLE `chat_sessions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
  `user1_id` BIGINT NOT NULL COMMENT '用户1 ID',
  `user2_id` BIGINT NOT NULL COMMENT '用户2 ID',
  `last_message` VARCHAR(255) COMMENT '最后一条消息内容',
  `last_time` TIMESTAMP NULL COMMENT '最后消息时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user1_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user2_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_users` (`user1_id`, `user2_id`),
  UNIQUE INDEX `uk_session` (`user1_id`, `user2_id`),
  INDEX `idx_last_time` (`last_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天会话表'; 