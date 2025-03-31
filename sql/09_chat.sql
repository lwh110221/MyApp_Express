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