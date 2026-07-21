const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty().withMessage('الاسم مطلوب').isLength({ min: 2, max: 50 }).withMessage('الاسم يجب أن يكون بين 2 و 50 حرف'),
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم'),
  body('phone').optional().isMobilePhone().withMessage('رقم الهاتف غير صالح'),
];

const loginValidator = [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail(),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail(),
];

const resetPasswordValidator = [
  body('password').isLength({ min: 8 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword').isLength({ min: 8 }).withMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم'),
];

module.exports = { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, changePasswordValidator };
