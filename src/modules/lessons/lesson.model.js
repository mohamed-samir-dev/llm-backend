const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, default: 0 },

  video: {
    publicId: { type: String, select: false }, // Never expose to client
    secureUrl: { type: String, select: false }, // Never expose directly
    duration: Number,
    thumbnail: String,
    format: String,
    size: Number,
  },

  attachments: [{
    name: String,
    publicId: { type: String, select: false },
    secureUrl: { type: String, select: false },
    type: String,
    size: Number,
  }],

  isFree: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

lessonSchema.index({ section: 1, order: 1 });
lessonSchema.index({ course: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
