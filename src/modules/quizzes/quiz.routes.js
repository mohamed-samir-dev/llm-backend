const router = require('express').Router({ mergeParams: true });
const { Quiz, QuizAttempt } = require('./quiz.model');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo, requireEnrollment } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');

router.get('/', protect, requireEnrollment, catchAsync(async (req, res) => {
  const quizzes = await Quiz.find({ course: req.params.courseId, isPublished: true })
    .select('-questions.options.isCorrect -questions.correctAnswer');
  sendResponse(res, 200, { quizzes });
}));

router.post('/', protect, restrictTo('admin', 'instructor'), catchAsync(async (req, res) => {
  const quiz = await Quiz.create({ ...req.body, course: req.params.courseId });
  sendResponse(res, 201, { quiz }, 'تم إنشاء الاختبار بنجاح');
}));

// Submit quiz attempt
router.post('/:quizId/submit', protect, requireEnrollment, catchAsync(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) throw new AppError('الاختبار غير موجود', 404);

  // Check max attempts
  const attemptCount = await QuizAttempt.countDocuments({ user: req.user._id, quiz: quiz._id });
  if (attemptCount >= quiz.maxAttempts) {
    throw new AppError(`لقد استنفدت جميع محاولاتك (${quiz.maxAttempts})`, 400);
  }

  // Grade answers
  const { answers } = req.body;
  let totalPoints = 0;
  let earnedPoints = 0;
  const gradedAnswers = [];

  for (const question of quiz.questions) {
    totalPoints += question.points;
    const userAnswer = answers.find(a => a.questionId === question._id.toString());
    let isCorrect = false;

    if (question.type === 'multiple_choice') {
      const correctOption = question.options.find(o => o.isCorrect);
      isCorrect = correctOption?.text === userAnswer?.answer;
    } else if (question.type === 'true_false') {
      isCorrect = question.correctAnswer === userAnswer?.answer;
    }

    if (isCorrect) earnedPoints += question.points;
    gradedAnswers.push({ question: question._id, answer: userAnswer?.answer, isCorrect, points: isCorrect ? question.points : 0 });
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = percentage >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    user: req.user._id,
    quiz: quiz._id,
    answers: gradedAnswers,
    score: earnedPoints,
    percentage,
    passed,
    attemptNumber: attemptCount + 1,
    completedAt: new Date(),
  });

  sendResponse(res, 200, { attempt, passed, percentage, score: earnedPoints, totalPoints }, passed ? 'أحسنت! لقد اجتزت الاختبار' : 'لم تجتز الاختبار. حاول مرة أخرى');
}));

module.exports = router;
