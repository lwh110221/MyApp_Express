# 数据库初始化说明

## 文件结构

SQL文件按照依赖关系顺序进行组织，确保可以顺序执行：

1. **01_base_tables.sql** - 基础表结构，没有外键依赖的表
   - 用户表(users)
   - 管理员表(admins)
   - 角色表(roles)
   - 权限表(permissions)
   - 分类表(categories)等

2. **02_relation_tables.sql** - 一级依赖的表，依赖于基础表
   - 用户资料表(user_profiles)
   - 用户动态表(user_moments)
   - 管理员角色关联表(admin_roles)
   - 角色权限关联表(role_permissions)等

3. **03_secondary_tables.sql** - 二级依赖的表，依赖于一级表
   - 动态图片表(moment_images)
   - 专家回答表(help_answers)
   - 社区评论表(community_comments)
   - 农产品表(products)
   - 购物车表(carts)
   - 订单表(orders)等

4. **04_tertiary_tables.sql** - 三级依赖的表，依赖于二级表
   - 购物车项表(cart_items)
   - 订单项表(order_items)
   - 聊天消息表(chat_messages)
   - 未读消息统计表(chat_unread_counts)等

5. **05_admin_init.sql** - 管理员和权限初始化数据
   - 角色数据
   - 权限数据
   - 超级管理员账号
   - 角色权限关联

6. **06_initial_data.sql** - 其他初始数据
   - 测试用户数据
   - 分类数据
   - 测试帖子和回答
   - 测试产品等

## 使用方法

### 方式一：使用初始化脚本

直接运行提供的 `init_database.sh` 脚本：

```bash
chmod +x init_database.sh
./init_database.sh [数据库名] [用户名] [密码]
```

默认参数：
- 数据库名：back
- 用户名：root
- 密码：11022111

### 方式二：手动执行

按照顺序手动执行SQL文件：

```bash
# 创建数据库
mysql -u root -p11022111 -e "CREATE DATABASE IF NOT EXISTS back DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 按顺序执行SQL文件
mysql -u root -p11022111 back < 01_base_tables.sql
mysql -u root -p11022111 back < 02_relation_tables.sql
mysql -u root -p11022111 back < 03_secondary_tables.sql
mysql -u root -p11022111 back < 04_tertiary_tables.sql
mysql -u root -p11022111 back < 05_admin_init.sql
mysql -u root -p11022111 back < 06_initial_data.sql
```

## 表关系说明

1. 用户相关：users -> user_profiles, user_moments -> moment_images
2. 管理员相关：admins -> admin_roles -> roles -> role_permissions -> permissions
3. 新闻相关：news_categories -> news_articles
4. 社区相关：community_tags, community_posts -> community_comments, community_post_tags
5. 求助相关：help_categories -> help_posts -> help_answers
6. 产品相关：product_categories -> products -> (cart_items, order_items)
7. 订单相关：users -> orders -> order_items -> products
8. 聊天相关：users -> chat_sessions -> (chat_messages, chat_unread_counts)

## 注意事项

- 整个初始化过程应该一次性完成，中间出错可能需要重新开始
- 执行时请确保MySQL服务已启动
- 请确保提供的数据库用户有足够的权限创建数据库和表 