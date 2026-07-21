const { verifyAccessToken } = require('../utils/jwt');
const User = require('../modules/users/user.model');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const redis = require('../config/redis');

/**
 * Protect routes - verify JWT and attach user to request
 */
const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('غير مصرح. يرجى تسجيل الدخول', 401));
  }

  const token = authHeader.split(' ')[1];

  // Check if token is blacklisted (logged out)
  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) return next(new AppError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً', 401));

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id).select('+refreshTokens');

  if (!user) return next(new AppError('المستخدم غير موجود', 401));
  if (user.isBanned) return next(new AppError('تم حظر هذا الحساب', 403));
  if (!user.isActive) return next(new AppError('الحساب غير نشط', 401));

  req.user = user;
  req.token = token;
  next();
});

/**
 * Restrict access to specific roles
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('ليس لديك صلاحية للوصول إلى هذا المورد', 403));
  }
  next();
};

/**
 * Check if user owns the course (enrolled)
 */
const requireEnrollment = catchAsync(async (req, res, next) => {
  const courseId = req.params.courseId || req.params.id;
  const isEnrolled = req.user.enrolledCourses.some(id => id.toString() === courseId);
  const isAdmin = ['admin', 'instructor'].includes(req.user.role);

  if (!isEnrolled && !isAdmin) {
    return next(new AppError('يجب شراء الكورس أولاً للوصول إلى هذا المحتوى', 403));
  }
  next();
});

module.exports = { protect, restrictTo, requireEnrollment };
