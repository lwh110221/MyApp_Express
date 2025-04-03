-- 为orders表添加物流信息字段
ALTER TABLE `orders` 
ADD COLUMN `tracking_number` VARCHAR(50) NULL COMMENT '物流单号' AFTER `shipping_time`,
ADD COLUMN `shipping_company` VARCHAR(50) NULL COMMENT '物流公司' AFTER `tracking_number`; 