-- 初始数据
-- 插入测试用户数据
INSERT INTO users (username, password, email, points, status) VALUES
('testuser1', '$2a$10$wpd59N.CfSbDUEj2nJmuh.3BCe4Dsd923EPw8zO6sYH5Qoqdc9vQS', 'test1@example.com', 100, 1),
('expert1', '$2a$10$wpd59N.CfSbDUEj2nJmuh.3BCe4Dsd923EPw8zO6sYH5Qoqdc9vQS', 'expert1@example.com', 200, 1);

-- 插入用户资料
INSERT INTO user_profiles (user_id, bio) VALUES
(1, '这是测试用户1的简介'),
(2, '这是专家用户的简介，农学专业，高级农艺师');

-- 初始化默认新闻分类
INSERT INTO news_categories (name, code, sort_order) VALUES 
('最新资讯', 'latest', 1),
('热点资讯', 'hot', 2),
('政策资讯', 'policy', 3),
('每周周刊', 'weekly', 4); 

-- 初始化农产品类别数据
INSERT INTO `product_categories` (`name`, `description`, `icon`, `sort_order`) VALUES
('蔬菜', '新鲜蔬菜', '/icons/vegetables.png', 1),
('水果', '时令水果', '/icons/fruits.png', 2),
('干果', '各类干果', '/icons/nuts.png', 3),
('特产', '地方特产', '/icons/specialty.png', 4),
('粮油', '粮食作物和油类', '/icons/grains.png', 5),
('草药', '中草药材', '/icons/herbs.png', 6);

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
('政策法规', '农业政策、补贴、认证等相关咨询', 90),
('市场行情', '农产品市场价格、销售渠道等咨询', 100);

-- 设置expert1用户为专家身份
INSERT INTO user_identities (user_id, identity_type, status, certification_time, expiration_time, meta_data) VALUES
(2, 'EXPERT', 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), '{"specialty": "农学", "title": "高级农艺师", "years": 10}');

-- 添加测试求助帖子
INSERT INTO help_posts (user_id, title, content, category_id, status, view_count) VALUES
(1, '玉米苗期发黄怎么处理？', '最近种植的玉米苗期出现大面积发黄现象，请问可能是什么原因导致的？该如何处理？', 1, 1, 0),
(1, '水稻纹枯病如何防治', '水稻出现纹枯病症状，面积较大，求专业的防治方案。', 2, 1, 0);

-- 添加测试动态
INSERT INTO user_moments (user_id, content) VALUES
(1, '今天的农田长势很好，分享一下！'),
(2, '刚刚解决了一个复杂的植物病害问题，很有成就感！');

-- 添加测试社区标签
INSERT INTO community_tags (name, status) VALUES
('农业技术', 1),
('种植经验', 1),
('病虫害防治', 1),
('政策解读', 1),
('农产品交流', 1);

-- 添加测试社区帖子
INSERT INTO community_posts (user_id, title, content, view_count, tags) VALUES
(1, '分享我的蔬菜种植经验', '今年种植的蔬菜产量翻倍，分享一下我的经验...', 5, '[1, 2]'),
(2, '新型杀虫剂使用指南', '作为专业人士，我来分享一下新型杀虫剂的科学使用方法...', 10, '[3]');

-- 添加测试产品
INSERT INTO products (user_id, category_id, title, description, price, original_price, stock, unit, location, is_featured) VALUES
(1, 1, '有机青菜', '纯天然有机种植的新鲜青菜，无农药残留', 5.50, 6.00, 100, '斤', '云南昆明', 1),
(1, 2, '高原红富士苹果', '云南高原种植的红富士苹果，口感脆甜', 8.80, 10.00, 200, '斤', '云南大理', 1); 