#!/bin/bash

# 数据库初始化脚本
# 用法: ./init_database.sh [数据库名] [用户名] [密码]

DB_NAME=${1:-"dev"}
DB_USER=${2:-"root"}
DB_PASS=${3:-"11022111"}

echo "开始初始化数据库 $DB_NAME..."

# 创建数据库
mysql -u $DB_USER -p$DB_PASS -e "CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if [ $? -ne 0 ]; then
    echo "创建数据库失败！"
    exit 1
fi
echo "数据库 $DB_NAME 创建成功或已存在"

# 按顺序执行SQL文件
SQL_FILES=(
    "01_base_tables.sql"
    "02_relation_tables.sql"
    "03_secondary_tables.sql"
    "04_tertiary_tables.sql"
    "05_admin_init.sql"
    "06_initial_data.sql"
)

for sql_file in "${SQL_FILES[@]}"; do
    echo "执行 $sql_file..."
    mysql -u $DB_USER -p$DB_PASS $DB_NAME < $sql_file
    if [ $? -ne 0 ]; then
        echo "执行 $sql_file 时出错！"
        exit 1
    fi
    echo "$sql_file 执行完成"
done

echo "数据库 $DB_NAME 初始化完成！" 