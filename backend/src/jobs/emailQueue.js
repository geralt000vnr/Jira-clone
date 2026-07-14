const { sendEmail } = require('../services/emailService');
const User = require('../models/User');

// In production replace this with a real queue (BullMQ/Redis) for retries & reliability.
const queue = [];
let processing = false;

exports.queueNotificationEmail = (job) => {
  queue.push(job);
  processQueue();
};

async function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;
  while (queue.length) {
    const job = queue.shift();
    try {
      const user = await User.findById(job.userId).select('email name');
      if (user) await sendEmail({ to: user.email, subject: job.subject, event: job.event });
    } catch (err) {
      console.error('Failed to send notification email', err);
    }
  }
  processing = false;
}
