const mongoose = require('mongoose');
const slugify = require('slugify');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  shortDescription: { type: String },

  thumbnail: { publicId: String, url: String },
  previewVideo: {
    publicId: String,
    secureUrl: String,
    duration: Number,
    thumbnail: String,
    format: String,
    size: Number,
  },

  price: { type: Number, default: 0 },
  discountPrice: { type: Number },
  discountExpires: { type: Date },
  isFree: { type: Boolean, default: false },

  category: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  language: { type: String, default: 'ar' },

  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],

  totalStudents: { type: Number, default: 0 },
  totalLessons: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },

  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },

  requirements: [String],
  whatYouLearn: [String],
  tags: [String],
}, { timestamps: true });

// Auto-generate slug
courseSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

// Virtual: effective price
courseSchema.virtual('effectivePrice').get(function () {
  if (this.isFree) return 0;
  if (this.discountPrice && this.discountExpires > Date.now()) return this.discountPrice;
  return this.price;
});

courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, level: 1, language: 1, price: 1 });

module.exports = mongoose.model('Course', courseSchema);
