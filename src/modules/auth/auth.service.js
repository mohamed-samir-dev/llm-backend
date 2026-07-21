const authRepo = require('./auth.repository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { sendEmail, emailTemplates } = require('../../services/email.service');
const AppError = require('../../utils/AppError');
const redis = require('../../config/redis');
const config = require('../../config');
const User = require('../users/user.model');

const register = async ({ name, email, password, phone, deviceInfo }) => {
  const existing = await authRepo.findByEmail(email);
  if (existing) throw new AppError('البريد الإلكتروني مستخدم بالفعل', 400);

  const user = await authRepo.createUser({ name, email, password, phone });

  // Send verification email
  const token = await authRepo.setEmailVerificationToken(user._id);
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const template = emailTemplates.verifyEmail(name, verifyUrl);
  await sendEmail({ to: email, ...template });

  return user;
};

const login = async ({ email, password, deviceInfo }) => {
  const user = await authRepo.findByEmail(email);
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
  }
  if (user.isBanned) throw new AppError('تم حظر هذا الحساب', 403);
  if (!user.isEmailVerified) throw new AppError('يرجى تأكيد بريدك الإلكتروني أولاً', 401);

  // Device management - max 2 devices
  const { deviceId, fingerprint, ip, userAgent } = deviceInfo;
  const existingDevice = user.devices.find(d => d.deviceId === deviceId || d.fingerprint === fingerprint);

  if (!existingDevice) {
    if (user.devices.length >= config.maxDevices) {
      // Remove oldest device
      user.devices.sort((a, b) => a.lastLogin - b.lastLogin);
      user.devices.shift();
    }
    user.devices.push({ deviceId, fingerprint, ip, userAgent });
  } else {
    existingDevice.lastLogin = new Date();
    existingDevice.ip = ip;
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

const logout = async (userId, token) => {
  // Blacklist access token
  const decoded = require('jsonwebtoken').decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.setex(`blacklist:${token}`, ttl, '1');

  // Remove refresh token
  await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
};

const refreshAccessToken = async (refreshToken) => {
  const decoded = verifyRefreshToken(refreshToken);
  const user = await authRepo.findById(decoded.id);

  if (!user || !user.refreshTokens?.includes(refreshToken)) {
    throw new AppError('رمز التحديث غير صالح', 401);
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  // Rotate refresh token
  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const verifyEmail = async (token) => {
  const user = await authRepo.verifyEmailToken(token);
  if (!user) throw new AppError('رمز التحقق غير صالح أو منتهي الصلاحية', 400);

  await User.findByIdAndUpdate(user._id, {
    isEmailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
  });
};

const forgotPassword = async (email) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw new AppError('لا يوجد حساب بهذا البريد الإلكتروني', 404);

  const token = await authRepo.setPasswordResetToken(user._id);
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;
  const template = emailTemplates.resetPassword(user.name, resetUrl);
  await sendEmail({ to: email, ...template });
};

const resetPassword = async (token, newPassword) => {
  const user = await authRepo.findByPasswordResetToken(token);
  if (!user) throw new AppError('رمز إعادة التعيين غير صالح أو منتهي الصلاحية', 400);

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('كلمة المرور الحالية غير صحيحة', 400);
  }
  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();
};

module.exports = { register, login, logout, refreshAccessToken, verifyEmail, forgotPassword, resetPassword, changePassword };
