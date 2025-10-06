# ✅ Railway Deployment Checklist

## ก่อน Deploy

- [ ] **บัญชี Railway** - สมัครที่ https://railway.app
- [ ] **GitHub Repository** - Push โปรเจคไปยัง GitHub (แนะนำ)
- [ ] **Environment Variables** - เตรียม SESSION_SECRET และอื่นๆ
- [ ] **Database Plan** - ตัดสินใจใช้ Railway MySQL หรือ External MySQL

## ไฟล์ที่จำเป็น

- [ ] `railway.json` ✅
- [ ] `Procfile` ✅  
- [ ] `env.example` ✅
- [ ] `package.json` (อัปเดตแล้ว) ✅
- [ ] `db.js` (อัปเดตแล้ว) ✅
- [ ] `.gitignore` (อัปเดตแล้ว) ✅

## ขั้นตอน Deploy

### 1. สร้างโปรเจคใน Railway
- [ ] ไปที่ https://railway.app
- [ ] คลิก "New Project"
- [ ] เลือก "Deploy from GitHub repo" หรือ "Deploy from local folder"

### 2. ตั้งค่า Database
- [ ] สร้าง MySQL service ใน Railway
- [ ] หรือเชื่อมต่อ External MySQL
- [ ] ตรวจสอบ connection details

### 3. ตั้งค่า Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET=your_secure_secret`
- [ ] Database variables (ถ้าใช้ External MySQL)

### 4. Deploy
- [ ] รอให้ build เสร็จ
- [ ] ตรวจสอบ deployment logs
- [ ] ทดสอบ health check endpoint

## หลัง Deploy

- [ ] **ทดสอบแอป** - ไปที่ URL ที่ Railway ให้
- [ ] **ตรวจสอบ Database** - ทดสอบการเชื่อมต่อ
- [ ] **ดู Logs** - ตรวจสอบว่าไม่มี error
- [ ] **ทดสอบ Features** - ล็อกอิน, CRUD operations
- [ ] **ตั้งค่า Custom Domain** (ถ้าต้องการ)

## การ Monitor

- [ ] ดู Metrics ใน Railway Dashboard
- [ ] ตั้งค่า Alerts (ถ้าต้องการ)
- [ ] Backup Database (ถ้าจำเป็น)

## การบำรุงรักษา

- [ ] อัปเดต Dependencies เป็นระยะ
- [ ] Monitor Usage และ Costs
- [ ] วางแผนอัปเกรด Plan (ถ้าจำเป็น)

## Troubleshooting

### ปัญหาที่พบบ่อย:
- [ ] **Database Connection** - ตรวจสอบ env vars
- [ ] **Build Failures** - ดู build logs
- [ ] **Memory Issues** - พิจารณาอัปเกรด plan
- [ ] **Sleep Mode** - อัปเกรดเป็น Pro plan

### การแก้ไข:
- [ ] ดู Logs ใน Railway Dashboard
- [ ] ตรวจสอบ Environment Variables
- [ ] ทดสอบ Local Development
- [ ] ดู Railway Documentation

---

**📝 หมายเหตุ:** ตรวจสอบทุกขั้นตอนให้ครบถ้วนก่อน deploy เพื่อหลีกเลี่ยงปัญหา

**🔗 ลิงก์ที่มีประโยชน์:**
- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Node.js on Railway: https://docs.railway.app/guides/nodejs
