const userRepo = require('./user.repository');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../services/cloudinary.service');
const AppError = require('../../utils/AppError');
const { paginate, paginateResponse } = require('../../helpers/pagination');

const getProfile = (userId) => userRepo.findById(userId)
  .populate('enrolledCourses', 'title thumbnail slug')
  .populate('certificates', 'certificateId issuedAt')
  .populate('wishlist', 'title thumbnail slug price');

const updateProfile = async (userId, data) => {
  const allowed = ['name', 'phone', 'country'];
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return userRepo.updateById(userId, filtered);
};

const uploadAvatar = async (userId, file) => {
  const user = await userRepo.findById(userId);

  // Delete old avatar
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  const result = await uploadToCloudinary(file.buffer, {
    folder: 'avatars',
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
  });

  return userRepo.updateById(userId, {
    avatar: { publicId: result.public_id, url: result.secure_url },
  });
};

const getAllUsers = async (query) => {
  const { page, limit, skip } = paginate(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.search) filter.$or = [
    { name: { $regex: query.search, $options: 'i' } },
    { email: { $regex: query.search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    userRepo.findAll(filter, { skip, limit, sort: { createdAt: -1 } }),
    userRepo.countDocuments(filter),
  ]);

  return paginateResponse(users, total, page, limit);
};

const banUser = (userId) => userRepo.updateById(userId, { isBanned: true });
const unbanUser = (userId) => userRepo.updateById(userId, { isBanned: false });

module.exports = { getProfile, updateProfile, uploadAvatar, getAllUsers, banUser, unbanUser };
