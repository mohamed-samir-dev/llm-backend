const userService = require('./user.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  sendResponse(res, 200, { user });
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  sendResponse(res, 200, { user }, 'تم تحديث الملف الشخصي بنجاح');
});

const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'fail', message: 'يرجى رفع صورة' });
  const user = await userService.uploadAvatar(req.user._id, req.file);
  sendResponse(res, 200, { user }, 'تم رفع الصورة الشخصية بنجاح');
});

// Admin only
const getAllUsers = catchAsync(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  sendResponse(res, 200, result);
});

const banUser = catchAsync(async (req, res) => {
  await userService.banUser(req.params.id);
  sendResponse(res, 200, {}, 'تم حظر المستخدم');
});

const unbanUser = catchAsync(async (req, res) => {
  await userService.unbanUser(req.params.id);
  sendResponse(res, 200, {}, 'تم رفع الحظر عن المستخدم');
});

module.exports = { getProfile, updateProfile, uploadAvatar, getAllUsers, banUser, unbanUser };
