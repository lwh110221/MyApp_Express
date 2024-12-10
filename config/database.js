const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'lwh.lwhao221.space',
  user: 'root',  
  password: 'mysql_LWH110221',  
  database: 'myapp_database',  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise(); 