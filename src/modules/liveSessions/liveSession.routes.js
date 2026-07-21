const router = require('express').Router();
const LiveSession = require('./liveSession.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');
const { liveReminderQueue } = require('../../services/queue.service');
const { paginate, paginateResponse } = require('../../helpers/pagination');

router.get('/', catchAsync(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { status: { $in: ['scheduled', 'live'] } };
  const [sessions, total] = await Promise.all([
    LiveSession.find(filter).populate('instructor', 'name avatar').skip(skip).limit(limit).sort({ startDate: 1 }),
    LiveSession.countDocuments(filter),
  ]);
  sendResponse(res, 200, paginateResponse(sessions, total, page, limit));
}));

router.use(protect);

router.post('/', restrictTo('admin', 'instructor'), catchAsync(async (req, res) => {
  const session = await LiveSession.create({ ...req.body, instructor: req.user._id });

  // Schedule reminder 5 minutes before
  const reminderDelay = new Date(session.startDate).getTime() - Date.now() - 5 * 60 * 1000;
  if (reminderDelay > 0) {
    await liveReminderQueue.add('reminder', { sessionId: session._id }, { delay: reminderDelay });
  }

  sendResponse(res, 201, { session }, 'تم إنشاء الجلسة المباشرة بنجاح');
}));

router.post('/:id/register', catchAsync(async (req, res) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) throw new AppError('الجلسة غير موجودة', 404);
  if (session.status !== 'scheduled') throw new AppError('لا يمكن التسجيل في هذه الجلسة', 400);

  if (session.registeredStudents.includes(req.user._id)) {
    throw new AppError('أنت مسجل بالفعل في هذه الجلسة', 400);
  }

  await LiveSession.findByIdAndUpdate(req.params.id, {
    $addToSet: { registeredStudents: req.user._id },
  });

  sendResponse(res, 200, {}, 'تم التسجيل في الجلسة المباشرة بنجاح');
}));

router.patch('/:id/status', restrictTo('admin', 'instructor'), catchAsync(async (req, res) => {
  const session = await LiveSession.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  sendResponse(res, 200, { session }, 'تم تحديث حالة الجلسة');
}));

module.exports = router;
