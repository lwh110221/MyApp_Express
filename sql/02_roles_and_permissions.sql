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

-- 为超级管理员角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 为管理员角色分配基础权限（除了管理员管理和身份类型管理权限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code NOT LIKE 'admin:%' AND code != 'identity:type:manage'; 