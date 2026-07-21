const courseService = require('./course.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');

const createCourse = catchAsync(async (req, res) => {
  const course = await courseService.createCourse(req.body, req.user._id);
  sendResponse(res, 201, { course }, 'تم إنشاء الكورس بنجاح');
});

const getCourses = catchAsync(async (req, res) => {
  const result = await courseService.getCourses(req.query);
  sendResponse(res, 200, result);
});

const getCourse = catchAsync(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);
  sendResponse(res, 200, { course });
});

const updateCourse = catchAsync(async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body, req.user._id, req.user.role);
  sendResponse(res, 200, { course }, 'تم تحديث الكورس بنجاح');
});

const deleteCourse = catchAsync(async (req, res) => {
  await courseService.deleteCourse(req.params.id, req.user._id, req.user.role);
  sendResponse(res, 200, {}, 'تم حذف الكورس بنجاح');
});

const uploadThumbnail = catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'fail', message: 'يرجى رفع صورة' });
  const course = await courseService.uploadCourseThumbnail(req.params.id, req.file, req.user._id, req.user.role);
  sendResponse(res, 200, { course }, 'تم رفع صورة الكورس بنجاح');
});

const uploadPreviewVideo = catchAsync(async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'fail', message: 'يرجى رفع فيديو' });
  const course = await courseService.uploadPreviewVideo(req.params.id, req.file, req.user._id, req.user.role);
  sendResponse(res, 200, { course }, 'تم رفع الفيديو التعريفي بنجاح');
});

const publishCourse = catchAsync(async (req, res) => {
  const course = await courseService.publishCourse(req.params.id, req.user._id, req.user.role);
  sendResponse(res, 200, { course }, 'تم نشر الكورس بنجاح');
});

module.exports = { createCourse, getCourses, getCourse, updateCourse, deleteCourse, uploadThumbnail, uploadPreviewVideo, publishCourse };
