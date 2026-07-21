const router = require('express').Router();
const orderService = require('./order.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

router.use(protect);

router.post('/', catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body.items);
  sendResponse(res, 201, { order }, 'تم إنشاء الطلب بنجاح');
}));

router.get('/my-orders', catchAsync(async (req, res) => {
  const result = await orderService.getUserOrders(req.user._id, req.query);
  sendResponse(res, 200, result);
}));

// Payment gateway webhook - complete order after payment
router.post('/complete/:orderId', restrictTo('admin'), catchAsync(async (req, res) => {
  const order = await orderService.completeOrder(req.params.orderId, req.body);
  sendResponse(res, 200, { order }, 'تم إكمال الطلب بنجاح');
}));

module.exports = router;
