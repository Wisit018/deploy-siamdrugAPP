const mysql = require('mysql2/promise');

// Railway MySQL configuration with fallback to custom environment variables
const config = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'test',
  port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT || 25), // เพิ่มจาก 10 เป็น 25
  queueLimit: 100, // เพิ่ม queue limit
  acquireTimeout: 60000, // เพิ่ม acquire timeout
  timeout: 60000, // เพิ่ม query timeout
  reconnect: true, // เปิดใช้งาน reconnect
  idleTimeout: 300000, // 5 นาที idle timeout
  // Railway MySQL specific configurations
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // เพิ่มการตั้งค่าสำหรับ performance
  multipleStatements: false,
  dateStrings: false,
  debug: process.env.NODE_ENV === 'development' ? ['ComProtocolPacket'] : false,
};

console.log('🔍 Environment Variables Debug:');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
console.log('MYSQL_PORT:', process.env.MYSQL_PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('📊 Database config:', {
  host: config.host,
  user: config.user,
  database: config.database,
  port: config.port,
  ssl: !!config.ssl
});

const pool = mysql.createPool(config);

module.exports = pool;

