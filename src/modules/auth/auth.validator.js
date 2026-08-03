const { body } = require('express-validator');
const User = require('../users/user.model');

const egyptPhone = /^(010|011|012|015)\d{8}$/;
const nameRegex  = /^[\u0600-\u06FFa-zA-Z\s]+$/;
const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

const registerValidator = [
  // Step 1 – Account
  body('firstName').trim().notEmpty().withMessage('الاسم الأول مطلوب')
    .isLength({ min: 3 }).withMessage('الاسم الأول لا يقل عن 3 أحرف')
    .matches(nameRegex).withMessage('الاسم الأول لا يحتوي على أرقام أو رموز'),

  body('fatherName').trim().notEmpty().withMessage('اسم الأب مطلوب')
    .isLength({ min: 3 }).withMessage('اسم الأب لا يقل عن 3 أحرف')
    .matches(nameRegex).withMessage('اسم الأب لا يحتوي على أرقام أو رموز'),

  body('lastName').trim().notEmpty().withMessage('اسم العائلة مطلوب')
    .isLength({ min: 3 }).withMessage('اسم العائلة لا يقل عن 3 أحرف')
    .matches(nameRegex).withMessage('اسم العائلة لا يحتوي على أرقام أو رموز'),

  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail()
    .custom(async (email) => {
      const exists = await User.findOne({ email });
      if (exists) throw new Error('البريد الإلكتروني مستخدم بالفعل');
    }),

  body('phone').notEmpty().withMessage('رقم هاتف الطالب مطلوب')
    .matches(egyptPhone).withMessage('رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 010/011/012/015')
    .custom(async (phone) => {
      const exists = await User.findOne({ phone });
      if (exists) throw new Error('رقم الهاتف مستخدم بالفعل');
    }),

  body('password').isLength({ min: 8 }).withMessage('كلمة المرور 8 أحرف على الأقل')
    .matches(strongPass).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز'),

  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('كلمة المرور غير متطابقة');
    return true;
  }),

  // Step 2 – Student
  body('grade').isIn(['grade1', 'grade2']).withMessage('الصف الدراسي غير صالح'),
  body('school').optional().trim(),
  body('governorate').notEmpty().withMessage('المحافظة مطلوبة'),
  body('city').optional().trim(),
  body('educationType').isIn(['arabic', 'languages']).withMessage('نوع التعليم غير صالح'),
  body('gender').isIn(['male', 'female']).withMessage('الجنس غير صالح'),

  // Step 3 – Guardian
  body('guardian.fullName').trim().notEmpty().withMessage('اسم ولي الأمر مطلوب')
    .isLength({ min: 3 }).withMessage('اسم ولي الأمر لا يقل عن 3 أحرف')
    .matches(nameRegex).withMessage('اسم ولي الأمر لا يحتوي على أرقام أو رموز'),

  body('guardian.relation').isIn(['father', 'mother', 'other']).withMessage('صلة القرابة غير صالحة'),

  body('guardian.phone').notEmpty().withMessage('رقم هاتف ولي الأمر مطلوب')
    .matches(egyptPhone).withMessage('رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 010/011/012/015')
    .custom((guardianPhone, { req }) => {
      if (guardianPhone === req.body.phone) throw new Error('رقم هاتف ولي الأمر يجب أن يختلف عن رقم الطالب');
      return true;
    }),

  body('guardian.altPhone').optional()
    .matches(egyptPhone).withMessage('رقم الهاتف البديل غير صالح')
    .custom((altPhone, { req }) => {
      if (altPhone && altPhone === req.body.phone) throw new Error('الرقم البديل يجب أن يختلف عن رقم الطالب');
      return true;
    }),

  body('guardian.email').optional().isEmail().withMessage('البريد الإلكتروني لولي الأمر غير صالح').normalizeEmail(),

  // Consents
  body('acceptTerms').equals('true').withMessage('يجب الموافقة على الشروط والأحكام'),
  body('acceptPrivacy').equals('true').withMessage('يجب الموافقة على سياسة الخصوصية'),
  body('acceptNotifications').optional().isBoolean(),
];

const loginValidator = [
  body('phone').notEmpty().withMessage('رقم الهاتف مطلوب')
    .matches(egyptPhone).withMessage('رقم الهاتف غير صالح'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صالح').normalizeEmail(),
];

const resetPasswordValidator = [
  body('password').isLength({ min: 8 }).withMessage('كلمة المرور 8 أحرف على الأقل')
    .matches(strongPass).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword').isLength({ min: 8 }).withMessage('كلمة المرور الجديدة 8 أحرف على الأقل')
    .matches(strongPass).withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز'),
];

module.exports = { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, changePasswordValidator };
