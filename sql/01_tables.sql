-- 用户表
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户唯一标识，自增长主键',
    `username` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户名，具有唯一性，不能为空',
    `password` VARCHAR(255) NOT NULL COMMENT '用户密码，不能为空',
    `email` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户邮箱，具有唯一性，不能为空',
    `points` INT DEFAULT 0 COMMENT '用户积分，默认值为0',
    `status` TINYINT DEFAULT 1 COMMENT '用户状态：1-正常，0-禁用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号创建时间，默认取当前时间',
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户资料表
CREATE TABLE `user_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户资料唯一标识，自增长主键',
    `user_id` BIGINT COMMENT '关联的用户标识，用于和用户表进行关联',
    `bio` TEXT COMMENT '用户简介，可存储较长的文本内容介绍用户自身情况',
    `profile_picture` VARCHAR(255) COMMENT '用户头像图片的链接地址',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户动态表
CREATE TABLE `user_moments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '动态唯一标识',
    `user_id` BIGINT NOT NULL COMMENT '发布动态的用户ID',
    `content` TEXT COMMENT '动态文字内容',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 动态图片表
CREATE TABLE `moment_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '图片唯一标识',
    `moment_id` BIGINT NOT NULL COMMENT '关联的动态ID',
    `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
    FOREIGN KEY (`moment_id`) REFERENCES `user_moments`(`id`) ON DELETE CASCADE,
    INDEX `idx_moment_id` (`moment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员表
CREATE TABLE `admins` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '管理员唯一标识',
    `username` VARCHAR(255) UNIQUE NOT NULL COMMENT '管理员用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '管理员密码',
    `email` VARCHAR(255) UNIQUE NOT NULL COMMENT '管理员邮箱',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `last_login` TIMESTAMP NULL COMMENT '最后登录时间',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_admin_username` (`username`),
    INDEX `idx_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '角色名称',
    code VARCHAR(50) NOT NULL COMMENT '角色编码',
    description VARCHAR(200) COMMENT '角色描述',
    status TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '权限名称',
    code VARCHAR(50) NOT NULL COMMENT '权限编码',
    description VARCHAR(200) COMMENT '权限描述',
    status TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 管理员角色关联表
CREATE TABLE IF NOT EXISTS admin_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id BIGINT NOT NULL COMMENT '管理员ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_admin_role (admin_id, role_id),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员角色关联表';

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL COMMENT '角色ID',
    permission_id BIGINT NOT NULL COMMENT '权限ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- 新闻分类表
CREATE TABLE `news_categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `code` VARCHAR(50) NOT NULL COMMENT '分类编码',
    `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `uk_code` (`code`),
    INDEX `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='新闻分类表';

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
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  identity_type VARCHAR(50) NOT NULL COMMENT '身份类型编码',
  status TINYINT DEFAULT 1 COMMENT '状态：0-无效 1-有效',
  certification_time DATETIME COMMENT '认证时间',
  expiration_time DATETIME COMMENT '过期时间',
  meta_data JSON COMMENT '身份扩展信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_identity` (`user_id`, `identity_type`),
  INDEX `idx_identity_status` (`identity_type`, `status`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户身份表';

-- 身份认证记录表
CREATE TABLE IF NOT EXISTS identity_certifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  identity_type VARCHAR(50) NOT NULL COMMENT '身份类型编码',
  status TINYINT DEFAULT 0 COMMENT '状态：0-待审核 1-通过 2-拒绝',
  certification_data JSON COMMENT '认证资料',
  review_comment TEXT COMMENT '审核意见',
  reviewer_id BIGINT COMMENT '审核人ID',
  review_time DATETIME COMMENT '审核时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_status` (`user_id`, `status`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='身份认证记录表'; 