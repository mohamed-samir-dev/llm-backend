const Course = require('./course.model');

const create = (data) => Course.create(data);
const findById = (id) => Course.findById(id).populate('instructor', 'name avatar').populate('sections');
const findBySlug = (slug) => Course.findBySlug(slug).populate('instructor', 'name avatar');
const updateById = (id, data) => Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => Course.findByIdAndDelete(id);

const findAll = async ({ filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 } }) => {
  return Course.find(filter).populate('instructor', 'name avatar').skip(skip).limit(limit).sort(sort);
};

const countDocuments = (filter = {}) => Course.countDocuments(filter);

const buildSearchFilter = (query) => {
  const filter = { isPublished: true };
  if (query.search) filter.$text = { $search: query.search };
  if (query.category) filter.category = query.category;
  if (query.level) filter.level = query.level;
  if (query.language) filter.language = query.language;
  if (query.isFree === 'true') filter.isFree = true;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  return filter;
};

const buildSort = (query) => {
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
    popular: { totalStudents: -1 },
  };
  return sortMap[query.sort] || { createdAt: -1 };
};

module.exports = { create, findById, findBySlug, updateById, deleteById, findAll, countDocuments, buildSearchFilter, buildSort };
