const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  fingerprint: String,
  ip: String,
  userAgent: String,
  lastLogin: { type: Date, default: Date.now },
}, { _id: false });

const guardianSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  relation: { type: String, enum: ['father', 'mother', 'other'], required: true },
  phone: { type: String, required: true },
  altPhone: { type: String },
  email: { type: String, lowercase: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Account info
  firstName:  { type: String, required: true, trim: true },
  fatherName: { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  name:       { type: String, trim: true }, // computed: firstName + fatherName + lastName
  email:      { type: String, required: true, unique: true, lowercase: true },
  phone:      { type: String, required: true, unique: true },
  password:   { type: String, required: true, select: false, minlength: 8 },

  // Student info
  grade:      { type: String, enum: ['grade1', 'grade2'], required: true },
  school:     { type: String, trim: true },
  governorate:{ type: String, required: true },
  city:       { type: String },
  educationType: { type: String, enum: ['arabic', 'languages'], required: true },
  gender:     { type: String, enum: ['male', 'female'], required: true },

  // Guardian info
  guardian: { type: guardianSchema, required: true },

  // Consents
  acceptTerms:         { type: Boolean, required: true },
  acceptPrivacy:       { type: Boolean, required: true },
  acceptNotifications: { type: Boolean, default: false },

  avatar: { publicId: String, url: String },
  role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },

  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },

  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  refreshTokens: [{ type: String, select: false }],
  devices: { type: [deviceSchema], default: [] },
  fcmTokens: [{ type: String }],

  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  certificates:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],
  wishlist:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  // Compute full name
  if (this.isModified('firstName') || this.isModified('fatherName') || this.isModified('lastName')) {
    this.name = `${this.firstName} ${this.fatherName} ${this.lastName}`;
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
