const User = require('./user.model');

const findById = (id) => User.findById(id);
const findAll = (filter = {}, options = {}) => User.find(filter, null, options);
const updateById = (id, data) => User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => User.findByIdAndDelete(id);
const countDocuments = (filter = {}) => User.countDocuments(filter);

module.exports = { findById, findAll, updateById, deleteById, countDocuments };
