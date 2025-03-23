-- 积分记录表
CREATE TABLE `point_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '积分记录ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `points` INT NOT NULL COMMENT '积分变动值',
  `type` VARCHAR(20) NOT NULL COMMENT '类型：post_create/post_like/comment_create/comment_like/post_delete/comment_delete',
  `related_id` BIGINT DEFAULT NULL COMMENT '关联ID（帖子ID或评论ID）',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '积分变动描述',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分记录表';

-- 用户关注表
CREATE TABLE `user_follows` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关注记录ID',
  `follower_id` BIGINT NOT NULL COMMENT '关注者ID',
  `followed_id` BIGINT NOT NULL COMMENT '被关注者ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follower_followed` (`follower_id`,`followed_id`),
  KEY `idx_follower_id` (`follower_id`),
  KEY `idx_followed_id` (`followed_id`),
  FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`followed_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注表'; 