const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/**
 * Delete resource from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

/**
 * Generate a signed URL for private resources (videos, PDFs)
 * URL expires after `expiresIn` seconds (default: 1 hour)
 */
const generateSignedUrl = (publicId, resourceType = 'video', expiresIn = 3600) => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, generateSignedUrl };
