#!/usr/bin/env node

/**
 * Export Data from XAMPP MySQL
 * สคริปต์สำหรับ export ข้อมูลจาก XAMPP ไปยังไฟล์ JSON
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// XAMPP Configuration
const config = {
  host: 'localhost',
  user: 'root',
  password: '', // ใส่ password ของ XAMPP ถ้ามี
  database: 'siamdrug_1', // เปลี่ยนเป็นชื่อ database ของคุณ (เช่น test, mysql, หรือชื่ออื่นๆ)
  port: 3306
};

// Tables to export
const tablesToExport = [
  'legacy_customers',
  'legacy_deliveries',
  'legacy_products',
  'users',
  'customers',
  'shipments',
  'media',
  'payments',
  'invoices'
];

async function exportData() {
  let connection;
  
  try {
    console.log('🔄 Starting data export from XAMPP...');
    
    // Connect to XAMPP database
    console.log('📡 Connecting to XAMPP database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to XAMPP database');
    
    const exportData = {};
    
    // Export each table
    for (const tableName of tablesToExport) {
      try {
        console.log(`\n📊 Exporting table: ${tableName}`);
        
        // Check if table exists
        const [tables] = await connection.execute(
          'SHOW TABLES LIKE ?', [tableName]
        );
        
        if (tables.length === 0) {
          console.log(`⚠️  Table ${tableName} not found, skipping...`);
          continue;
        }
        
        // Get data from table
        const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
        console.log(`📥 Found ${rows.length} records in ${tableName}`);
        
        exportData[tableName] = rows;
        
      } catch (error) {
        console.error(`❌ Error exporting table ${tableName}:`, error.message);
      }
    }
    
    // Save to file
    const exportPath = path.join(__dirname, 'xampp-data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Data exported to: ${exportPath}`);
    
    // Create SQL dump file
    const sqlDumpPath = path.join(__dirname, 'xampp-data-dump.sql');
    let sqlDump = '';
    
    for (const [tableName, rows] of Object.entries(exportData)) {
      if (rows.length > 0) {
        sqlDump += `\n-- Table: ${tableName}\n`;
        sqlDump += `DELETE FROM ${tableName};\n`;
        
        const columns = Object.keys(rows[0]);
        const values = rows.map(row => {
          const rowValues = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return value;
          });
          return `(${rowValues.join(', ')})`;
        });
        
        sqlDump += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n`;
        sqlDump += values.join(',\n') + ';\n';
      }
    }
    
    fs.writeFileSync(sqlDumpPath, sqlDump);
    console.log(`💾 SQL dump created: ${sqlDumpPath}`);
    
    console.log('\n🎉 Data export completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy the exported files to your Railway project');
    console.log('2. Run: node import-railway-data.js');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📡 Connection closed');
    }
  }
}

// Run export if called directly
if (require.main === module) {
  exportData().catch(console.error);
}

module.exports = { exportData };
