const router = require('express').Router();
const Progress = require('./progress.model');
const Course = require('../courses/course.model');
const { certificateQueue } = require('../../services/queue.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, requireEnrollment } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');

router.use(protect);

// Get progress for a course
router.get('/:courseId', requireEnrollment, catchAsync(async (req, res) => {
  const progress = await Progress.findOne({ user: req.user._id, course: req.params.courseId })
    .populate('lastWatchedLesson', 'title')
    .populate('completedLessons', 'title');
  sendResponse(res, 200, { progress });
}));

// Update lesson progress
router.post('/:courseId/lessons/:lessonId', requireEnrollment, catchAsync(async (req, res) => {
  const { watchedSeconds, isCompleted } = req.body;
  const { courseId, lessonId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) throw new AppError('الكورس غير موجود', 404);

  let progress = await Progress.findOne({ user: req.user._id, course: courseId });

  if (!progress) {
    progress = await Progress.create({
      user: req.user._id,
      course: courseId,
      totalLessons: course.totalLessons,
    });
  }

  // Update lesson progress
  const lessonProgressIndex = progress.lessonProgress.findIndex(lp => lp.lesson?.toString() === lessonId);

  if (lessonProgressIndex >= 0) {
    progress.lessonProgress[lessonProgressIndex].watchedSeconds = Math.max(
      progress.lessonProgress[lessonProgressIndex].watchedSeconds,
      watchedSeconds || 0
    );
    if (isCompleted) progress.lessonProgress[lessonProgressIndex].isCompleted = true;
  } else {
    progress.lessonProgress.push({ lesson: lessonId, watchedSeconds: watchedSeconds || 0, isCompleted: !!isCompleted });
  }

  // Mark lesson as completed
  if (isCompleted && !progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }

  progress.lastWatchedLesson = lessonId;
  progress.lastWatchedAt = watchedSeconds || 0;
  progress.totalWatchTime += watchedSeconds || 0;

  // Calculate completion percentage
  progress.completionPercentage = progress.totalLessons > 0
    ? Math.round((progress.completedLessons.length / progress.totalLessons) * 100)
    : 0;

  // Check if course is completed
  if (progress.completionPercentage === 100 && !progress.isCompleted) {
    progress.isCompleted = true;
    progress.completedAt = new Date();
    // Queue certificate generation
    await certificateQueue.add('generate-cert', { userId: req.user._id, courseId });
  }

  await progress.save();
  sendResponse(res, 200, { progress }, 'تم تحديث التقدم بنجاح');
}));

module.exports = router;
