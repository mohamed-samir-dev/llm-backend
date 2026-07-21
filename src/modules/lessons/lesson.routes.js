const router = require('express').Router({ mergeParams: true });
const lessonService = require('./lesson.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { uploadVideo } = require('../../middlewares/upload.middleware');

router.get('/', catchAsync(async (req, res) => {
  const lessons = await lessonService.getLessons(req.params.sectionId);
  sendResponse(res, 200, { lessons });
}));

// Secure video URL - requires auth
router.get('/:lessonId/video', protect, catchAsync(async (req, res) => {
  const data = await lessonService.getSecureVideoUrl(req.params.lessonId, req.user._id, req.user.role);
  sendResponse(res, 200, data);
}));

router.use(protect);

router.post('/', restrictTo('admin', 'instructor'), catchAsync(async (req, res) => {
  const lesson = await lessonService.createLesson(req.params.sectionId, req.body, req.user._id, req.user.role);
  sendResponse(res, 201, { lesson }, 'تم إنشاء الدرس بنجاح');
}));

router.patch('/:lessonId/video', restrictTo('admin', 'instructor'), uploadVideo.single('video'), catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'fail', message: 'يرجى رفع فيديو' });
  const lesson = await lessonService.uploadLessonVideo(req.params.lessonId, req.file, req.user._id, req.user.role);
  sendResponse(res, 200, { lesson }, 'تم رفع الفيديو بنجاح');
}));

module.exports = router;
