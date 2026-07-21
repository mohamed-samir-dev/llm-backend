const sendResponse = (res, statusCode, data = {}, message = 'success') => {
  res.status(statusCode).json({
    status: 'success',
    message,
    ...data,
  });
};

const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    status: 'fail',
    message,
  });
};

module.exports = { sendResponse, sendError };
