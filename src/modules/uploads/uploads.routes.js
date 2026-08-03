const mongoose = require('mongoose');

// ─── Access Log Model ────────────────────────────────────────────────────────
// Tracks every video view and file download for security & analytics
const accessLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceType: { type: String, enum: ['video', 'pdf', 'attachment'], required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, enum: ['view', 'download'], required: true },
  ip: String,
  userAgent: String,
  deviceId: String,
}, { timestamps: true });

accessLogSchema.index({ user: 1, resourceId: 1, createdAt: -1 });

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

const router = require('express').Router();
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

// Log a resource access (called internally or by client after viewing)
router.post('/log', protect, catchAsync(async (req, res) => {
  await AccessLog.create({
    user: req.user._id,
    resourceType: req.body.resourceType,
    resourceId: req.body.resourceId,
    action: req.body.action || 'view',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    deviceId: req.headers['x-device-id'],
  });
  sendResponse(res, 201, {});
}));

// Admin: view access logs
router.get('/logs', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  const logs = await AccessLog.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  sendResponse(res, 200, { logs });
}));

module.exports = router;
