const authService = require('./auth.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');

const getDeviceInfo = (req) => ({
  deviceId: req.headers['x-device-id'] || req.ip,
  fingerprint: req.headers['x-fingerprint'] || '',
  ip: req.ip,
  userAgent: req.headers['user-agent'] || '',
});

const checkAvailability = catchAsync(async (req, res) => {
  const { email, phone } = req.body;
  const errors = {};
  if (email) {
    const existing = await authService.checkFieldExists('email', email);
    if (existing) errors.email = 'البريد الإلكتروني مستخدم من قبل';
  }
  if (phone) {
    const existing = await authService.checkFieldExists('phone', phone);
    if (existing) errors.phone = 'رقم الهاتف مستخدم من قبل';
  }
  sendResponse(res, 200, { errors }, '');
});

const register = catchAsync(async (req, res) => {
  const user = await authService.register({ ...req.body, deviceInfo: getDeviceInfo(req) });
  sendResponse(res, 201, { user }, 'تم إنشاء الحساب بنجاح');
});

const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login({ ...req.body, deviceInfo: getDeviceInfo(req) });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, 200, { user, accessToken }, 'تم تسجيل الدخول بنجاح');
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user._id, req.token);
  res.clearCookie('refreshToken');
  sendResponse(res, 200, {}, 'تم تسجيل الخروج بنجاح');
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ status: 'fail', message: 'رمز التحديث مطلوب' });

  const tokens = await authService.refreshAccessToken(token);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, 200, { accessToken: tokens.accessToken }, 'تم تجديد الرمز بنجاح');
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  sendResponse(res, 200, {}, 'تم تأكيد البريد الإلكتروني بنجاح');
});

const resendVerification = catchAsync(async (req, res) => {
  await authService.resendVerification(req.body.email);
  sendResponse(res, 200, {}, 'تم إرسال رابط التحقق مرة أخرى');
});

const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  sendResponse(res, 200, {}, 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  sendResponse(res, 200, {}, 'تم إعادة تعيين كلمة المرور بنجاح');
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  sendResponse(res, 200, {}, 'تم تغيير كلمة المرور بنجاح');
});

module.exports = { checkAvailability, register, login, logout, refreshToken, verifyEmail, resendVerification, forgotPassword, resetPassword, changePassword };
