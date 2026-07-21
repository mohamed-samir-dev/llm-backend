const Notification = require('../modules/notifications/notification.model');
const { sendEmail, emailTemplates } = require('./email.service');

// Lazy load firebase to avoid crash if not configured
let admin;
try { admin = require('../config/firebase'); } catch (e) { /* firebase not configured */ }

/**
 * Send notification through multiple channels
 */
const sendNotification = async ({ userId, title, body, type = 'system', data = {}, channels = ['in_app'], user = null }) => {
  // 1. In-App notification
  if (channels.includes('in_app')) {
    await Notification.create({ user: userId, title, body, type, data, channels });
  }

  // 2. Firebase Push Notification
  if (channels.includes('push') && admin && user?.fcmTokens?.length) {
    try {
      await admin.messaging().sendEachForMulticast({
        tokens: user.fcmTokens,
        notification: { title, body },
        data: { type, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) },
      });
    } catch (err) {
      console.error('FCM error:', err.message);
    }
  }

  // 3. Email notification
  if (channels.includes('email') && user?.email) {
    try {
      await sendEmail({ to: user.email, subject: title, html: `<p dir="rtl">${body}</p>` });
    } catch (err) {
      console.error('Email notification error:', err.message);
    }
  }
};

module.exports = { sendNotification };
