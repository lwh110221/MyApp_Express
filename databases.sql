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