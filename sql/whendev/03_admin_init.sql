-- 创建超级管理员账号
INSERT INTO admins (username, password, email, status) VALUES 
('lwhadmin', '$2a$10$UOFsUssH5GwPGL1zUeUTCe8wIGTbn4nQ0Ups7Jxd/tnK2djeDIDMa', 'lwhadmin@admin.com', 1);

-- 为超级管理员账号分配超级管理员角色
INSERT INTO admin_roles (admin_id, role_id) VALUES (1, 1); 