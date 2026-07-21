const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const certificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateId: { type: String, unique: true, default: () => uuidv4() },
  pdf: {
    publicId: { type: String, select: false },
    secureUrl: String,
  },
  issuedAt: { type: Date, default: Date.now },
  completionDate: { type: Date },
}, { timestamps: true });

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
