-- 项目mysql初步设计数据库
-- 创建用户表
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户唯一标识，自增长主键',
    `username` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户名，具有唯一性，不能为空',
    `password` VARCHAR(255) NOT NULL COMMENT '用户密码，不能为空',
    `email` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户邮箱，具有唯一性，不能为空',
    `points` INT DEFAULT 0 COMMENT '用户积分，默认值为0',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号创建时间，默认取当前时间',
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建用户资料表
CREATE TABLE `user_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户资料唯一标识，自增长主键',
    `user_id` BIGINT COMMENT '关联的用户标识，用于和用户表进行关联',
    `bio` TEXT COMMENT '用户简介，可存储较长的文本内容介绍用户自身情况',
    `profile_picture` VARCHAR(255) COMMENT '用户头像图片的链接地址',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建新闻表
CREATE TABLE `news` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '新闻唯一标识，自增长主键',
    `admin_id` BIGINT COMMENT '发布该新闻的管理员用户标识，用于关联到具体的管理员用户',
    `title` TEXT NOT NULL COMMENT '新闻标题，不能为空，存储新闻的标题内容',
    `content` TEXT NOT NULL COMMENT '新闻内容，不能为空，存储新闻的详细正文内容',
    `image_url` VARCHAR(255) COMMENT '新闻相关图片的链接地址',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '新闻创建时间，默认取当前时间',
    FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_admin_id` (`admin_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建论坛帖子表
CREATE TABLE `forum_posts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '论坛帖子唯一标识，自增长主键',
    `user_id` BIGINT COMMENT '发布该论坛帖子的用户标识，用于关联到具体的用户',
    `title` TEXT NOT NULL COMMENT '论坛帖子标题，不能为空，存储帖子的标题内容',
    `content` TEXT NOT NULL COMMENT '论坛帖子内容，不能为空，存储帖子的详细正文内容',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '论坛帖子创建时间，默认取当前时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建评论表
CREATE TABLE `comments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论唯一标识，自增长主键',
    `post_id` BIGINT COMMENT '该评论所属的论坛帖子标识，用于关联到具体的论坛帖子',
    `user_id` BIGINT COMMENT '发表该评论的用户标识，用于关联到具体的用户',
    `content` TEXT NOT NULL COMMENT '评论内容，不能为空，存储评论的具体文字内容',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评论创建时间，默认取当前时间',
    FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建点赞表
CREATE TABLE `likes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '点赞记录唯一标识，自增长主键',
    `post_id` BIGINT COMMENT '被点赞的论坛帖子标识，用于关联到具体的论坛帖子',
    `user_id` BIGINT COMMENT '进行点赞操作的用户标识，用于关联到具体的用户',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞操作发生的时间，默认取当前时间',
    UNIQUE KEY (`post_id`, `user_id`) COMMENT '确保同一个用户对同一个帖子只能点赞一次',
    FOREIGN KEY (`post_id`) REFERENCES `forum_posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建产品表
CREATE TABLE `products` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '产品唯一标识，自增长主键',
    `user_id` BIGINT COMMENT '发布该产品的用户标识，用于关联到具体的用户',
    `name` TEXT NOT NULL COMMENT '产品名称，不能为空，存储产品的名字',
    `description` TEXT COMMENT '产品描述，可详细介绍产品相关信息',
    `price` DECIMAL(10, 2) NOT NULL COMMENT '产品价格，不能为空，精确到小数点后两位',
    `image_url` VARCHAR(255) COMMENT '产品相关图片的链接地址',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '产品创建时间，默认取当前时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_price` (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建订单表
CREATE TABLE `orders` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '订单唯一标识，自增长主键',
    `product_id` BIGINT COMMENT '订单中所包含的产品标识，用于关联到具体的产品',
    `buyer_id` BIGINT COMMENT '下订单的买家用户标识，用于关联到具体的用户',
    `quantity` INT NOT NULL COMMENT '购买产品的数量，不能为空',
    `total_price` DECIMAL(10, 2) NOT NULL COMMENT '订单总价，不能为空，精确到小数点后两位',
    `status` VARCHAR(255) DEFAULT 'pending' COMMENT '订单状态，默认值为"pending"（待处理），可根据实际业务修改为其他状态，如已完成等',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '订单创建时间，默认取当前时间',
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    INDEX `idx_buyer_id` (`buyer_id`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建用户发布内容表（此处假设和论坛帖子等区分开的用户自主发布内容表）
CREATE TABLE `user_posts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户自主发布内容的唯一标识，自增长主键',
    `user_id` BIGINT COMMENT '发布该内容的用户标识，用于关联到具体的用户',
    `content` TEXT NOT NULL COMMENT '用户发布内容，不能为空，存储用户发布的文字等相关内容',
    `image_url` VARCHAR(255) COMMENT '用户发布内容相关图片的链接地址',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户发布内容的创建时间，默认取当前时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建产品图片表
CREATE TABLE `product_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '产品图片唯一标识，自增长主键',
    `product_id` BIGINT COMMENT '该图片所属的产品标识，用于关联到具体的产品',
    `image_url` VARCHAR(255) NOT NULL COMMENT '产品图片的链接地址，不能为空',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '产品图片添加时间，默认取当前时间',
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    INDEX `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建新闻图片表
CREATE TABLE `news_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '新闻图片唯一标识，自增长主键',
    `news_id` BIGINT COMMENT '该图片所属的新闻标识，用于关联到具体的新闻',
    `image_url` VARCHAR(255) NOT NULL COMMENT '新闻图片的链接地址，不能为空',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '新闻图片添加时间，默认取当前时间',
    FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON DELETE CASCADE,
    INDEX `idx_news_id` (`news_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建用户动态表
CREATE TABLE `user_moments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '动态唯一标识',
    `user_id` BIGINT NOT NULL COMMENT '发布动态的用户ID',
    `content` TEXT COMMENT '动态文字内容',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建动态图片表(支持一条动态多张图片)
CREATE TABLE `moment_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '图片唯一标识',
    `moment_id` BIGINT NOT NULL COMMENT '关联的动态ID',
    `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (`moment_id`) REFERENCES `user_moments`(`id`) ON DELETE CASCADE,
    INDEX `idx_moment_id` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;