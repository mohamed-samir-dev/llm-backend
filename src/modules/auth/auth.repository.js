const User = require('../users/user.model');
const crypto = require('crypto');

const findByEmail = (email) => User.findOne({ email }).select('+password +refreshTokens +emailVerificationToken +emailVerificationExpires +passwordResetToken +passwordResetExpires');

const findByPhone = (phone) => User.findOne({ phone }).select('+password +refreshTokens');

const findById = (id) => User.findById(id).select('+refreshTokens');

const createUser = (data) => User.create(data);

const setEmailVerificationToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  await User.findByIdAndUpdate(userId, {
    emailVerificationToken: hashedToken,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });
  return token; // Return raw token for email
};

const verifyEmailToken = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });
};

const setPasswordResetToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  await User.findByIdAndUpdate(userId, {
    passwordResetToken: hashedToken,
    passwordResetExpires: Date.now() + 10 * 60 * 1000, // 10 min
  });
  return token;
};

const findByPasswordResetToken = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password');
};

module.exports = { findByEmail, findByPhone, findById, createUser, setEmailVerificationToken, verifyEmailToken, setPasswordResetToken, findByPasswordResetToken };
