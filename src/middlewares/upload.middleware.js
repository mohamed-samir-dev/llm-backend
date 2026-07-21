const multer = require('multer');
const AppError = require('../utils/AppError');

// Use memory storage - files go directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`نوع الملف غير مسموح به. الأنواع المسموحة: ${allowedTypes.join(', ')}`, 400), false);
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});

const uploadVideo = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: fileFilter(['video/mp4', 'video/webm', 'video/quicktime']),
});

const uploadPDF = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter(['application/pdf']),
});

const uploadAny = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = { uploadImage, uploadVideo, uploadPDF, uploadAny };
