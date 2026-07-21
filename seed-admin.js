/**
 * سكريبت إنشاء حساب الأدمن
 * شغّله مرة واحدة بس:
 *   node seed-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_NAME  = 'المدير';
const ADMIN_EMAIL = 'admin@platform.com';
const ADMIN_PASS  = 'Admin123456';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ اتصل بالداتابيز');

  // تعريف المودل مباشرة عشان منحتاجش نلود كل الملفات
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    name:             String,
    email:            { type: String, unique: true },
    password:         String,
    role:             { type: String, default: 'student' },
    isEmailVerified:  { type: Boolean, default: false },
    isActive:         { type: Boolean, default: true },
    devices:          { type: Array, default: [] },
    refreshTokens:    { type: Array, default: [] },
    enrolledCourses:  { type: Array, default: [] },
    certificates:     { type: Array, default: [] },
    wishlist:         { type: Array, default: [] },
  }, { timestamps: true }));

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('⚠️  الأدمن موجود بالفعل:', ADMIN_EMAIL);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASS, 12);
  await User.create({
    name:            ADMIN_NAME,
    email:           ADMIN_EMAIL,
    password:        hashed,
    role:            'admin',
    isEmailVerified: true,
    isActive:        true,
  });

  console.log('🎉 تم إنشاء حساب الأدمن بنجاح!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 البريد   :', ADMIN_EMAIL);
  console.log('🔑 كلمة المرور:', ADMIN_PASS);
  console.log('🔗 رابط الدخول: http://localhost:3000/admin/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  غيّر كلمة المرور بعد أول دخول!');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ خطأ:', err.message); process.exit(1); });
