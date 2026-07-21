const Order = require('./order.model');
const Course = require('../courses/course.model');
const User = require('../users/user.model');
const AppError = require('../../utils/AppError');
const { paginate, paginateResponse } = require('../../helpers/pagination');
const { emailQueue, notificationQueue } = require('../../services/queue.service');
const { emailTemplates } = require('../../services/email.service');
const mongoose = require('mongoose');

/**
 * Create order and enroll student in course
 * Designed to support any payment gateway
 */
const createOrder = async (userId, items) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const course = await Course.findById(item.courseId).session(session);
      if (!course) throw new AppError(`الكورس ${item.courseId} غير موجود`, 404);
      if (!course.isPublished) throw new AppError('الكورس غير متاح حالياً', 400);

      // Check if already enrolled
      const user = await User.findById(userId).session(session);
      if (user.enrolledCourses.includes(course._id)) {
        throw new AppError(`أنت مسجل بالفعل في كورس "${course.title}"`, 400);
      }

      const price = course.isFree ? 0 : (course.discountPrice && course.discountExpires > Date.now() ? course.discountPrice : course.price);
      totalAmount += price;
      orderItems.push({ itemType: 'course', item: course._id, price, title: course.title });
    }

    const [order] = await Order.create([{
      user: userId,
      items: orderItems,
      totalAmount,
      status: totalAmount === 0 ? 'completed' : 'pending',
    }], { session });

    // If free, enroll immediately
    if (totalAmount === 0) {
      await enrollUserInCourses(userId, orderItems.map(i => i.item), session);
    }

    await session.commitTransaction();

    // Send confirmation email
    const user = await User.findById(userId);
    const template = emailTemplates.orderConfirmation(user.name, order);
    await emailQueue.add('order-email', { to: user.email, ...template });

    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Called by payment gateway webhook after successful payment
 */
const completeOrder = async (orderId, paymentData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new AppError('الطلب غير موجود', 404);
    if (order.status === 'completed') throw new AppError('الطلب مكتمل بالفعل', 400);

    order.status = 'completed';
    order.paymentMethod = paymentData.method;
    order.paymentGateway = paymentData.gateway;
    order.transactionId = paymentData.transactionId;
    order.paymentDetails = paymentData;
    await order.save({ session });

    const courseIds = order.items.filter(i => i.itemType === 'course').map(i => i.item);
    await enrollUserInCourses(order.user, courseIds, session);

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const enrollUserInCourses = async (userId, courseIds, session) => {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { enrolledCourses: { $each: courseIds } },
  }, { session });

  await Course.updateMany(
    { _id: { $in: courseIds } },
    { $inc: { totalStudents: 1 } },
    { session }
  );

  // Send enrollment notification
  await notificationQueue.add('enrollment', {
    userId,
    title: 'تم التسجيل بنجاح! 🎉',
    body: `تم تسجيلك في ${courseIds.length} كورس`,
    type: 'course',
    channels: ['in_app'],
  });
};

const getUserOrders = async (userId, query) => {
  const { page, limit, skip } = paginate(query);
  const [orders, total] = await Promise.all([
    Order.find({ user: userId }).skip(skip).limit(limit).sort({ createdAt: -1 }),
    Order.countDocuments({ user: userId }),
  ]);
  return paginateResponse(orders, total, page, limit);
};

module.exports = { createOrder, completeOrder, getUserOrders };
