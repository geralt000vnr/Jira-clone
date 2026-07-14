let ioInstance = null;

exports.attachIO = (io) => {
  ioInstance = io;
};

// Broadcasts to everyone viewing that project's board, and queues an email
// for the assignee if they're not the one who made the change.
exports.notifyIssueUpdate = ({ issue, event, actorId }) => {
  if (ioInstance) {
    ioInstance.to(`project:${issue.projectId}`).emit('issue:updated', { issue, event });
  }

  if (issue.assigneeId && String(issue.assigneeId) !== String(actorId)) {
    const { queueNotificationEmail } = require('../jobs/emailQueue');
    queueNotificationEmail({
      userId: issue.assigneeId,
      subject: `Update on ${issue.key}: ${issue.title}`,
      event,
    });
  }
};
