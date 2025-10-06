# 📊 คู่มือการ Migrate ข้อมูลจาก XAMPP ไปยัง Railway MySQL

## 🎯 วัตถุประสงค์
ย้ายข้อมูลจาก XAMPP MySQL ไปยัง Railway MySQL เพื่อให้แอปสามารถทำงานกับข้อมูลจริงได้

## 📋 ไฟล์ที่เกี่ยวข้อง
- `export-xampp-data.js` - สคริปต์สำหรับ export ข้อมูลจาก XAMPP
- `import-railway-data.js` - สคริปต์สำหรับ import ข้อมูลไปยัง Railway
- `migrate-data.js` - สคริปต์สำหรับ migrate ข้อมูลโดยตรง
- `xampp-data-export.json` - ไฟล์ข้อมูลที่ export ออกมา
- `xampp-data-dump.sql` - ไฟล์ SQL dump

## 🚀 วิธีที่ 1: ใช้ Scripts (แนะนำ)

### ขั้นตอนที่ 1: Export ข้อมูลจาก XAMPP

1. **เปิด Command Prompt/Terminal** ในโฟลเดอร์โปรเจค
2. **ตรวจสอบการตั้งค่า** ใน `export-xampp-data.js`:
   ```javascript
   const config = {
     host: 'localhost',
     user: 'root',
     password: '', // ใส่ password ของ XAMPP ถ้ามี
     database: 'siamdrug_app', // เปลี่ยนเป็นชื่อ database ของคุณ
     port: 3306
   };
   ```
3. **รันสคริปต์**:
   ```bash
   node export-xampp-data.js
   ```
4. **ตรวจสอบไฟล์ที่สร้าง**:
   - `xampp-data-export.json` - ข้อมูลในรูปแบบ JSON
   - `xampp-data-dump.sql` - ข้อมูลในรูปแบบ SQL

### ขั้นตอนที่ 2: Import ข้อมูลไปยัง Railway

1. **อัปโหลดไฟล์** `xampp-data-export.json` ไปยัง Railway project
2. **รันสคริปต์** ใน Railway environment:
   ```bash
   node import-railway-data.js
   ```

## 🚀 วิธีที่ 2: ใช้ mysqldump

### ขั้นตอนที่ 1: Export จาก XAMPP

```bash
# Export ทั้ง database
mysqldump -u root -p siamdrug_app > siamdrug_backup.sql

# หรือ export เฉพาะตารางที่ต้องการ
mysqldump -u root -p siamdrug_app legacy_customers legacy_deliveries legacy_products > legacy_data.sql
```

### ขั้นตอนที่ 2: Import ไปยัง Railway

```bash
# ใช้ Railway CLI
railway connect mysql

# Import ข้อมูล
mysql -h mysql.railway.internal -u root -p railway < siamdrug_backup.sql
```

## 🚀 วิธีที่ 3: ใช้ phpMyAdmin

### ขั้นตอนที่ 1: Export จาก phpMyAdmin

1. **เปิด phpMyAdmin** (http://localhost/phpmyadmin)
2. **เลือก database** `siamdrug_app`
3. **คลิกแท็บ "Export"**
4. **เลือก "Custom"**
5. **เลือกตารางที่ต้องการ**
6. **คลิก "Go"** เพื่อดาวน์โหลดไฟล์ SQL

### ขั้นตอนที่ 2: Import ไปยัง Railway

1. **ใช้ Railway CLI** เชื่อมต่อ MySQL:
   ```bash
   railway connect mysql
   ```
2. **เปิด MySQL client**:
   ```bash
   mysql -h mysql.railway.internal -u root -p railway
   ```
3. **Import ข้อมูล**:
   ```sql
   source /path/to/exported/file.sql;
   ```

## 🔍 การตรวจสอบผลลัพธ์

### ตรวจสอบใน Railway Dashboard

1. **ไปที่ Railway Dashboard**
2. **คลิกที่ MySQL service**
3. **ไปที่แท็บ "Data"** หรือ "Query"
4. **ตรวจสอบข้อมูลในตารางต่างๆ**

### ตรวจสอบในแอป

1. **เข้าใช้แอป** ที่ Railway URL
2. **ทดสอบการล็อกอิน**
3. **ตรวจสอบข้อมูลใน Dashboard**
4. **ทดสอบ CRUD operations**

## 🛠️ การแก้ไขปัญหา

### ปัญหา: Connection Refused

**สาเหตุ**: ไม่สามารถเชื่อมต่อ XAMPP MySQL ได้

**วิธีแก้**:
1. ตรวจสอบว่า XAMPP กำลังทำงานอยู่
2. ตรวจสอบ port 3306
3. ตรวจสอบ username/password

### ปัญหา: Table Not Found

**สาเหตุ**: ตารางไม่มีอยู่ใน database

**วิธีแก้**:
1. ตรวจสอบชื่อ database
2. ตรวจสอบชื่อตาราง
3. รัน database schema ก่อน

### ปัญหา: Permission Denied

**สาเหตุ**: ไม่มีสิทธิ์ในการเขียนข้อมูล

**วิธีแก้**:
1. ตรวจสอบ MySQL user permissions
2. ใช้ root user หรือ user ที่มีสิทธิ์

## 📊 ตารางที่จะถูก Migrate

- `legacy_customers` - ข้อมูลลูกค้าเก่า
- `legacy_deliveries` - ข้อมูลการจัดส่ง
- `legacy_products` - ข้อมูลสินค้า
- `users` - ข้อมูลผู้ใช้
- `customers` - ข้อมูลลูกค้าใหม่
- `shipments` - ข้อมูลการจัดส่งใหม่
- `media` - ข้อมูลสื่อ
- `payments` - ข้อมูลการชำระเงิน
- `invoices` - ข้อมูลใบแจ้งหนี้

## ⚠️ ข้อควรระวัง

1. **Backup ข้อมูล** ก่อนทำการ migrate
2. **ทดสอบใน development** ก่อน production
3. **ตรวจสอบข้อมูล** หลัง migrate เสร็จ
4. **อัปเดต connection strings** ในแอป

## 🎉 หลัง Migrate เสร็จ

1. **ทดสอบแอป** ว่าทำงานได้ปกติ
2. **ตรวจสอบข้อมูล** ว่าถูกต้อง
3. **อัปเดต documentation**
4. **แจ้งทีม** ว่าข้อมูลพร้อมใช้งาน

---

**💡 เคล็ดลับ**: ใช้วิธีที่ 1 (Scripts) เพราะง่ายที่สุดและมี error handling ที่ดี
