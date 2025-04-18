-- 初始数据
-- 插入测试用户数据
INSERT INTO users (username, password, email, points, status) VALUES
('老百姓', '$2a$10$UOFsUssH5GwPGL1zUeUTCe8wIGTbn4nQ0Ups7Jxd/tnK2djeDIDMa', 'a@a.com', 100, 1),
('专家', '$2a$10$UOFsUssH5GwPGL1zUeUTCe8wIGTbn4nQ0Ups7Jxd/tnK2djeDIDMa', 'b@b.com', 200, 1);

-- 初始化默认新闻分类
INSERT INTO news_categories (name, code, sort_order) VALUES 
('最新资讯', 'latest', 1),
('热点资讯', 'hot', 2),
('政策资讯', 'policy', 3),
('每周周刊', 'weekly', 4),
('农业技术', 'agriculture', 5);


-- 初始化农产品类别数据
INSERT INTO `product_categories` (`name`, `description`, `icon`, `sort_order`) VALUES
('蔬菜', '新鲜蔬菜', '/icons/vegetables.png', 1),
('水果', '时令水果', '/icons/fruits.png', 2),
('干果', '各类干果', '/icons/nuts.png', 3),
('特产', '地方特产', '/icons/specialty.png', 4),
('粮油', '粮食作物和油类', '/icons/grains.png', 5),
('草药', '中草药材', '/icons/herbs.png', 6),
('其他', '其他农产品', '/icons/other.png', 7);
-- 初始化求助分类数据
INSERT INTO help_categories (name, description, sort_order) VALUES 
('种植技术', '农作物种植相关的技术问题，包括播种、施肥、灌溉等', 10),
('病虫害防治', '农作物病虫害识别、预防和治理方法', 20),
('农业设备', '农业机械设备的使用、维护和故障排除', 30),
('土壤管理', '土壤改良、检测和养护相关问题', 40),
('农产品储存', '农产品采收后的储存、保鲜技术', 50),
('气候应对', '应对异常天气、自然灾害的农业措施', 60),
('品种选择', '农作物品种选择、育种相关咨询', 70),
('有机农业', '有机种植、绿色防控等生态农业技术', 80),
('市场行情', '农产品市场价格、销售渠道等咨询', 100);

-- 设置expert1用户为专家身份
INSERT INTO user_identities (user_id, identity_type, status, certification_time, expiration_time, meta_data) VALUES
(2, 'EXPERT', 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), '{"specialty": "农学", "title": "高级农艺师", "years": 10}');


-- 添加测试动态
INSERT INTO user_moments (user_id, content) VALUES
(1, '今天的农田长势很好，分享一下！'),
(2, '刚刚解决了一个复杂的植物病害问题，很有成就感！');

-- 添加测试社区标签
INSERT INTO community_tags (name, status) VALUES
('农业技术', 1),
('种植经验', 1),
('病虫害防治', 1),
('农产品交流', 1);
