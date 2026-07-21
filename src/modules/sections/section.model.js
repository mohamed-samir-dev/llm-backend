const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, default: 0 },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

sectionSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Section', sectionSchema);
