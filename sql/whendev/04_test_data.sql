-- 插入测试用户数据
INSERT INTO users (username, password, email, points, status) VALUES
('testuser1', '$2a$10$wpd59N.CfSbDUEj2nJmuh.3BCe4Dsd923EPw8zO6sYH5Qoqdc9vQS', 'test1@example.com', 100, 1);

-- 插入用户资料
INSERT INTO user_profiles (user_id, bio) VALUES
(1, '这是测试用户1的简介');

-- 初始化默认新闻分类
INSERT INTO news_categories (name, code, sort_order) VALUES 
('最新资讯', 'latest', 1),
('热点资讯', 'hot', 2),
('政策资讯', 'policy', 3),
('每周周刊', 'weekly', 4); 