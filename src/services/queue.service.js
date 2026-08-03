const { Queue, Worker } = require('bullmq');
const redisConfig = require('../config/redis');
const { sendEmail, emailTemplates } = require('./email.service');
const { sendNotification } = require('./notification.service');
const { generateCertificate } = require('./certificate.service');
const Certificate = require('../modules/certificates/certificate.model');
const User = require('../modules/users/user.model');
const Course = require('../modules/courses/course.model');

const safeQueue = { add: async () => null };

let emailQueue = safeQueue;
let notificationQueue = safeQueue;
let certificateQueue = safeQueue;
let liveReminderQueue = safeQueue;

const initQueues = () => {
  if (!redisConfig.redisAvailable || !redisConfig.bullmqConnection) return;

  const connection = redisConfig.bullmqConnection;

  emailQueue = new Queue('email', { connection });
  notificationQueue = new Queue('notification', { connection });
  certificateQueue = new Queue('certificate', { connection });
  liveReminderQueue = new Queue('live-reminder', { connection });

  new Worker('email', async (job) => {
    const { to, subject, html } = job.data;
    await sendEmail({ to, subject, html });
  }, { connection });

  new Worker('notification', async (job) => {
    await sendNotification(job.data);
  }, { connection });

  new Worker('certificate', async (job) => {
    const { userId, courseId } = job.data;
    const [user, course] = await Promise.all([User.findById(userId), Course.findById(courseId)]);
    if (!user || !course) return;

    const existing = await Certificate.findOne({ user: userId, course: courseId });
    if (existing) return;

    const cert = await Certificate.create({ user: userId, course: courseId, completionDate: new Date() });
    const result = await generateCertificate({
      userName: user.name, userEmail: user.email, courseTitle: course.title,
      completionDate: cert.completionDate, certificateId: cert.certificateId,
    });

    await Certificate.findByIdAndUpdate(cert._id, { 'pdf.publicId': result.public_id, 'pdf.secureUrl': result.secure_url });
    await User.findByIdAndUpdate(userId, { $addToSet: { certificates: cert._id } });

    await notificationQueue.add('cert-notification', {
      userId, title: 'تهانينا! 🎉',
      body: `لقد أتممت دورة "${course.title}" وحصلت على شهادتك`,
      type: 'certificate', channels: ['in_app', 'push', 'email'], user,
    });
  }, { connection });

  new Worker('live-reminder', async (job) => {
    const { sessionId } = job.data;
    const LiveSession = require('../modules/liveSessions/liveSession.model');
    const session = await LiveSession.findById(sessionId).populate('registeredStudents', 'name email fcmTokens');
    if (!session || session.status !== 'scheduled') return;

    for (const student of session.registeredStudents) {
      const template = emailTemplates.liveSessionReminder(student.name, session);
      await emailQueue.add('live-email', { to: student.email, ...template });
      await notificationQueue.add('live-push', {
        userId: student._id, title: `🔴 جلسة مباشرة تبدأ الآن: ${session.title}`,
        body: 'انضم الآن للجلسة المباشرة', type: 'live_session', channels: ['in_app', 'push'], user: student,
      });
    }
    await LiveSession.findByIdAndUpdate(sessionId, { reminderSent: true });
  }, { connection });

  console.log('✅ BullMQ queues initialized');
};

module.exports = {
  initQueues,
  get emailQueue() { return emailQueue; },
  get notificationQueue() { return notificationQueue; },
  get certificateQueue() { return certificateQueue; },
  get liveReminderQueue() { return liveReminderQueue; },
};
