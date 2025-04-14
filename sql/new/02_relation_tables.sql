-- 一级依赖的关联表
-- 这些表有外键依赖，但被依赖的表已在01_base_tables.sql中创建

-- 用户资料表
CREATE TABLE `user_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户资料唯一标识，自增长主键',
    `user_id` BIGINT COMMENT '关联的用户标识，用于和用户表进行关联',
    `bio` TEXT COMMENT '用户简介，可存储较长的文本内容介绍用户自身情况',
    `profile_picture` VARCHAR(255) COMMENT '用户头像图片的链接地址',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户资料表';

-- 用户动态表
CREATE TABLE `user_moments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '动态唯一标识',
    `user_id` BIGINT NOT NULL COMMENT '发布动态的用户ID',
    `content` TEXT COMMENT '动态文字内容',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户动态表';

-- 管理员角色关联表
CREATE TABLE IF NOT EXISTS admin_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    admin_id BIGINT NOT NULL COMMENT '管理员ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_admin_role (admin_id, role_id),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色关联表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 管理员操作日志表
CREATE TABLE `admin_operation_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    `admin_id` BIGINT NOT NULL COMMENT '管理员ID',
    `operation_type` VARCHAR(50) NOT NULL COMMENT '操作类型',
    `operation_desc` TEXT COMMENT '操作描述',
    `ip_address` VARCHAR(50) COMMENT '操作IP',
    `request_data` TEXT COMMENT '请求数据',
    `response_data` TEXT COMMENT '响应数据',
    `status_code` INT COMMENT 'HTTP状态码',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`),
    INDEX `idx_admin_operation_admin_id` (`admin_id`),
    INDEX `idx_admin_operation_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表';

-- 新闻文章表
CREATE TABLE `news_articles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '文章ID',
    `category_id` BIGINT NOT NULL COMMENT '分类ID',
    `title` VARCHAR(255) NOT NULL COMMENT '文章标题',
    `summary` VARCHAR(500) COMMENT '文章摘要',
    `content` LONGTEXT NOT NULL COMMENT '文章内容（富文本格式）',
    `cover_image` VARCHAR(255) COMMENT '封面图片URL',
    `author` VARCHAR(50) NOT NULL COMMENT '作者',
    `source` VARCHAR(100) COMMENT '来源',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `is_featured` TINYINT DEFAULT 0 COMMENT '是否热门：0-否，1-是',
    `is_published` TINYINT DEFAULT 0 COMMENT '是否发布：0-否，1-是',
    `publish_time` TIMESTAMP NULL COMMENT '发布时间',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `created_by` BIGINT NOT NULL COMMENT '创建人ID',
    `updated_by` BIGINT COMMENT '更新人ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`category_id`) REFERENCES `news_categories`(`id`),
    FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`),
    FOREIGN KEY (`updated_by`) REFERENCES `admins`(`id`),
    INDEX `idx_category` (`category_id`),
    INDEX `idx_featured` (`is_featured`),
    INDEX `idx_published` (`is_published`),
    INDEX `idx_publish_time` (`publish_time`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='新闻文章表';

-- 用户身份表
CREATE TABLE IF NOT EXISTS user_identities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '身份ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  identity_type VARCHAR(50) NOT NULL COMMENT '身份类型编码',
  status TINYINT DEFAULT 1 COMMENT '状态：0-无效 1-有效',
  certification_time DATETIME COMMENT '认证时间',
  expiration_time DATETIME COMMENT '过期时间',
  meta_data JSON COMMENT '身份扩展信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_user_identity` (`user_id`, `identity_type`),
  INDEX `idx_identity_status` (`identity_type`, `status`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户身份表';

-- 身份认证记录表
CREATE TABLE IF NOT EXISTS identity_certifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '认证记录ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  identity_type VARCHAR(50) NOT NULL COMMENT '身份类型编码',
  status TINYINT DEFAULT 0 COMMENT '状态：0-待审核 1-通过 2-拒绝',
  certification_data JSON COMMENT '认证资料',
  review_comment TEXT COMMENT '审核意见',
  reviewer_id BIGINT COMMENT '审核人ID',
  review_time DATETIME COMMENT '审核时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_status` (`user_id`, `status`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='身份认证记录表';

-- 求助帖子表
CREATE TABLE `help_posts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '帖子ID',
    `user_id` BIGINT NOT NULL COMMENT '发帖用户ID',
    `title` VARCHAR(200) NOT NULL COMMENT '标题',
    `content` TEXT NOT NULL COMMENT '求助内容',
    `images` JSON COMMENT '图片列表',
    `category_id` BIGINT COMMENT '分类ID',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-关闭，1-开放，2-已解决',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `help_categories`(`id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='求助帖子表';

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

-- 社区帖子表
CREATE TABLE IF NOT EXISTS `community_posts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '帖子ID',
    `user_id` BIGINT NOT NULL COMMENT '发帖用户ID',
    `title` VARCHAR(200) NOT NULL COMMENT '标题',
    `content` TEXT NOT NULL COMMENT '内容',
    `images` JSON COMMENT '图片列表',
    `tags` JSON COMMENT '标签ID数组',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `like_count` INT DEFAULT 0 COMMENT '点赞数',
    `comment_count` INT DEFAULT 0 COMMENT '评论数',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区帖子表';

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