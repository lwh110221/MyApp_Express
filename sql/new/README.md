# 数据库初始化说明

## 使用方法

### 方式一：使用初始化脚本

直接运行提供的 `init_database.sh` 脚本：

```bash
chmod +x init_database.sh
./init_database.sh [数据库名] [用户名] [密码]
```

### 方式二：手动执行

按照顺序手动执行SQL文件：

```bash
# 创建数据库
mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS back DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 按顺序执行SQL文件
mysql -u root -p123456 dbname < 01_base_tables.sql
mysql -u root -p123456 dbname < 02_admin_init.sql
mysql -u root -p123456 dbname < 03_initial_data.sql
```

## 注意事项

- 整个初始化过程应该一次性完成，中间出错可能需要重新开始
- 执行时请确保MySQL服务已启动
- 请确保提供的数据库用户有足够的权限创建数据库和表 