const Lesson = require('./lesson.model');
const Section = require('../sections/section.model');
const Course = require('../courses/course.model');
const { uploadToCloudinary, deleteFromCloudinary, generateSignedUrl } = require('../../services/cloudinary.service');
const AppError = require('../../utils/AppError');

const createLesson = async (sectionId, data, userId, role) => {
  const section = await Section.findById(sectionId).populate('course');
  if (!section) throw new AppError('القسم غير موجود', 404);
  if (role !== 'admin' && section.course.instructor.toString() !== userId.toString()) {
    throw new AppError('غير مصرح', 403);
  }

  const lesson = await Lesson.create({ ...data, section: sectionId, course: section.course._id });
  await Section.findByIdAndUpdate(sectionId, { $push: { lessons: lesson._id } });
  await Course.findByIdAndUpdate(section.course._id, { $inc: { totalLessons: 1 } });
  return lesson;
};

const getLessons = (sectionId) => Lesson.find({ section: sectionId }).sort('order').select('-video.publicId -video.secureUrl -attachments.publicId -attachments.secureUrl');

const uploadLessonVideo = async (lessonId, file, userId, role) => {
  const lesson = await Lesson.findById(lessonId).select('+video.publicId +video.secureUrl');
  if (!lesson) throw new AppError('الدرس غير موجود', 404);

  if (lesson.video?.publicId) await deleteFromCloudinary(lesson.video.publicId, 'video');

  const result = await uploadToCloudinary(file.buffer, {
    folder: 'lessons/videos',
    resource_type: 'video',
    type: 'authenticated', // Private - requires signed URL
  });

  return Lesson.findByIdAndUpdate(lessonId, {
    video: {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      duration: result.duration,
      thumbnail: result.eager?.[0]?.secure_url,
      format: result.format,
      size: result.bytes,
    },
  }, { new: true });
};

/**
 * Generate a temporary signed URL for video playback
 * Only accessible to enrolled students
 */
const getSecureVideoUrl = async (lessonId, userId, userRole) => {
  const lesson = await Lesson.findById(lessonId).select('+video.publicId +video.secureUrl');
  if (!lesson) throw new AppError('الدرس غير موجود', 404);
  if (!lesson.video?.publicId) throw new AppError('لا يوجد فيديو لهذا الدرس', 404);

  // Free lessons are accessible to all
  if (!lesson.isFree && userRole === 'student') {
    const User = require('../users/user.model');
    const user = await User.findById(userId);
    const isEnrolled = user.enrolledCourses.some(id => id.toString() === lesson.course.toString());
    if (!isEnrolled) throw new AppError('يجب شراء الكورس أولاً', 403);
  }

  // Generate signed URL valid for 1 hour
  const signedUrl = generateSignedUrl(lesson.video.publicId, 'video', 3600);
  return { url: signedUrl, duration: lesson.video.duration, expiresIn: 3600 };
};

module.exports = { createLesson, getLessons, uploadLessonVideo, getSecureVideoUrl };
