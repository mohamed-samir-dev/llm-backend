const AppError = require('../utils/AppError');
const config = require('../config');

const handleCastErrorDB = (err) => new AppError(`قيمة غير صالحة: ${err.path}`, 400);
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} مستخدم بالفعل. يرجى اختيار قيمة أخرى`, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(e => e.message);
  return new AppError(`بيانات غير صالحة: ${errors.join('. ')}`, 400);
};
const handleJWTError = () => new AppError('رمز المصادقة غير صالح. يرجى تسجيل الدخول مجدداً', 401);
const handleJWTExpiredError = () => new AppError('انتهت صلاحية رمز المصادقة. يرجى تسجيل الدخول مجدداً', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ status: err.status, message: err.message });
  } else {
    console.error('💥 UNEXPECTED ERROR:', err);
    res.status(500).json({ status: 'error', message: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً' });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.env === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};
