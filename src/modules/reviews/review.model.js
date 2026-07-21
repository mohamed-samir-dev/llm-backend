const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
  isApproved: { type: Boolean, default: true },
}, { timestamps: true });

// One review per student per course
reviewSchema.index({ user: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1, rating: -1 });

// Update course rating after save/remove
reviewSchema.post('save', async function () {
  await updateCourseRating(this.course);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await updateCourseRating(doc.course);
});

async function updateCourseRating(courseId) {
  const Review = mongoose.model('Review');
  const Course = mongoose.model('Course');
  const stats = await Review.aggregate([
    { $match: { course: courseId } },
    { $group: { _id: '$course', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }
}

module.exports = mongoose.model('Review', reviewSchema);
