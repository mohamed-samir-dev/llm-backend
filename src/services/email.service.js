const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: { user: config.email.user, pass: config.email.pass },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
};

// Email templates
const emailTemplates = {
  verifyEmail: (name, url) => ({
    subject: 'تأكيد البريد الإلكتروني',
    html: `
      <div dir="rtl" style="font-family:Arial;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:10px">
        <h2 style="color:#6c63ff">مرحباً ${name} 👋</h2>
        <p>شكراً لتسجيلك في منصتنا التعليمية. يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#6c63ff;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">تأكيد البريد الإلكتروني</a>
        <p style="color:#888;font-size:12px">هذا الرابط صالح لمدة 24 ساعة فقط.</p>
      </div>
    `,
  }),

  resetPassword: (name, url) => ({
    subject: 'إعادة تعيين كلمة المرور',
    html: `
      <div dir="rtl" style="font-family:Arial;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:10px">
        <h2 style="color:#6c63ff">مرحباً ${name}</h2>
        <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#e74c3c;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">إعادة تعيين كلمة المرور</a>
        <p style="color:#888;font-size:12px">هذا الرابط صالح لمدة 10 دقائق فقط. إذا لم تطلب ذلك، تجاهل هذا البريد.</p>
      </div>
    `,
  }),

  orderConfirmation: (name, order) => ({
    subject: 'تأكيد الطلب',
    html: `
      <div dir="rtl" style="font-family:Arial;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:10px">
        <h2 style="color:#6c63ff">شكراً لشرائك ${name}! 🎉</h2>
        <p>تم تأكيد طلبك بنجاح. رقم الطلب: <strong>${order._id}</strong></p>
        <p>المبلغ الإجمالي: <strong>${order.totalAmount} ${order.currency}</strong></p>
      </div>
    `,
  }),

  liveSessionReminder: (name, session) => ({
    subject: `تذكير: جلسة مباشرة تبدأ خلال 5 دقائق - ${session.title}`,
    html: `
      <div dir="rtl" style="font-family:Arial;max-width:600px;margin:auto;padding:20px;background:#f9f9f9;border-radius:10px">
        <h2 style="color:#6c63ff">مرحباً ${name} 🔴</h2>
        <p>جلستك المباشرة <strong>${session.title}</strong> ستبدأ خلال 5 دقائق!</p>
        <a href="${session.meetingLink}" style="display:inline-block;padding:12px 24px;background:#27ae60;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">انضم الآن</a>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
