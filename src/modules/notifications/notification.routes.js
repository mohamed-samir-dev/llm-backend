const router = require('express').Router();
const Notification = require('./notification.model');
const User = require('../users/user.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect } = require('../../middlewares/auth.middleware');
const { paginate, paginateResponse } = require('../../helpers/pagination');

router.use(protect);

router.get('/', catchAsync(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  sendResponse(res, 200, { ...paginateResponse(notifications, total, page, limit), unreadCount });
}));

router.patch('/:id/read', catchAsync(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
  sendResponse(res, 200, {}, 'تم تحديد الإشعار كمقروء');
}));

router.patch('/read-all', catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  sendResponse(res, 200, {}, 'تم تحديد جميع الإشعارات كمقروءة');
}));

// Register FCM token
router.post('/fcm-token', catchAsync(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ status: 'fail', message: 'الرمز مطلوب' });
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { fcmTokens: token } });
  sendResponse(res, 200, {}, 'تم تسجيل رمز الإشعارات');
}));

module.exports = router;
