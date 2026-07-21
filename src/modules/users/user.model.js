const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const deviceSchema = new mongoose.Schema({
  deviceId: String,
  fingerprint: String,
  ip: String,
  userAgent: String,
  lastLogin: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false, minlength: 8 },
  phone: { type: String },
  avatar: {
    publicId: String,
    url: String,
  },
  country: { type: String },
  role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },

  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },

  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },

  refreshTokens: [{ type: String, select: false }],

  // Device management (max 2 devices)
  devices: { type: [deviceSchema], default: [] },

  // FCM tokens for push notifications
  fcmTokens: [{ type: String }],

  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],

  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
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
