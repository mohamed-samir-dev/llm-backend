const router = require('express').Router();
const Order = require('../orders/order.model');
const { completeOrder } = require('../orders/order.service');
const catchAsync = require('../../utils/catchAsync');
const { sendResponse } = require('../../utils/response');
const { protect } = require('../../middlewares/auth.middleware');
const AppError = require('../../utils/AppError');
const crypto = require('crypto');

/**
 * Payment Gateway Abstraction Layer
 * ─────────────────────────────────
 * This module is designed to be gateway-agnostic.
 * To add a new gateway (Stripe, PayPal, Fawry, Paymob, etc.):
 *   1. Create a new file: services/gateways/<gateway>.gateway.js
 *   2. Export: { createPaymentIntent, verifyWebhook }
 *   3. Register the webhook route below
 *
 * Future: Multi-gateway support with strategy pattern
 */

// ─── Initiate Payment ────────────────────────────────────────────────────────
router.post('/initiate', protect, catchAsync(async (req, res) => {
  const { orderId, gateway = 'manual' } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('الطلب غير موجود', 404);
  if (order.user.toString() !== req.user._id.toString()) throw new AppError('غير مصرح', 403);
  if (order.status === 'completed') throw new AppError('الطلب مكتمل بالفعل', 400);

  // TODO: Switch on gateway to call the appropriate payment provider
  // Example: const paymentIntent = await stripeGateway.createPaymentIntent(order);
  // For now, return order details for manual/test payment
  sendResponse(res, 200, {
    orderId: order._id,
    amount: order.totalAmount,
    currency: order.currency,
    gateway,
    // clientSecret: paymentIntent.client_secret  ← add when integrating real gateway
  }, 'جاهز للدفع');
}));

// ─── Webhook Handler (called by payment gateway after payment) ───────────────
router.post('/webhook/:gateway', catchAsync(async (req, res) => {
  const { gateway } = req.params;

  // Verify webhook signature to prevent fraud
  // Each gateway has its own signature verification method
  let orderId, paymentData;

  if (gateway === 'stripe') {
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // orderId = event.data.object.metadata.orderId;
    // paymentData = { gateway: 'stripe', transactionId: event.data.object.id, method: 'card' };
  } else if (gateway === 'paymob') {
    // Paymob HMAC verification
    // const hmac = req.query.hmac;
    // verify hmac...
  } else if (gateway === 'manual') {
    // For testing only - remove in production
    orderId = req.body.orderId;
    paymentData = {
      gateway: 'manual',
      transactionId: `manual_${Date.now()}`,
      method: req.body.method || 'manual',
    };
  }

  if (!orderId) {
    return res.status(400).json({ received: false });
  }

  await completeOrder(orderId, paymentData);

  // Always return 200 to webhook immediately
  res.status(200).json({ received: true });
}));

// ─── Get Payment Status ──────────────────────────────────────────────────────
router.get('/status/:orderId', protect, catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select('status totalAmount currency paymentGateway transactionId');
  if (!order) throw new AppError('الطلب غير موجود', 404);
  if (order.user?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('غير مصرح', 403);
  }
  sendResponse(res, 200, { order });
}));

module.exports = router;
