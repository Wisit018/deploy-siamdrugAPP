# 🔧 Date Format Fix - Workflow Save Error

## ❌ ปัญหาที่พบ
```
❌ Failed to insert record 1: Error: Incorrect date value: '06-oct-25' for column 'date' at row 1
```

## 🔍 สาเหตุ
MySQL ไม่สามารถรับวันที่ในรูปแบบ `'06-oct-25'` ได้ เนื่องจาก:
1. ใช้ `toLocaleDateString()` ที่ให้รูปแบบวันที่ที่ไม่ถูกต้อง
2. ใช้ `'0000-00-00'` ที่อาจทำให้เกิดปัญหาใน MySQL

## ✅ การแก้ไข

### 1. แก้ไข Date Fields
```javascript
// ❌ เดิม - ใช้รูปแบบที่ไม่ถูกต้อง
date: (() => {
  const day = now.getDate().toString().padStart(2, '0');
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months[now.getMonth()];
  const year = now.getFullYear().toString().slice(-2);
  return `${day}-${month}-${year}`;
})(), // วันที่ทำรายการ 15-sep-25

// ✅ ใหม่ - ใช้รูปแบบ YYYY-MM-DD ที่ MySQL รองรับ
date: workDate, // วันที่ทำรายการในรูปแบบ YYYY-MM-DD ที่ MySQL รองรับ
```

### 2. แก้ไข Day Fields
```javascript
// ❌ เดิม - ใช้รูปแบบภาษาอังกฤษ
day: now.toLocaleDateString('en-US', { weekday: 'long' }), // วันทำรายการแบบ monday, tuesday, etc.

// ✅ ใหม่ - ใช้รูปแบบ YYYY-MM-DD
day: workDate, // วันทำรายการในรูปแบบ YYYY-MM-DD
```

### 3. แก้ไข Apptday และ Apptdate
```javascript
// ❌ เดิม - ใช้รูปแบบที่ไม่ถูกต้อง
apptday: (() => {
  if (deliveryData.day) {
    const deliveryDate = new Date(deliveryData.day);
    return deliveryDate.toLocaleDateString('en-US', { weekday: 'long' });
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
})(),

// ✅ ใหม่ - ใช้รูปแบบ YYYY-MM-DD
apptday: (() => {
  if (deliveryData.day) {
    const deliveryDate = new Date(deliveryData.day);
    return deliveryDate.toISOString().split('T')[0]; // ใช้รูปแบบ YYYY-MM-DD
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0]; // ใช้รูปแบบ YYYY-MM-DD
})(),
```

### 4. แก้ไข Invalid Date Values
```javascript
// ❌ เดิม - ใช้ '0000-00-00' ที่อาจทำให้เกิดปัญหา
aftdelida: '0000-00-00',
autobrt9da: '0000-00-00',
deliverda: '0000-00-00',
receiveda: '0000-00-00',
updateda: '0000-00-00',
prnorddate: '0000-00-00',
prnpicdate: '0000-00-00',
prnstidate: '0000-00-00',

// ✅ ใหม่ - ใช้ null แทน
aftdelida: null, // ใช้ null แทน '0000-00-00'
autobrt9da: null, // ใช้ null แทน '0000-00-00'
deliverda: null, // ใช้ null แทน '0000-00-00'
receiveda: null, // ใช้ null แทน '0000-00-00'
updateda: null, // ใช้ null แทน '0000-00-00'
prnorddate: null, // ใช้ null แทน '0000-00-00'
prnpicdate: null, // ใช้ null แทน '0000-00-00'
prnstidate: null, // ใช้ null แทน '0000-00-00'
```

## 📊 ผลลัพธ์ที่คาดหวัง

### ✅ หลังแก้ไข
- วันที่จะอยู่ในรูปแบบ `YYYY-MM-DD` (เช่น `2025-01-06`)
- ไม่มี `'0000-00-00'` ที่อาจทำให้เกิดปัญหา
- MySQL สามารถรับและบันทึกข้อมูลได้ปกติ

### 🔍 การตรวจสอบ
```sql
-- ตรวจสอบข้อมูลที่บันทึก
SELECT date, day, apptday, apptdate FROM legacy_deliveries ORDER BY id DESC LIMIT 5;
```

## 🚀 การทดสอบ

1. **ทดสอบ Step 5** ใน workflow
2. **ตรวจสอบ Logs** ใน Railway Dashboard
3. **ตรวจสอบ Database** ว่าข้อมูลบันทึกถูกต้อง

## 📝 หมายเหตุ

- ใช้ `workDate` ที่สร้างจาก `thaiDate.toISOString().split('T')[0]` ซึ่งให้รูปแบบ `YYYY-MM-DD`
- ใช้ `null` แทน `'0000-00-00'` สำหรับวันที่ที่ยังไม่ได้กำหนด
- รักษา timezone ไทย (UTC+7) ในการคำนวณวันที่

---

**การแก้ไขนี้จะทำให้ workflow save ทำงานได้ปกติโดยไม่มี date format error!** 🎯
