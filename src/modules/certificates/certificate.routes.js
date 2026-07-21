const router = require('express').Router();
const Certificate = require('./certificate.model');
const { generateSignedUrl } = require('../../services/cloudinary.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');

router.use(protect);

router.get('/my-certificates', catchAsync(async (req, res) => {
  const certificates = await Certificate.find({ user: req.user._id })
    .populate('course', 'title thumbnail');
  sendResponse(res, 200, { certificates });
}));

// Download certificate - generates signed URL
router.get('/:id/download', catchAsync(async (req, res) => {
  const cert = await Certificate.findById(req.params.id).select('+pdf.publicId');
  if (!cert) throw new AppError('الشهادة غير موجودة', 404);
  if (cert.user.toString() !== req.user._id.toString()) {
    throw new AppError('غير مصرح', 403);
  }

  const signedUrl = generateSignedUrl(cert.pdf.publicId, 'raw', 3600);
  sendResponse(res, 200, { url: signedUrl, expiresIn: 3600 });
}));

// Verify certificate by ID (public)
router.get('/verify/:certificateId', catchAsync(async (req, res) => {
  const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
    .populate('user', 'name')
    .populate('course', 'title');
  if (!cert) throw new AppError('الشهادة غير موجودة أو غير صالحة', 404);
  sendResponse(res, 200, {
    valid: true,
    certificate: {
      id: cert.certificateId,
      studentName: cert.user.name,
      courseTitle: cert.course.title,
      issuedAt: cert.issuedAt,
    },
  });
}));

module.exports = router;
