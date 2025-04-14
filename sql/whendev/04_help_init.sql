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

-- 添加测试数据（可选，用于开发测试）
INSERT INTO help_posts (user_id, title, content, category_id, status, view_count) VALUES
    (1, '玉米苗期发黄怎么处理？', '最近种植的玉米苗期出现大面积发黄现象，请问可能是什么原因导致的？该如何处理？', 1, 1, 0),
    (1, '水稻纹枯病如何防治', '水稻出现纹枯病症状，面积较大，求专业的防治方案。', 2, 1, 0);

-- 设置测试用户为专家身份（确保用户ID存在）
INSERT INTO user_identities (user_id, identity_type, status, certification_time, expiration_time, meta_data) VALUES
    (2, 'EXPERT', 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), '{"specialty": "农学", "title": "高级农艺师", "years": 10}')
ON DUPLICATE KEY UPDATE status = 1; 