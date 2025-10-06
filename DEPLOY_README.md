# 🚀 การ Deploy Siamdrug App บน Railway

## ไฟล์ที่เพิ่มเข้ามาสำหรับการ Deploy

### 1. ไฟล์การตั้งค่า Railway
- `railway.json` - การตั้งค่า Railway deployment
- `Procfile` - กำหนด startup command
- `env.example` - ตัวอย่าง environment variables

### 2. ไฟล์คำแนะนำ
- `RAILWAY_DEPLOYMENT.md` - คำแนะนำการ deploy แบบละเอียด
- `DEPLOY_README.md` - ไฟล์นี้ (สรุปการ deploy)

### 3. ไฟล์ Scripts
- `deploy-railway.sh` - Script สำหรับ Linux/Mac
- `deploy-railway.bat` - Script สำหรับ Windows

### 4. ไฟล์ที่อัปเดต
- `package.json` - เพิ่ม production scripts
- `db.js` - รองรับ Railway MySQL environment variables
- `.gitignore` - เพิ่มไฟล์ที่ไม่ควร commit

## 🚀 วิธี Deploy แบบเร็ว

### วิธีที่ 1: ใช้ Script (แนะนำ)
```bash
# Linux/Mac
chmod +x deploy-railway.sh
./deploy-railway.sh

# Windows
deploy-railway.bat
```

### วิธีที่ 2: Manual Deploy
1. **ติดตั้ง Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login Railway:**
   ```bash
   railway login
   ```

3. **สร้าง .env file:**
   ```bash
   cp env.example .env
   # แก้ไข .env ตามต้องการ
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

### วิธีที่ 3: Deploy จาก GitHub
1. Push โปรเจคไปยัง GitHub
2. ไปที่ https://railway.app
3. สร้างโปรเจคใหม่ > Deploy from GitHub repo
4. เลือก repository ของคุณ

## 🗄️ การตั้งค่า Database

### ใช้ Railway MySQL (แนะนำ)
1. ใน Railway Dashboard คลิก "New Service"
2. เลือก "Database" > "MySQL"
3. Railway จะสร้าง MySQL ให้อัตโนมัติ
4. Environment variables จะถูกตั้งค่าอัตโนมัติ

### ใช้ External MySQL
ตั้งค่า environment variables ใน Railway Dashboard:
```env
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database
DB_PORT=3306
```

## ⚙️ Environment Variables ที่ต้องตั้งค่า

### จำเป็น:
```env
NODE_ENV=production
SESSION_SECRET=your_very_secure_session_secret_here
```

### สำหรับ Railway MySQL (อัตโนมัติ):
```env
MYSQL_HOST=xxx.railway.app
MYSQL_USER=root
MYSQL_PASSWORD=xxx
MYSQL_DATABASE=railway
MYSQL_PORT=3306
```

## 🔍 การตรวจสอบการ Deploy

1. **ดู Logs:**
   ```bash
   railway logs
   ```

2. **ตรวจสอบ Health Check:**
   - ไปที่ `https://your-app.railway.app/health`

3. **เข้าใช้แอป:**
   - ไปที่ `https://your-app.railway.app`

## 🆘 การแก้ไขปัญหาที่พบบ่อย

### 1. Database Connection Error
- ตรวจสอบ environment variables
- ตรวจสอบว่า MySQL service ทำงานอยู่

### 2. Build Error
- ตรวจสอบ Node.js version (ต้อง >= 18)
- ดู build logs ใน Railway Dashboard

### 3. Port Error
- Railway จะกำหนด PORT อัตโนมัติ
- ตรวจสอบว่าโค้ดใช้ `process.env.PORT`

## 💰 ข้อจำกัด Free Plan

- **Usage:** $5 credit/เดือน
- **Sleep Mode:** แอปจะหลับเมื่อไม่ใช้งาน
- **Custom Domain:** ไม่รองรับ
- **Resource Limits:** CPU และ Memory จำกัด

## 🔄 การอัปเดตโปรเจค

1. Push การเปลี่ยนแปลงไปยัง GitHub
2. Railway จะ auto-deploy (ถ้าเปิดใช้งาน)
3. หรือ manual deploy ด้วย `railway up`

## 📞 การขอความช่วยเหลือ

1. ดู logs ใน Railway Dashboard
2. ตรวจสอบ `RAILWAY_DEPLOYMENT.md` สำหรับคำแนะนำละเอียด
3. ดู Railway Documentation: https://docs.railway.app

---

**🎉 พร้อม Deploy แล้ว!** เลือกวิธีที่สะดวกที่สุดและเริ่มต้นได้เลย
