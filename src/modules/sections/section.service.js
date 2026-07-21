const Section = require('./section.model');
const Lesson = require('../lessons/lesson.model');
const Course = require('../courses/course.model');
const AppError = require('../../utils/AppError');

const createSection = async (courseId, data, userId, role) => {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('الكورس غير موجود', 404);
  if (role !== 'admin' && course.instructor.toString() !== userId.toString()) {
    throw new AppError('غير مصرح', 403);
  }

  const section = await Section.create({ ...data, course: courseId });
  await Course.findByIdAndUpdate(courseId, { $push: { sections: section._id } });
  return section;
};

const getSections = (courseId) => Section.find({ course: courseId }).populate('lessons').sort('order');

const updateSection = async (sectionId, data, userId, role) => {
  const section = await Section.findById(sectionId).populate('course');
  if (!section) throw new AppError('القسم غير موجود', 404);
  if (role !== 'admin' && section.course.instructor.toString() !== userId.toString()) {
    throw new AppError('غير مصرح', 403);
  }
  return Section.findByIdAndUpdate(sectionId, data, { new: true });
};

const deleteSection = async (sectionId, userId, role) => {
  const section = await Section.findById(sectionId).populate('course');
  if (!section) throw new AppError('القسم غير موجود', 404);
  if (role !== 'admin' && section.course.instructor.toString() !== userId.toString()) {
    throw new AppError('غير مصرح', 403);
  }
  await Lesson.deleteMany({ section: sectionId });
  await Course.findByIdAndUpdate(section.course._id, { $pull: { sections: sectionId } });
  await Section.findByIdAndDelete(sectionId);
};

module.exports = { createSection, getSections, updateSection, deleteSection };
