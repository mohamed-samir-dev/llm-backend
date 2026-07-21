const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  totalLessons: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 },

  lastWatchedLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  lastWatchedAt: { type: Number, default: 0 }, // seconds

  totalWatchTime: { type: Number, default: 0 }, // seconds
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },

  // Per-lesson watch time
  lessonProgress: [{
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    watchedSeconds: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    lastWatchedAt: { type: Number, default: 0 },
  }],
}, { timestamps: true });

progressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
