-- 农产品类别表
CREATE TABLE `product_categories` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '类别ID',
  `name` VARCHAR(50) NOT NULL COMMENT '类别名称',
  `description` VARCHAR(200) COMMENT '类别描述',
  `icon` VARCHAR(255) COMMENT '类别图标',
  `parent_id` BIGINT DEFAULT NULL COMMENT '父类别ID，用于多级分类',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`parent_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='农产品类别表';

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
  `completion_time` TIMESTAMP NULL COMMENT '完成时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  UNIQUE INDEX `idx_order_no` (`order_no`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

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

-- 初始化农产品类别数据
INSERT INTO `product_categories` (`name`, `description`, `icon`, `sort_order`) VALUES
('蔬菜', '新鲜蔬菜', '/icons/vegetables.png', 1),
('水果', '时令水果', '/icons/fruits.png', 2),
('干果', '各类干果', '/icons/nuts.png', 3),
('特产', '地方特产', '/icons/specialty.png', 4),
('粮油', '粮食作物和油类', '/icons/grains.png', 5),
('草药', '中草药材', '/icons/herbs.png', 6); 