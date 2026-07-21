const courseRepo = require('./course.repository');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../services/cloudinary.service');
const AppError = require('../../utils/AppError');
const { paginate, paginateResponse } = require('../../helpers/pagination');

const createCourse = async (data, instructorId) => {
  return courseRepo.create({ ...data, instructor: instructorId });
};

const getCourses = async (query) => {
  const { page, limit, skip } = paginate(query);
  const filter = courseRepo.buildSearchFilter(query);
  const sort = courseRepo.buildSort(query);

  const [courses, total] = await Promise.all([
    courseRepo.findAll({ filter, skip, limit, sort }),
    courseRepo.countDocuments(filter),
  ]);

  return paginateResponse(courses, total, page, limit);
};

const getCourseById = async (id) => {
  const course = await courseRepo.findById(id);
  if (!course) throw new AppError('الكورس غير موجود', 404);
  return course;
};

const updateCourse = async (id, data, userId, role) => {
  const course = await courseRepo.findById(id);
  if (!course) throw new AppError('الكورس غير موجود', 404);
  if (role !== 'admin' && course.instructor._id.toString() !== userId.toString()) {
    throw new AppError('ليس لديك صلاحية لتعديل هذا الكورس', 403);
  }
  return courseRepo.updateById(id, data);
};

const deleteCourse = async (id, userId, role) => {
  const course = await courseRepo.findById(id);
  if (!course) throw new AppError('الكورس غير موجود', 404);
  if (role !== 'admin' && course.instructor._id.toString() !== userId.toString()) {
    throw new AppError('ليس لديك صلاحية لحذف هذا الكورس', 403);
  }
  if (course.thumbnail?.publicId) await deleteFromCloudinary(course.thumbnail.publicId);
  await courseRepo.deleteById(id);
};

const uploadCourseThumbnail = async (courseId, file, userId, role) => {
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('الكورس غير موجود', 404);
  if (role !== 'admin' && course.instructor._id.toString() !== userId.toString()) {
    throw new AppError('غير مصرح', 403);
  }

  if (course.thumbnail?.publicId) await deleteFromCloudinary(course.thumbnail.publicId);

  const result = await uploadToCloudinary(file.buffer, {
    folder: 'courses/thumbnails',
    transformation: [{ width: 1280, height: 720, crop: 'fill' }],
  });

  return courseRepo.updateById(courseId, {
    thumbnail: { publicId: result.public_id, url: result.secure_url },
  });
};

const uploadPreviewVideo = async (courseId, file, userId, role) => {
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('الكورس غير موجود', 404);
  if (role !== 'admin' && course.instructor._id.toString() !== userId.toString()) {
    throw new AppError('غير مصرح', 403);
  }

  if (course.previewVideo?.publicId) {
    await deleteFromCloudinary(course.previewVideo.publicId, 'video');
  }

  const result = await uploadToCloudinary(file.buffer, {
    folder: 'courses/previews',
    resource_type: 'video',
    eager: [{ format: 'mp4' }],
  });

  return courseRepo.updateById(courseId, {
    previewVideo: {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      duration: result.duration,
      thumbnail: result.eager?.[0]?.secure_url,
      format: result.format,
      size: result.bytes,
    },
  });
};

const publishCourse = async (courseId, userId, role) => {
  const course = await courseRepo.findById(courseId);
  if (!course) throw new AppError('الكورس غير موجود', 404);
  if (role !== 'admin' && course.instructor._id.toString() !== userId.toString()) {
    throw new AppError('غير مصرح', 403);
  }
  return courseRepo.updateById(courseId, { isPublished: true, publishedAt: new Date() });
};

module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse, uploadCourseThumbnail, uploadPreviewVideo, publishCourse };
