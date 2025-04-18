SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin_operation_logs
-- ----------------------------
DROP TABLE IF EXISTS `admin_operation_logs`;
CREATE TABLE `admin_operation_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `admin_id` bigint NOT NULL COMMENT '管理员ID',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型',
  `operation_desc` text COMMENT '操作描述',
  `ip_address` varchar(50) DEFAULT NULL COMMENT '操作IP',
  `request_data` text COMMENT '请求数据',
  `response_data` text COMMENT '响应数据',
  `status_code` int DEFAULT NULL COMMENT 'HTTP状态码',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin_operation_admin_id` (`admin_id`),
  KEY `idx_admin_operation_created_at` (`created_at`),
  CONSTRAINT `admin_operation_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员操作日志表';

-- ----------------------------
-- Table structure for admin_roles
-- ----------------------------
DROP TABLE IF EXISTS `admin_roles`;
CREATE TABLE `admin_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `admin_id` bigint NOT NULL COMMENT '管理员ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_role` (`admin_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `admin_roles_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admin_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员角色关联表';

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` varchar(255) NOT NULL COMMENT '管理员用户名',
  `password` varchar(255) NOT NULL COMMENT '管理员密码',
  `email` varchar(255) NOT NULL COMMENT '管理员邮箱',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_admin_username` (`username`),
  KEY `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';

-- ----------------------------
-- Table structure for cart_items
-- ----------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '购物车项ID',
  `cart_id` bigint NOT NULL COMMENT '购物车ID',
  `product_id` bigint NOT NULL COMMENT '产品ID',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '数量',
  `selected` tinyint DEFAULT '1' COMMENT '是否选中：0-未选中，1-已选中',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cart_product` (`cart_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`),
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='购物车项表';

-- ----------------------------
-- Table structure for carts
-- ----------------------------
DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '购物车ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user` (`user_id`),
  CONSTRAINT `carts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='购物车表';

-- ----------------------------
-- Table structure for chat_messages
-- ----------------------------
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` bigint NOT NULL COMMENT '会话ID',
  `sender_id` bigint NOT NULL COMMENT '发送者ID',
  `receiver_id` bigint NOT NULL COMMENT '接收者ID',
  `content` text NOT NULL COMMENT '消息内容',
  `is_read` tinyint DEFAULT '0' COMMENT '是否已读：0-未读，1-已读',
  `content_type` tinyint DEFAULT '0' COMMENT '内容类型：0-文本，1-图片，2-语音，3-视频，4-文件',
  `media_url` varchar(255) DEFAULT NULL COMMENT '媒体文件URL',
  `send_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  `read_time` timestamp NULL DEFAULT NULL COMMENT '已读时间',
  PRIMARY KEY (`id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_sender_receiver` (`sender_id`,`receiver_id`),
  KEY `idx_send_time` (`send_time`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='聊天消息表';

-- ----------------------------
-- Table structure for chat_sessions
-- ----------------------------
DROP TABLE IF EXISTS `chat_sessions`;
CREATE TABLE `chat_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `user1_id` bigint NOT NULL COMMENT '用户1 ID',
  `user2_id` bigint NOT NULL COMMENT '用户2 ID',
  `last_message` varchar(255) DEFAULT NULL COMMENT '最后一条消息内容',
  `last_time` timestamp NULL DEFAULT NULL COMMENT '最后消息时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session` (`user1_id`,`user2_id`),
  KEY `user2_id` (`user2_id`),
  KEY `idx_users` (`user1_id`,`user2_id`),
  KEY `idx_last_time` (`last_time`),
  CONSTRAINT `chat_sessions_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_sessions_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='聊天会话表';

-- ----------------------------
-- Table structure for chat_unread_counts
-- ----------------------------
DROP TABLE IF EXISTS `chat_unread_counts`;
CREATE TABLE `chat_unread_counts` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `session_id` bigint NOT NULL COMMENT '会话ID',
  `unread_count` int DEFAULT '0' COMMENT '未读消息数量',
  `last_read_time` timestamp NULL DEFAULT NULL COMMENT '上次阅读时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_session` (`user_id`,`session_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `chat_unread_counts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_unread_counts_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='未读消息统计表';

-- ----------------------------
-- Table structure for community_comments
-- ----------------------------
DROP TABLE IF EXISTS `community_comments`;
CREATE TABLE `community_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `post_id` bigint NOT NULL COMMENT '帖子ID',
  `user_id` bigint NOT NULL COMMENT '评论用户ID',
  `parent_id` bigint DEFAULT NULL COMMENT '父评论ID，用于回复功能',
  `content` text NOT NULL COMMENT '评论内容',
  `images` json DEFAULT NULL COMMENT '图片列表',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-删除，1-正常',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_post_id` (`post_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `community_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`),
  CONSTRAINT `community_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `community_comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `community_comments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='社区评论表';

-- ----------------------------
-- Table structure for community_likes
-- ----------------------------
DROP TABLE IF EXISTS `community_likes`;
CREATE TABLE `community_likes` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '点赞ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `target_id` bigint NOT NULL COMMENT '目标ID（帖子ID或评论ID）',
  `target_type` tinyint NOT NULL COMMENT '目标类型：1-帖子，2-评论',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target` (`user_id`,`target_id`,`target_type`),
  KEY `idx_target` (`target_id`,`target_type`),
  CONSTRAINT `community_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='点赞表';

-- ----------------------------
-- Table structure for community_post_tags
-- ----------------------------
DROP TABLE IF EXISTS `community_post_tags`;
CREATE TABLE `community_post_tags` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `post_id` bigint NOT NULL COMMENT '帖子ID',
  `tag_id` bigint NOT NULL COMMENT '标签ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_tag` (`post_id`,`tag_id`),
  KEY `idx_tag_id` (`tag_id`),
  CONSTRAINT `community_post_tags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `community_post_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `community_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='帖子-标签关联表';

-- ----------------------------
-- Table structure for community_posts
-- ----------------------------
DROP TABLE IF EXISTS `community_posts`;
CREATE TABLE `community_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '帖子ID',
  `user_id` bigint NOT NULL COMMENT '发帖用户ID',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` text NOT NULL COMMENT '内容',
  `images` json DEFAULT NULL COMMENT '图片列表',
  `view_count` int DEFAULT '0' COMMENT '浏览次数',
  `like_count` int DEFAULT '0' COMMENT '点赞数',
  `comment_count` int DEFAULT '0' COMMENT '评论数',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-删除，1-正常',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `tags` json DEFAULT NULL COMMENT '标签ID数组',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `community_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='社区帖子表';

-- ----------------------------
-- Table structure for community_tags
-- ----------------------------
DROP TABLE IF EXISTS `community_tags`;
CREATE TABLE `community_tags` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `name` varchar(50) NOT NULL COMMENT '标签名称',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `used_count` int DEFAULT '0' COMMENT '使用次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tag_name` (`name`),
  KEY `idx_status` (`status`),
  KEY `idx_used_count` (`used_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='社区标签表';

-- ----------------------------
-- Table structure for email_verification_codes
-- ----------------------------
DROP TABLE IF EXISTS `email_verification_codes`;
CREATE TABLE `email_verification_codes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '验证码ID',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '邮箱',
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '验证码',
  `expires_at` datetime NOT NULL COMMENT '过期时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';

-- ----------------------------
-- Table structure for help_answers
-- ----------------------------
DROP TABLE IF EXISTS `help_answers`;
CREATE TABLE `help_answers` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '回答ID',
  `post_id` bigint NOT NULL COMMENT '帖子ID',
  `expert_id` bigint NOT NULL COMMENT '专家用户ID',
  `content` text NOT NULL COMMENT '回答内容',
  `images` json DEFAULT NULL COMMENT '图片列表',
  `is_accepted` tinyint DEFAULT '0' COMMENT '是否被采纳：0-否，1-是',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `expert_id` (`expert_id`),
  KEY `idx_post_expert` (`post_id`,`expert_id`),
  CONSTRAINT `help_answers_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `help_posts` (`id`),
  CONSTRAINT `help_answers_ibfk_2` FOREIGN KEY (`expert_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='专家回答表';

-- ----------------------------
-- Table structure for help_categories
-- ----------------------------
DROP TABLE IF EXISTS `help_categories`;
CREATE TABLE `help_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `description` varchar(200) DEFAULT NULL COMMENT '分类描述',
  `sort_order` int DEFAULT '0' COMMENT '排序',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='求助分类表';

-- ----------------------------
-- Table structure for help_posts
-- ----------------------------
DROP TABLE IF EXISTS `help_posts`;
CREATE TABLE `help_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '帖子ID',
  `user_id` bigint NOT NULL COMMENT '发帖用户ID',
  `title` varchar(200) NOT NULL COMMENT '标题',
  `content` text NOT NULL COMMENT '求助内容',
  `images` json DEFAULT NULL COMMENT '图片列表',
  `category_id` bigint DEFAULT NULL COMMENT '分类ID',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-关闭，1-开放，2-已解决',
  `view_count` int DEFAULT '0' COMMENT '浏览次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_category` (`category_id`),
  CONSTRAINT `help_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='求助帖子表';

-- ----------------------------
-- Table structure for identity_certifications
-- ----------------------------
DROP TABLE IF EXISTS `identity_certifications`;
CREATE TABLE `identity_certifications` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '认证ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `identity_type` varchar(50) NOT NULL COMMENT '身份类型编码',
  `status` tinyint DEFAULT '0' COMMENT '状态：0-待审核 1-通过 2-拒绝',
  `certification_data` json DEFAULT NULL COMMENT '认证资料',
  `review_comment` text COMMENT '审核意见',
  `reviewer_id` bigint DEFAULT NULL COMMENT '审核人ID',
  `review_time` datetime DEFAULT NULL COMMENT '审核时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_status` (`user_id`,`status`),
  KEY `reviewer_id` (`reviewer_id`),
  CONSTRAINT `identity_certifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `identity_certifications_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='身份认证记录表';

-- ----------------------------
-- Table structure for moment_images
-- ----------------------------
DROP TABLE IF EXISTS `moment_images`;
CREATE TABLE `moment_images` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '图片唯一标识',
  `moment_id` bigint NOT NULL COMMENT '关联的动态ID',
  `image_url` varchar(255) NOT NULL COMMENT '图片URL',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  PRIMARY KEY (`id`),
  KEY `idx_moment_id` (`moment_id`),
  CONSTRAINT `moment_images_ibfk_1` FOREIGN KEY (`moment_id`) REFERENCES `user_moments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='动态图片表';

-- ----------------------------
-- Table structure for news_articles
-- ----------------------------
DROP TABLE IF EXISTS `news_articles`;
CREATE TABLE `news_articles` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  `category_id` bigint NOT NULL COMMENT '分类ID',
  `title` varchar(255) NOT NULL COMMENT '文章标题',
  `summary` varchar(500) DEFAULT NULL COMMENT '文章摘要',
  `content` longtext NOT NULL COMMENT '文章内容（富文本格式）',
  `cover_image` varchar(255) DEFAULT NULL COMMENT '封面图片URL',
  `author` varchar(50) NOT NULL COMMENT '作者',
  `source` varchar(100) DEFAULT NULL COMMENT '来源',
  `view_count` int DEFAULT '0' COMMENT '浏览次数',
  `is_featured` tinyint DEFAULT '0' COMMENT '是否热门：0-否，1-是',
  `is_published` tinyint DEFAULT '0' COMMENT '是否发布：0-否，1-是',
  `publish_time` timestamp NULL DEFAULT NULL COMMENT '发布时间',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `created_by` bigint NOT NULL COMMENT '创建人ID',
  `updated_by` bigint DEFAULT NULL COMMENT '更新人ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_category` (`category_id`),
  KEY `idx_featured` (`is_featured`),
  KEY `idx_published` (`is_published`),
  KEY `idx_publish_time` (`publish_time`),
  KEY `idx_status` (`status`),
  CONSTRAINT `news_articles_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `news_categories` (`id`),
  CONSTRAINT `news_articles_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `admins` (`id`),
  CONSTRAINT `news_articles_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `admins` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='新闻文章表';

-- ----------------------------
-- Table structure for news_categories
-- ----------------------------
DROP TABLE IF EXISTS `news_categories`;
CREATE TABLE `news_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) NOT NULL COMMENT '分类名称',
  `code` varchar(50) NOT NULL COMMENT '分类编码',
  `sort_order` int DEFAULT '0' COMMENT '排序顺序',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='新闻分类表';

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单项ID',
  `order_id` bigint NOT NULL COMMENT '订单ID',
  `product_id` bigint NOT NULL COMMENT '产品ID',
  `product_title` varchar(100) NOT NULL COMMENT '产品名称（冗余存储，防止产品修改）',
  `product_image` varchar(255) DEFAULT NULL COMMENT '产品图片',
  `price` decimal(10,2) NOT NULL COMMENT '购买单价',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '购买数量',
  `total_amount` decimal(10,2) NOT NULL COMMENT '总金额',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_product` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单项表';

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` varchar(50) NOT NULL COMMENT '订单编号',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `total_amount` decimal(10,2) NOT NULL COMMENT '订单总金额',
  `status` tinyint DEFAULT '0' COMMENT '订单状态：0-待付款，1-已付款待发货，2-已发货，3-已完成，4-已取消，5-已退款',
  `contact_name` varchar(50) NOT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) NOT NULL COMMENT '联系人电话',
  `address` varchar(255) NOT NULL COMMENT '收货地址',
  `note` varchar(255) DEFAULT NULL COMMENT '订单备注',
  `payment_method` tinyint DEFAULT NULL COMMENT '支付方式：1-微信，2-支付宝，3-银行卡',
  `payment_time` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  `shipping_time` timestamp NULL DEFAULT NULL COMMENT '发货时间',
  `tracking_number` varchar(50) DEFAULT NULL COMMENT '物流单号',
  `shipping_company` varchar(50) DEFAULT NULL COMMENT '物流公司',
  `completion_time` timestamp NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单表';

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '权限ID',
  `name` varchar(50) NOT NULL COMMENT '权限名称',
  `code` varchar(50) NOT NULL COMMENT '权限编码',
  `description` varchar(200) DEFAULT NULL COMMENT '权限描述',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='权限表';

-- ----------------------------
-- Table structure for point_records
-- ----------------------------
DROP TABLE IF EXISTS `point_records`;
CREATE TABLE `point_records` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '积分记录ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `points` int NOT NULL COMMENT '积分变动值',
  `type` varchar(20) NOT NULL COMMENT '类型：post_create/post_like/comment_create/comment_like/post_delete/comment_delete',
  `related_id` bigint DEFAULT NULL COMMENT '关联ID（帖子ID或评论ID）',
  `description` varchar(255) DEFAULT NULL COMMENT '积分变动描述',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `point_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='积分记录表';

-- ----------------------------
-- Table structure for product_categories
-- ----------------------------
DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE `product_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '类别ID',
  `name` varchar(50) NOT NULL COMMENT '类别名称',
  `description` varchar(200) DEFAULT NULL COMMENT '类别描述',
  `icon` varchar(255) DEFAULT NULL COMMENT '类别图标',
  `parent_id` bigint DEFAULT NULL COMMENT '父类别ID，用于多级分类',
  `sort_order` int DEFAULT '0' COMMENT '排序顺序',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='农产品类别表';

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '产品ID',
  `user_id` bigint NOT NULL COMMENT '发布用户ID（农户）',
  `category_id` bigint NOT NULL COMMENT '产品类别ID',
  `title` varchar(100) NOT NULL COMMENT '产品名称',
  `description` text NOT NULL COMMENT '产品描述',
  `price` decimal(10,2) NOT NULL COMMENT '产品价格',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价',
  `stock` int DEFAULT '0' COMMENT '库存数量',
  `unit` varchar(20) NOT NULL COMMENT '计量单位（如：公斤、袋、箱）',
  `location` varchar(100) DEFAULT NULL COMMENT '产地',
  `images` json DEFAULT NULL COMMENT '产品图片列表',
  `attributes` json DEFAULT NULL COMMENT '产品属性（如：品种、等级、保质期等）',
  `is_bulk` tinyint DEFAULT '0' COMMENT '是否批量订购：0-否，1-是',
  `min_order_quantity` int DEFAULT '1' COMMENT '最低起订数量',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-下架，1-上架',
  `is_featured` tinyint DEFAULT '0' COMMENT '是否推荐：0-否，1-是',
  `view_count` int DEFAULT '0' COMMENT '浏览次数',
  `sales_count` int DEFAULT '0' COMMENT '销售数量',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`),
  KEY `idx_featured` (`is_featured`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='农产品信息表';

-- ----------------------------
-- Table structure for role_permissions
-- ----------------------------
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '关联ID',
  `role_id` bigint NOT NULL COMMENT '角色ID',
  `permission_id` bigint NOT NULL COMMENT '权限ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色权限关联表';

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `code` varchar(50) NOT NULL COMMENT '角色编码',
  `description` varchar(200) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint(1) DEFAULT '1' COMMENT '状态：0-禁用，1-启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色表';

-- ----------------------------
-- Table structure for user_follows
-- ----------------------------
DROP TABLE IF EXISTS `user_follows`;
CREATE TABLE `user_follows` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '关注记录ID',
  `follower_id` bigint NOT NULL COMMENT '关注者ID',
  `followed_id` bigint NOT NULL COMMENT '被关注者ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follower_followed` (`follower_id`,`followed_id`),
  KEY `idx_follower_id` (`follower_id`),
  KEY `idx_followed_id` (`followed_id`),
  CONSTRAINT `user_follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_follows_ibfk_2` FOREIGN KEY (`followed_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户关注表';

-- ----------------------------
-- Table structure for user_identities
-- ----------------------------
DROP TABLE IF EXISTS `user_identities`;
CREATE TABLE `user_identities` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '认证ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `identity_type` varchar(50) NOT NULL COMMENT '身份类型编码',
  `status` tinyint DEFAULT '1' COMMENT '状态：0-无效 1-有效',
  `certification_time` datetime DEFAULT NULL COMMENT '认证时间',
  `expiration_time` datetime DEFAULT NULL COMMENT '过期时间',
  `meta_data` json DEFAULT NULL COMMENT '身份扩展信息',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_identity` (`user_id`,`identity_type`),
  KEY `idx_identity_status` (`identity_type`,`status`),
  CONSTRAINT `user_identities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户身份表';

-- ----------------------------
-- Table structure for user_moments
-- ----------------------------
DROP TABLE IF EXISTS `user_moments`;
CREATE TABLE `user_moments` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '动态唯一标识',
  `user_id` bigint NOT NULL COMMENT '发布动态的用户ID',
  `content` text COMMENT '动态文字内容',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `user_moments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户动态表';

-- ----------------------------
-- Table structure for user_profiles
-- ----------------------------
DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户资料唯一标识，自增长主键',
  `user_id` bigint DEFAULT NULL COMMENT '关联的用户标识，用于和用户表进行关联',
  `bio` text COMMENT '用户简介，可存储较长的文本内容介绍用户自身情况',
  `profile_picture` varchar(255) DEFAULT NULL COMMENT '用户头像图片的链接地址',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户资料表';

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户唯一标识，自增长主键',
  `username` varchar(255) NOT NULL COMMENT '用户名，具有唯一性，不能为空',
  `password` varchar(255) NOT NULL COMMENT '用户密码，不能为空',
  `email` varchar(255) NOT NULL COMMENT '用户邮箱，具有唯一性，不能为空',
  `points` int DEFAULT '0' COMMENT '用户积分，默认值为0',
  `status` tinyint DEFAULT '1' COMMENT '用户状态：1-正常，0-禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号创建时间，默认取当前时间',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0' COMMENT '邮箱是否已验证',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户表';

-- ----------------------------
-- View structure for users_with_profiles
-- ----------------------------
DROP VIEW IF EXISTS `users_with_profiles`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `users_with_profiles` AS select `u`.`id` AS `id`,`u`.`username` AS `username`,`u`.`password` AS `password`,`u`.`email` AS `email`,`u`.`points` AS `points`,`u`.`status` AS `status`,`u`.`created_at` AS `created_at`,coalesce(`up`.`profile_picture`,'') AS `profile_picture` from (`users` `u` left join `user_profiles` `up` on((`u`.`id` = `up`.`user_id`)));

SET FOREIGN_KEY_CHECKS = 1;
