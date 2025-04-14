-- 基础表结构定义
-- 此文件包含系统基础表，没有依赖的表优先创建

-- 用户表
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户唯一标识，自增长主键',
    `username` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户名，具有唯一性，不能为空',
    `password` VARCHAR(255) NOT NULL COMMENT '用户密码，不能为空',
    `email` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户邮箱，具有唯一性，不能为空',
    `points` INT DEFAULT 0 COMMENT '用户积分，默认值为0',
    `status` TINYINT DEFAULT 1 COMMENT '用户状态：1-正常，0-禁用',
    `email_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '邮箱是否已验证',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号创建时间，默认取当前时间',
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    name VARCHAR(50) NOT NULL COMMENT '角色名称',
    code VARCHAR(50) NOT NULL COMMENT '角色编码',
    description VARCHAR(200) COMMENT '角色描述',
    status TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
    name VARCHAR(50) NOT NULL COMMENT '权限名称',
    code VARCHAR(50) NOT NULL COMMENT '权限编码',
    description VARCHAR(200) COMMENT '权限描述',
    status TINYINT(1) DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

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

-- 求助分类表
CREATE TABLE `help_categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
    `description` VARCHAR(200) COMMENT '分类描述',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    INDEX `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='求助分类表';

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

-- 创建邮箱验证码表
CREATE TABLE IF NOT EXISTS `email_verification_codes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邮箱验证码表'; 