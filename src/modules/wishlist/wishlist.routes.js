const router = require('express').Router();
const User = require('../users/user.model');
const Course = require('../courses/course.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'title thumbnail slug price rating totalStudents');
  sendResponse(res, 200, { wishlist: user.wishlist });
}));

router.post('/:courseId', catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new AppError('الكورس غير موجود', 404);

  const user = await User.findById(req.user._id);
  if (user.wishlist.includes(req.params.courseId)) {
    throw new AppError('الكورس موجود بالفعل في قائمة الرغبات', 400);
  }

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: req.params.courseId } });
  sendResponse(res, 200, {}, 'تم إضافة الكورس إلى قائمة الرغبات');
}));

router.delete('/:courseId', catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.courseId } });
  sendResponse(res, 200, {}, 'تم إزالة الكورس من قائمة الرغبات');
}));

module.exports = router;
