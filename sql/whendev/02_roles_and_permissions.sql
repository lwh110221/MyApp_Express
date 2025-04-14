-- 初始化超级管理员角色
INSERT INTO roles (name, code, description) VALUES 
('超级管理员', 'super_admin', '系统超级管理员，拥有所有权限'),
('管理员', 'admin', '系统管理员，拥有部分权限');

-- 初始化基础权限
INSERT INTO permissions (name, code, description) VALUES 
('管理员列表', 'admin:list', '查看管理员列表'),
('创建管理员', 'admin:create', '创建新管理员'),
('更新管理员', 'admin:update', '更新管理员信息'),
('删除管理员', 'admin:delete', '删除管理员'),
('用户列表', 'user:list', '查看用户列表'),
('用户详情', 'user:detail', '查看用户详情'),
('更新用户', 'user:update', '更新用户信息'),
('删除用户', 'user:delete', '删除用户'),
('用户统计', 'user:stats', '查看用户统计数据'),
('动态列表', 'moment:list', '查看动态列表'),
('删除动态', 'moment:delete', '删除动态'),
('动态统计', 'moment:stats', '查看动态统计'),
('日志列表', 'log:list', '查看操作日志'),
('日志统计', 'log:stats', '查看日志统计'),
('管理日志', 'log:clean', '清理历史日志');

-- 新闻管理相关权限
INSERT INTO permissions (name, code, description) VALUES 
('新闻分类管理', 'news:category:manage', '管理新闻分类（增删改查）'),
('新闻文章管理', 'news:article:manage', '管理新闻文章（增删改查）'),
('新闻发布管理', 'news:publish', '发布或下线新闻文章');

-- 身份认证相关权限
INSERT INTO permissions (name, code, description) VALUES 
('身份认证列表', 'identity:certification:list', '查看身份认证申请列表'),
('身份认证审核', 'identity:certification:review', '审核身份认证申请'),
('身份统计信息', 'identity:stats', '查看身份认证统计信息'),
('身份类型管理', 'identity:type:manage', '管理身份类型配置');

-- 求助/专家问答管理相关权限
INSERT INTO permissions (name, code, description) VALUES 
('求助分类管理', 'help:category:manage', '管理求助分类（增删改查）'),
('求助帖子管理', 'help:post:manage', '管理求助帖子（查看、更新状态等）'),
('求助回答管理', 'help:answer:manage', '管理求助回答（审核、删除等）'),
('求助统计信息', 'help:stats', '查看求助相关统计信息');

-- 社区相关权限
INSERT INTO permissions (name, code, description) VALUES 
('社区帖子管理', 'community:post:manage', '管理社区帖子（审核、删除等）'),
('社区评论管理', 'community:comment:manage', '管理社区评论（审核、删除等）'),
('社区标签管理', 'community:tag:manage', '管理社区标签（增删改查）'),
('社区用户关系管理', 'user:relation:manage', '管理用户关注关系'),
('用户积分管理', 'user:points:manage', '管理用户积分记录');

-- 产品管理权限
INSERT INTO permissions (name, code, description) VALUES
('查看产品分类', 'product:category:view', '允许查看所有产品分类'),
('创建产品分类', 'product:category:create', '允许创建新的产品分类'),
('删除产品分类', 'product:category:delete', '允许删除产品分类'),
('查看产品', 'product:view', '允许查看所有产品'),
('更新产品', 'product:update', '允许更新产品信息，包括上架/下架状态'),
('删除产品', 'product:delete', '允许删除产品');

-- 为超级管理员角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 为管理员角色分配基础权限（除了管理员管理和身份类型管理权限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code NOT LIKE 'admin:%' AND code != 'identity:type:manage';

-- 为管理员角色添加产品管理权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE code = 'admin'), 
    id 
FROM permissions 
WHERE code IN (
    'product:category:view',
    'product:category:create',
    'product:category:delete',
    'product:view',
    'product:update',
    'product:delete'
); 