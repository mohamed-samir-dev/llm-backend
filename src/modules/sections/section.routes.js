const router = require('express').Router({ mergeParams: true });
const sectionService = require('./section.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

router.get('/', catchAsync(async (req, res) => {
  const sections = await sectionService.getSections(req.params.courseId);
  sendResponse(res, 200, { sections });
}));

router.use(protect);

router.post('/', restrictTo('admin', 'instructor'), catchAsync(async (req, res) => {
  const section = await sectionService.createSection(req.params.courseId, req.body, req.user._id, req.user.role);
  sendResponse(res, 201, { section }, 'تم إنشاء القسم بنجاح');
}));

router.patch('/:sectionId', restrictTo('admin', 'instructor'), catchAsync(async (req, res) => {
  const section = await sectionService.updateSection(req.params.sectionId, req.body, req.user._id, req.user.role);
  sendResponse(res, 200, { section }, 'تم تحديث القسم بنجاح');
}));

router.delete('/:sectionId', restrictTo('admin', 'instructor'), catchAsync(async (req, res) => {
  await sectionService.deleteSection(req.params.sectionId, req.user._id, req.user.role);
  sendResponse(res, 200, {}, 'تم حذف القسم بنجاح');
}));

module.exports = router;
