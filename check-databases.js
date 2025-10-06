#!/usr/bin/env node

/**
 * Check Available Databases in XAMPP
 * สคริปต์สำหรับตรวจสอบ databases ที่มีอยู่ใน XAMPP
 */

const mysql = require('mysql2/promise');

// XAMPP Configuration
const config = {
  host: 'localhost',
  user: 'root',
  password: '', // ใส่ password ของ XAMPP ถ้ามี
  port: 3306
};

async function checkDatabases() {
  let connection;
  
  try {
    console.log('🔍 Checking available databases in XAMPP...');
    
    // Connect to MySQL server (without specifying database)
    console.log('📡 Connecting to XAMPP MySQL server...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to XAMPP MySQL server');
    
    // Get list of databases
    console.log('\n📊 Available databases:');
    const [databases] = await connection.execute('SHOW DATABASES');
    
    databases.forEach((db, index) => {
      console.log(`${index + 1}. ${db.Database}`);
    });
    
    // Check tables in each database
    console.log('\n📋 Tables in each database:');
    for (const db of databases) {
      const dbName = db.Database;
      
      // Skip system databases
      if (['information_schema', 'performance_schema', 'mysql', 'sys'].includes(dbName)) {
        continue;
      }
      
      try {
        await connection.execute(`USE ${dbName}`);
        const [tables] = await connection.execute('SHOW TABLES');
        
        if (tables.length > 0) {
          console.log(`\n🗄️  Database: ${dbName}`);
          tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
          });
        }
      } catch (error) {
        console.log(`\n⚠️  Cannot access database: ${dbName}`);
      }
    }
    
    console.log('\n💡 Copy the database name you want to use and update export-xampp-data.js');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Connection closed');
    }
  }
}

// Run check if called directly
if (require.main === module) {
  checkDatabases().catch(console.error);
}

module.exports = { checkDatabases };
