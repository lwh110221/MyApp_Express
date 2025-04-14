-- 社区帖子表
CREATE TABLE `community_posts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '帖子ID',
    `user_id` BIGINT NOT NULL COMMENT '发帖用户ID',
    `title` VARCHAR(200) NOT NULL COMMENT '标题',
    `content` TEXT NOT NULL COMMENT '内容',
    `images` JSON COMMENT '图片列表',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `like_count` INT DEFAULT 0 COMMENT '点赞数',
    `comment_count` INT DEFAULT 0 COMMENT '评论数',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-删除，1-正常',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区帖子表';

-- 社区评论表
CREATE TABLE `community_comments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
    `post_id` BIGINT NOT NULL COMMENT '帖子ID',
    `user_id` BIGINT NOT NULL COMMENT '评论用户ID',
    `parent_id` BIGINT DEFAULT NULL COMMENT '父评论ID，用于回复功能',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `images` JSON COMMENT '图片列表',
    `like_count` INT DEFAULT 0 COMMENT '点赞数',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-删除，1-正常',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`parent_id`) REFERENCES `community_comments`(`id`) ON DELETE SET NULL,
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区评论表';

-- 点赞表
CREATE TABLE `community_likes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '点赞ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `target_id` BIGINT NOT NULL COMMENT '目标ID（帖子ID或评论ID）',
    `target_type` TINYINT NOT NULL COMMENT '目标类型：1-帖子，2-评论',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    UNIQUE KEY `uk_user_target` (`user_id`, `target_id`, `target_type`),
    INDEX `idx_target` (`target_id`, `target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞表';

-- 添加社区管理权限
INSERT INTO `permissions` (`name`, `code`, `description`, `status`) VALUES
('社区帖子管理', 'community:post:manage', '管理社区帖子', 1),
('社区评论管理', 'community:comment:manage', '管理社区评论', 1); 