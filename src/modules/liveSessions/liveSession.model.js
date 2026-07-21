const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  platform: { type: String, enum: ['zoom', 'teams', 'meet'], required: true },
  meetingLink: { type: String, required: true },
  meetingId: { type: String },
  password: { type: String },

  startDate: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },

  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxStudents: { type: Number },

  reminderSent: { type: Boolean, default: false },
  recordingUrl: { type: String },
}, { timestamps: true });

liveSessionSchema.index({ startDate: 1, status: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
