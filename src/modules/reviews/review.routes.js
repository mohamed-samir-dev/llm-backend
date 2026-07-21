const router = require('express').Router({ mergeParams: true });
const Review = require('./review.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, requireEnrollment } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');
const { paginate, paginateResponse } = require('../../helpers/pagination');

router.get('/', catchAsync(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [reviews, total] = await Promise.all([
    Review.find({ course: req.params.courseId, isApproved: true })
      .populate('user', 'name avatar')
      .skip(skip).limit(limit).sort({ createdAt: -1 }),
    Review.countDocuments({ course: req.params.courseId, isApproved: true }),
  ]);
  sendResponse(res, 200, paginateResponse(reviews, total, page, limit));
}));

router.post('/', protect, requireEnrollment, catchAsync(async (req, res) => {
  const existing = await Review.findOne({ user: req.user._id, course: req.params.courseId });
  if (existing) throw new AppError('لقد قمت بتقييم هذا الكورس مسبقاً', 400);

  const review = await Review.create({
    user: req.user._id,
    course: req.params.courseId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  sendResponse(res, 201, { review }, 'تم إضافة تقييمك بنجاح');
}));

router.delete('/:reviewId', protect, catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw new AppError('التقييم غير موجود', 404);
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('غير مصرح', 403);
  }
  await Review.findOneAndDelete({ _id: req.params.reviewId });
  sendResponse(res, 200, {}, 'تم حذف التقييم بنجاح');
}));

module.exports = router;
