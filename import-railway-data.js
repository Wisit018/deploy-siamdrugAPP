#!/usr/bin/env node

/**
 * Import Data to Railway MySQL
 * สคริปต์สำหรับ import ข้อมูลจากไฟล์ JSON ไปยัง Railway MySQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Railway MySQL Configuration
const config = {
  host: process.env.MYSQL_HOST || process.env.MYSQLHOST || 'mysql.railway.internal',
  user: process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'railway',
  port: Number(process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function importData() {
  let connection;
  
  try {
    console.log('🔄 Starting data import to Railway MySQL...');
    
    // Check if export file exists
    const exportPath = path.join(__dirname, 'xampp-data-export.json');
    if (!fs.existsSync(exportPath)) {
      console.error('❌ Export file not found. Please run export-xampp-data.js first.');
      process.exit(1);
    }
    
    // Connect to Railway database
    console.log('📡 Connecting to Railway MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to Railway MySQL');
    
    // Load export data
    console.log('📥 Loading export data...');
    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    console.log(`📊 Found data for ${Object.keys(exportData).length} tables`);
    
    // Import each table
    for (const [tableName, rows] of Object.entries(exportData)) {
      try {
        console.log(`\n📊 Importing table: ${tableName} (${rows.length} records)`);
        
        if (rows.length === 0) {
          console.log(`ℹ️  No data to import for ${tableName}`);
          continue;
        }
        
        // Clear existing data
        await connection.execute(`DELETE FROM ${tableName}`);
        console.log(`🗑️  Cleared existing data in ${tableName}`);
        
        // Insert data
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        let importedCount = 0;
        for (const row of rows) {
          try {
            const values = columns.map(col => row[col]);
            await connection.execute(sql, values);
            importedCount++;
          } catch (error) {
            console.error(`⚠️  Error importing record ${importedCount + 1}:`, error.message);
          }
        }
        
        console.log(`✅ Imported ${importedCount}/${rows.length} records to ${tableName}`);
        
      } catch (error) {
        console.error(`❌ Error importing table ${tableName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Data import completed!');
    console.log('\n🔍 Verification:');
    
    // Verify import
    for (const tableName of Object.keys(exportData)) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`📊 ${tableName}: ${result[0].count} records`);
      } catch (error) {
        console.log(`⚠️  ${tableName}: Error counting records`);
      }
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Connection closed');
    }
  }
}

// Run import if called directly
if (require.main === module) {
  importData().catch(console.error);
}

module.exports = { importData };
