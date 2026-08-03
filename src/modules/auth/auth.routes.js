const router = require('express').Router();
const authController = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  registerValidator, loginValidator, forgotPasswordValidator,
  resetPasswordValidator, changePasswordValidator,
} = require('./auth.validator');

router.post('/check-availability', authController.checkAvailability);
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.patch('/reset-password/:token', resetPasswordValidator, validate, authController.resetPassword);
router.patch('/change-password', protect, changePasswordValidator, validate, authController.changePassword);

module.exports = router;
