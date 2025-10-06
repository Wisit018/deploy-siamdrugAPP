#!/usr/bin/env node

/**
 * Data Migration Script
 * Migrate data from XAMPP MySQL to Railway MySQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuration for XAMPP (source)
const sourceConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // ใส่ password ของ XAMPP ถ้ามี
  database: 'siamdrug_app', // เปลี่ยนเป็นชื่อ database ของคุณ
  port: 3306
};

// Configuration for Railway (destination)
const destConfig = {
  host: process.env.MYSQL_HOST || 'mysql.railway.internal',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'railway',
  port: Number(process.env.MYSQL_PORT || 3306),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Tables to migrate
const tablesToMigrate = [
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

async function migrateData() {
  let sourceConnection, destConnection;
  
  try {
    console.log('🔄 Starting data migration...');
    
    // Connect to source database (XAMPP)
    console.log('📡 Connecting to source database (XAMPP)...');
    sourceConnection = await mysql.createConnection(sourceConfig);
    console.log('✅ Connected to source database');
    
    // Connect to destination database (Railway)
    console.log('📡 Connecting to destination database (Railway)...');
    destConnection = await mysql.createConnection(destConfig);
    console.log('✅ Connected to destination database');
    
    // Migrate each table
    for (const tableName of tablesToMigrate) {
      try {
        console.log(`\n📊 Migrating table: ${tableName}`);
        
        // Check if table exists in source
        const [sourceTables] = await sourceConnection.execute(
          'SHOW TABLES LIKE ?', [tableName]
        );
        
        if (sourceTables.length === 0) {
          console.log(`⚠️  Table ${tableName} not found in source database, skipping...`);
          continue;
        }
        
        // Get data from source table
        const [rows] = await sourceConnection.execute(`SELECT * FROM ${tableName}`);
        console.log(`📥 Found ${rows.length} records in ${tableName}`);
        
        if (rows.length === 0) {
          console.log(`ℹ️  No data to migrate for ${tableName}`);
          continue;
        }
        
        // Clear destination table
        await destConnection.execute(`DELETE FROM ${tableName}`);
        console.log(`🗑️  Cleared destination table ${tableName}`);
        
        // Insert data into destination table
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const placeholders = columns.map(() => '?').join(', ');
          const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
          
          for (const row of rows) {
            const values = columns.map(col => row[col]);
            await destConnection.execute(sql, values);
          }
          
          console.log(`✅ Migrated ${rows.length} records to ${tableName}`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrating table ${tableName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Data migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceConnection) {
      await sourceConnection.end();
      console.log('📡 Source connection closed');
    }
    if (destConnection) {
      await destConnection.end();
      console.log('📡 Destination connection closed');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData().catch(console.error);
}

module.exports = { migrateData };
