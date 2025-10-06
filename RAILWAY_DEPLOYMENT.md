# การ Deploy โปรเจค Siamdrug App บน Railway

## ข้อกำหนดเบื้องต้น
- บัญชี Railway (สมัครได้ที่ https://railway.app)
- โปรเจค Node.js + MySQL นี้

## ขั้นตอนการ Deploy

### 1. เตรียมโปรเจค
```bash
# Clone หรือ download โปรเจค
cd deploy-siamdrugAPP

# ติดตั้ง dependencies
npm install
```

### 2. สร้างบัญชีและเชื่อมต่อ Railway

1. ไปที่ https://railway.app
2. สมัครสมาชิก (ใช้ GitHub, Google, หรือ Email)
3. คลิก "New Project"
4. เลือก "Deploy from GitHub repo" (แนะนำ) หรือ "Deploy from local folder"

### 3. ตั้งค่า Database (MySQL)

#### วิธีที่ 1: ใช้ Railway MySQL Service (แนะนำ)
1. ในโปรเจค Railway ของคุณ คลิก "New Service"
2. เลือก "Database" > "MySQL"
3. Railway จะสร้าง MySQL database ให้อัตโนมัติ
4. คลิกที่ MySQL service เพื่อดู connection details

#### วิธีที่ 2: ใช้ External MySQL
- ใช้ PlanetScale, AWS RDS, หรือ MySQL hosting อื่นๆ
- ตั้งค่า environment variables เอง

### 4. ตั้งค่า Environment Variables

ใน Railway Dashboard:
1. ไปที่โปรเจคของคุณ
2. คลิก "Variables" tab
3. เพิ่ม environment variables ต่อไปนี้:

#### สำหรับ Railway MySQL Service:
```env
NODE_ENV=production
SESSION_SECRET=your_very_secure_session_secret_here
```

#### สำหรับ External MySQL:
```env
NODE_ENV=production
SESSION_SECRET=your_very_secure_session_secret_here
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database
DB_PORT=3306
```

### 5. Deploy โปรเจค

#### วิธีที่ 1: Deploy จาก GitHub (แนะนำ)
1. Push โปรเจคไปยัง GitHub repository
2. ใน Railway คลิก "New Project" > "Deploy from GitHub repo"
3. เลือก repository ของคุณ
4. Railway จะเริ่ม deploy อัตโนมัติ

#### วิธีที่ 2: Deploy จาก Local Folder
1. ติดตั้ง Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`

### 6. ตรวจสอบการ Deploy

1. ดู logs ใน Railway Dashboard
2. ตรวจสอบ health check: `https://your-app.railway.app/health`
3. เข้าถึงแอป: `https://your-app.railway.app`

### 7. ตั้งค่า Custom Domain (Optional)

1. ใน Railway Dashboard ไปที่ "Settings" > "Domains"
2. เพิ่ม custom domain ของคุณ
3. ตั้งค่า DNS records ตามที่ Railway แนะนำ

## การแก้ไขปัญหาที่พบบ่อย

### 1. Database Connection Error
```
Error: connect ECONNREFUSED
```
**วิธีแก้:**
- ตรวจสอบ environment variables
- ตรวจสอบว่า MySQL service กำลังทำงานอยู่
- ตรวจสอบ firewall และ network settings

### 2. Port Error
```
Error: listen EADDRINUSE
```
**วิธีแก้:**
- Railway จะกำหนด PORT environment variable อัตโนมัติ
- ตรวจสอบว่าโค้ดใช้ `process.env.PORT`

### 3. Memory Limit
```
Error: JavaScript heap out of memory
```
**วิธีแก้:**
- อัปเกรด plan เป็น Pro ($5/เดือน)
- หรือ optimize โค้ดให้ใช้ memory น้อยลง

### 4. Build Error
```
Error: npm ci failed
```
**วิธีแก้:**
- ตรวจสอบ package.json
- ตรวจสอบ Node.js version compatibility
- ดู build logs ใน Railway Dashboard

## การ Monitor และ Maintenance

### 1. ดู Logs
```bash
# ใช้ Railway CLI
railway logs

# หรือดูใน Dashboard > Deployments > View Logs
```

### 2. ดู Metrics
- ไปที่ Railway Dashboard > Metrics
- ดู CPU, Memory, และ Network usage

### 3. Backup Database
- Railway MySQL มี automatic backup
- หรือ export data ด้วย mysqldump

### 4. Scale Application
- Free plan: จำกัด CPU และ Memory
- Pro plan: สามารถ scale ได้ตามต้องการ

## การอัปเดตโปรเจค

1. Push การเปลี่ยนแปลงไปยัง GitHub
2. Railway จะ auto-deploy ถ้าเปิดใช้งาน
3. หรือ manual deploy ใน Dashboard

## ข้อจำกัดของ Free Plan

- **Usage Limit:** $5 credit/เดือน
- **Sleep Mode:** แอปจะหลับหลังจากไม่มีการใช้งาน
- **Custom Domain:** ไม่รองรับ
- **SSL Certificate:** ใช้ Railway subdomain

## การอัปเกรดเป็น Pro Plan

- **ราคา:** $5/เดือน
- **ประโยชน์:**
  - ไม่มี sleep mode
  - Custom domain
  - SSL certificate
  - Higher resource limits
  - Priority support

## สรุป

การ deploy บน Railway นั้นง่ายและรวดเร็ว โดยเฉพาะกับ Node.js และ MySQL การตั้งค่าที่สำคัญคือ:

1. ตั้งค่า environment variables ให้ถูกต้อง
2. ใช้ Railway MySQL service เพื่อความสะดวก
3. ตรวจสอบ logs เมื่อมีปัญหา
4. วางแผนอัปเกรด plan ตามความต้องการ

สำหรับการใช้งานจริง แนะนำให้อัปเกรดเป็น Pro plan เพื่อหลีกเลี่ยง sleep mode และเพิ่มประสิทธิภาพ
