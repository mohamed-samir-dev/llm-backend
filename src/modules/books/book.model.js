const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  coverImage: { publicId: String, url: String },
  pdf: {
    publicId: { type: String, select: false },
    secureUrl: { type: String, select: false },
    size: Number,
    pages: Number,
  },
  category: { type: String, required: true },
  author: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  totalDownloads: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
