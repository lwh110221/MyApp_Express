const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  queueLimit: 0,
  connectTimeout: process.env.DB_CONNECT_TIMEOUT || 10000,
});

// 添加连接池错误处理
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
});

// 定期检查连接是否有效
setInterval(() => {
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.error('数据库连接检查失败:', err);
    }
  });
}, 60000); // 每分钟检查一次

module.exports = pool.promise(); 