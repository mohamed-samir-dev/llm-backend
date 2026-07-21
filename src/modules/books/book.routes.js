const router = require('express').Router();
const Book = require('./book.model');
const { uploadToCloudinary, deleteFromCloudinary, generateSignedUrl } = require('../../services/cloudinary.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');
const { uploadImage, uploadPDF, uploadAny } = require('../../middlewares/upload.middleware');
const { paginate, paginateResponse } = require('../../helpers/pagination');

router.get('/', catchAsync(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { isPublished: true };
  if (req.query.category) filter.category = req.query.category;
  const [books, total] = await Promise.all([
    Book.find(filter).select('-pdf').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Book.countDocuments(filter),
  ]);
  sendResponse(res, 200, paginateResponse(books, total, page, limit));
}));

router.get('/:id/download', protect, catchAsync(async (req, res) => {
  const book = await Book.findById(req.params.id).select('+pdf.publicId');
  if (!book) throw new AppError('الكتاب غير موجود', 404);
  if (!book.isFree && req.user.role === 'student') {
    // Check if user purchased the book
    const Order = require('../orders/order.model');
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.item': book._id,
      status: 'completed',
    });
    if (!hasPurchased) throw new AppError('يجب شراء الكتاب أولاً', 403);
  }

  const signedUrl = generateSignedUrl(book.pdf.publicId, 'raw', 3600);
  await Book.findByIdAndUpdate(req.params.id, { $inc: { totalDownloads: 1 } });
  sendResponse(res, 200, { url: signedUrl, expiresIn: 3600 });
}));

router.use(protect, restrictTo('admin', 'instructor'));

router.post('/', catchAsync(async (req, res) => {
  const book = await Book.create({ ...req.body, instructor: req.user._id });
  sendResponse(res, 201, { book }, 'تم إنشاء الكتاب بنجاح');
}));

router.patch('/:id/cover', uploadImage.single('cover'), catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'fail', message: 'يرجى رفع صورة' });
  const result = await uploadToCloudinary(req.file.buffer, { folder: 'books/covers' });
  const book = await Book.findByIdAndUpdate(req.params.id, {
    coverImage: { publicId: result.public_id, url: result.secure_url },
  }, { new: true });
  sendResponse(res, 200, { book }, 'تم رفع صورة الغلاف بنجاح');
}));

router.patch('/:id/pdf', uploadPDF.single('pdf'), catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'fail', message: 'يرجى رفع ملف PDF' });
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'books/pdfs',
    resource_type: 'raw',
    type: 'authenticated',
  });
  const book = await Book.findByIdAndUpdate(req.params.id, {
    'pdf.publicId': result.public_id,
    'pdf.secureUrl': result.secure_url,
    'pdf.size': result.bytes,
  }, { new: true });
  sendResponse(res, 200, { book }, 'تم رفع ملف PDF بنجاح');
}));

module.exports = router;
