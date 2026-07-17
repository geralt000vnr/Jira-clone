const AutomationRule = require('../models/AutomationRule');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const { logActivity } = require('./activityLogger');
const { notifyIssueUpdate } = require('./notificationService');

// Executes a single rule's action. Mutates via the model directly (never via
// issueController/commentController) so an automation's own effects can
// never re-enter runAutomations — this is the entire loop-prevention
// strategy, see CLAUDE.md.
async function executeAction(rule, { issue, organizationId, actorId }) {
  const { actionType, actionValue } = rule;

  if (actionType === 'add_comment') {
    await Comment.create({ organizationId, issueId: issue._id, authorId: actorId, body: actionValue || '' });
    notifyIssueUpdate({ issue, event: 'comment_added', actorId });
    return issue;
  }

  const updates = {};
  if (actionType === 'set_status') updates.statusId = actionValue;
  else if (actionType === 'set_priority') updates.priority = actionValue;
  else if (actionType === 'assign_to') updates.assigneeId = actionValue;
  else if (actionType === 'assign_to_reporter') updates.assigneeId = issue.reporterId;
  else return issue;

  // No version filter: this is a system-triggered write with no client
  // waiting on a specific version, unlike user-initiated edits.
  const updated = await Issue.findOneAndUpdate(
    { _id: issue._id, organizationId },
    { $set: updates, $inc: { version: 1 } },
    { new: true }
  );
  if (!updated) return issue;

  for (const key of Object.keys(updates)) {
    if (String(issue[key]) !== String(updated[key])) {
      await logActivity({
        organizationId,
        issueId: updated._id,
        actorId,
        field: key,
        fromValue: issue[key],
        toValue: updated[key],
      });
    }
  }

  notifyIssueUpdate({ issue: updated, event: 'automation', actorId });
  return updated;
}

// Runs every enabled rule for `trigger` on this project, in order, threading
// the (possibly-updated) issue through so later rules see earlier rules'
// effects. Always returns an issue — the original if nothing fired/matched.
exports.runAutomations = async ({ trigger, issue, organizationId, projectId, actorId }) => {
  const rules = await AutomationRule.find({
    organizationId,
    projectId,
    trigger,
    enabled: true,
    deletedAt: null,
  }).sort({ order: 1 });

  let current = issue;
  for (const rule of rules) {
    if (rule.conditionField && String(current[rule.conditionField]) !== rule.conditionValue) continue;
    current = await executeAction(rule, { issue: current, organizationId, actorId });
  }
  return current;
};
