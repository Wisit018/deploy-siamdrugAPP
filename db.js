const mysql = require('mysql2/promise');

// Railway MySQL configuration with fallback to custom environment variables
const config = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'test',
  port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  queueLimit: 0,
  // Railway MySQL specific configurations
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  acquireTimeout: 60000,
  timeout: 60000,
};

console.log('Database config:', {
  host: config.host,
  user: config.user,
  database: config.database,
  port: config.port,
  ssl: !!config.ssl
});

const pool = mysql.createPool(config);

module.exports = pool;

