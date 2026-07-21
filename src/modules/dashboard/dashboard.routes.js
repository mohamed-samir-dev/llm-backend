const router = require('express').Router();
const User = require('../users/user.model');
const Course = require('../courses/course.model');
const Order = require('../orders/order.model');
const Progress = require('../progress/progress.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const redis = require('../../config/redis');

router.use(protect, restrictTo('admin', 'instructor'));

router.get('/stats', catchAsync(async (req, res) => {
  const cacheKey = `dashboard:stats:${req.user._id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return sendResponse(res, 200, JSON.parse(cached));

  const instructorFilter = req.user.role === 'instructor' ? { instructor: req.user._id } : {};

  const [
    totalStudents,
    totalCourses,
    totalOrders,
    revenueData,
    topCourses,
    recentOrders,
    monthlyRevenue,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Course.countDocuments(instructorFilter),
    Order.countDocuments({ status: 'completed' }),

    Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),

    Course.find(instructorFilter)
      .sort({ totalStudents: -1 })
      .limit(5)
      .select('title totalStudents rating thumbnail'),

    Order.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email avatar'),

    Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]),
  ]);

  const stats = {
    totalStudents,
    totalCourses,
    totalOrders,
    totalRevenue: revenueData[0]?.total || 0,
    topCourses,
    recentOrders,
    monthlyRevenue,
  };

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify({ stats }));
  sendResponse(res, 200, { stats });
}));

// Instructor's own course stats
router.get('/my-courses', catchAsync(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id })
    .select('title totalStudents rating totalReviews isPublished createdAt thumbnail');
  sendResponse(res, 200, { courses });
}));

module.exports = router;
