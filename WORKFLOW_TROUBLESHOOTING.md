# 🔧 Workflow API Troubleshooting Guide

## ปัญหา: "Failed to save workflow data"

### 🔍 การตรวจสอบเบื้องต้น

#### 1. ตรวจสอบ Server Logs
```bash
# ดู logs ของ Railway deployment
railway logs --service deploy-siamdrug

# หรือดู logs ใน local development
npm run dev
```

#### 2. ตรวจสอบ Database Connection
```bash
# ทดสอบการเชื่อมต่อ database
curl http://your-app-url/health/db
```

#### 3. ตรวจสอบ API Endpoint
```bash
# ทดสอบ workflow save API
node test-workflow-api.js
```

### 🚨 สาเหตุที่เป็นไปได้

#### 1. **Rate Limiting**
- **ปัญหา**: API ถูก rate limit
- **แก้ไข**: เราได้ยกเว้น workflow save API จาก rate limiting แล้ว
- **ตรวจสอบ**: ดู logs สำหรับ "Too Many Requests"

#### 2. **Database Connection Issues**
- **ปัญหา**: Database connection pool เต็มหรือ connection timeout
- **แก้ไข**: 
  ```javascript
  // ตรวจสอบใน db.js
  connectionLimit: 25, // เพิ่มจาก 10
  acquireTimeout: 60000,
  timeout: 60000
  ```

#### 3. **Request Size Limits**
- **ปัญหา**: Request body ใหญ่เกินไป
- **แก้ไข**: เพิ่มขนาด limit
  ```javascript
  const maxRequestSize = process.env.MAX_REQUEST_SIZE || '10mb';
  ```

#### 4. **Missing Required Data**
- **ปัญหา**: ข้อมูลที่จำเป็นหายไป
- **แก้ไข**: ตรวจสอบ validation ใน workflow.js
  ```javascript
  if (!customerData) throw new Error('Missing customer data');
  if (!productData) throw new Error('Missing product data');
  ```

#### 5. **Database Table Issues**
- **ปัญหา**: Table `legacy_deliveries` ไม่มีอยู่หรือไม่มี indexes
- **แก้ไข**: รัน database optimization script
  ```bash
  mysql -u username -p database_name < database-optimization.sql
  ```

### 🛠️ การแก้ไขทีละขั้นตอน

#### ขั้นตอนที่ 1: ตรวจสอบ Environment Variables
```bash
# ตรวจสอบใน Railway Dashboard
MYSQL_HOST=xxx
MYSQL_USER=xxx
MYSQL_PASSWORD=xxx
MYSQL_DATABASE=xxx
DB_POOL_LIMIT=25
```

#### ขั้นตอนที่ 2: ตรวจสอบ Database Tables
```sql
-- ตรวจสอบว่า table มีอยู่
SHOW TABLES LIKE 'legacy_deliveries';

-- ตรวจสอบ indexes
SHOW INDEX FROM legacy_deliveries;

-- ตรวจสอบข้อมูลใน table
SELECT COUNT(*) FROM legacy_deliveries;
```

#### ขั้นตอนที่ 3: ทดสอบ API โดยตรง
```javascript
// ใช้ test script
node test-workflow-api.js

// หรือใช้ curl
curl -X POST http://your-app-url/workflow/api/save-workflow \
  -H "Content-Type: application/json" \
  -d '{"customerData": {...}, "productData": {...}}'
```

#### ขั้นตอนที่ 4: ตรวจสอบ Frontend Data
```javascript
// ตรวจสอบใน browser console
console.log('Customer data:', customerData);
console.log('Product data:', productData);
console.log('Payment data:', paymentData);
```

### 📊 Debug Information

#### Server-side Logging
```javascript
// ใน workflow.js จะมี logs เหล่านี้:
console.log('🚀 Starting workflow save process...');
console.log('✅ Database connection OK');
console.log('✅ Generated delivery number: 0000170001');
console.log('🔍 Inserting 3 records...');
console.log('✅ Inserted record 1/3: ขาย - TEST001 - สินค้าทดสอบ');
```

#### Client-side Logging
```javascript
// ใน step5_content.ejs จะมี logs เหล่านี้:
console.log('Customer data being sent:', customerData);
console.log('Product data being sent:', productData);
console.log('Payment data being sent:', paymentData);
```

### 🔧 การแก้ไขเฉพาะเจาะจง

#### หากเป็น Database Connection Error
```javascript
// เพิ่มใน db.js
const config = {
  // ... existing config
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000
};
```

#### หากเป็น Rate Limiting
```javascript
// ใน server.js - เราได้ยกเว้นแล้ว
app.use('/api', (req, res, next) => {
  if (req.path.includes('/workflow/api/save-workflow')) {
    return next(); // Skip rate limiting
  }
  return rateLimit(req, res, next);
});
```

#### หากเป็น Request Size
```javascript
// เพิ่มขนาด limit
const maxRequestSize = process.env.MAX_REQUEST_SIZE || '20mb';
```

### 📞 การขอความช่วยเหลือ

เมื่อรายงานปัญหา กรุณาแนบข้อมูลต่อไปนี้:

1. **Server Logs**: จาก Railway logs
2. **Browser Console Logs**: จาก Developer Tools
3. **Network Tab**: จาก Developer Tools
4. **Environment Variables**: (ไม่รวม password)
5. **Database Status**: ผลลัพธ์จาก `/health/db`

### ✅ Checklist การแก้ไข

- [ ] ตรวจสอบ Railway logs
- [ ] ตรวจสอบ database connection
- [ ] ตรวจสอบ environment variables
- [ ] รัน database optimization script
- [ ] ทดสอบ API ด้วย test script
- [ ] ตรวจสอบ frontend data
- [ ] ตรวจสอบ rate limiting settings
- [ ] ตรวจสอบ request size limits

---

**หมายเหตุ**: ปัญหาส่วนใหญ่เกิดจากการเปลี่ยนแปลงใน optimization ที่เราเพิ่งทำ ให้ตรวจสอบตามลำดับข้างต้น
