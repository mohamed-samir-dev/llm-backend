const router = require('express').Router();
const courseController = require('./course.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { uploadImage, uploadVideo } = require('../../middlewares/upload.middleware');

// Public routes
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);

// Protected routes
router.use(protect);
router.post('/', restrictTo('admin', 'instructor'), courseController.createCourse);
router.patch('/:id', restrictTo('admin', 'instructor'), courseController.updateCourse);
router.delete('/:id', restrictTo('admin', 'instructor'), courseController.deleteCourse);
router.patch('/:id/thumbnail', restrictTo('admin', 'instructor'), uploadImage.single('thumbnail'), courseController.uploadThumbnail);
router.patch('/:id/preview-video', restrictTo('admin', 'instructor'), uploadVideo.single('video'), courseController.uploadPreviewVideo);
router.patch('/:id/publish', restrictTo('admin', 'instructor'), courseController.publishCourse);

module.exports = router;
