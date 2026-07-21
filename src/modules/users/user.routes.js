const router = require('express').Router();
const userController = require('./user.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');
const { uploadImage } = require('../../middlewares/upload.middleware');

router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.patch('/profile/avatar', uploadImage.single('avatar'), userController.uploadAvatar);

// Admin routes
router.get('/', restrictTo('admin'), userController.getAllUsers);
router.patch('/:id/ban', restrictTo('admin'), userController.banUser);
router.patch('/:id/unban', restrictTo('admin'), userController.unbanUser);

module.exports = router;
