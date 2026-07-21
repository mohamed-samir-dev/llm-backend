const router = require('express').Router();

const authRoutes        = require('../modules/auth/auth.routes');
const userRoutes        = require('../modules/users/user.routes');
const courseRoutes      = require('../modules/courses/course.routes');
const sectionRoutes     = require('../modules/sections/section.routes');
const lessonRoutes      = require('../modules/lessons/lesson.routes');
const bookRoutes        = require('../modules/books/book.routes');
const liveSessionRoutes = require('../modules/liveSessions/liveSession.routes');
const orderRoutes       = require('../modules/orders/order.routes');
const paymentRoutes     = require('../modules/payments/payment.routes');
const notificationRoutes= require('../modules/notifications/notification.routes');
const certificateRoutes = require('../modules/certificates/certificate.routes');
const quizRoutes        = require('../modules/quizzes/quiz.routes');
const reviewRoutes      = require('../modules/reviews/review.routes');
const progressRoutes    = require('../modules/progress/progress.routes');
const wishlistRoutes    = require('../modules/wishlist/wishlist.routes');
const dashboardRoutes   = require('../modules/dashboard/dashboard.routes');
const uploadsRoutes     = require('../modules/uploads/uploads.routes');

// ─── Mount Routes ─────────────────────────────────────────────────────────────
router.use('/auth',           authRoutes);
router.use('/users',          userRoutes);
router.use('/courses',        courseRoutes);

// Nested: /courses/:courseId/sections/:sectionId/lessons
router.use('/courses/:courseId/sections',                        sectionRoutes);
router.use('/courses/:courseId/sections/:sectionId/lessons',     lessonRoutes);
router.use('/courses/:courseId/reviews',                         reviewRoutes);
router.use('/courses/:courseId/quizzes',                         quizRoutes);

router.use('/books',          bookRoutes);
router.use('/live-sessions',  liveSessionRoutes);
router.use('/orders',         orderRoutes);
router.use('/payments',       paymentRoutes);
router.use('/notifications',  notificationRoutes);
router.use('/certificates',   certificateRoutes);
router.use('/progress',       progressRoutes);
router.use('/wishlist',       wishlistRoutes);
router.use('/dashboard',      dashboardRoutes);
router.use('/uploads',        uploadsRoutes);

module.exports = router;
