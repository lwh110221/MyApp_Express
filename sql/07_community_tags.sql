-- 社区标签表
CREATE TABLE IF NOT EXISTS `community_tags` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '标签ID',
    `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `used_count` INT DEFAULT 0 COMMENT '使用次数',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `uk_tag_name` (`name`),
    INDEX `idx_status` (`status`),
    INDEX `idx_used_count` (`used_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区标签表';

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

-- 添加标签管理权限
INSERT INTO `permissions` (`name`, `code`, `description`, `status`) VALUES
('社区标签管理', 'community:tag:manage', '管理社区标签', 1);

-- 向community_posts表添加tags字段，用于存储标签ID数组
ALTER TABLE `community_posts` ADD COLUMN `tags` JSON COMMENT '标签ID数组'; 