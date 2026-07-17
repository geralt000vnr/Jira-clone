const mongoose = require('mongoose');

const TRIGGERS = ['issue_created', 'issue_status_changed', 'issue_assigned', 'comment_added'];
const CONDITION_FIELDS = ['statusId', 'priority', 'type'];
const ACTION_TYPES = ['set_status', 'assign_to', 'assign_to_reporter', 'add_comment', 'set_priority'];

const automationRuleSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    trigger: { type: String, enum: TRIGGERS, required: true },
    conditionField: { type: String, enum: CONDITION_FIELDS, default: null },
    conditionValue: { type: String, default: null },
    actionType: { type: String, enum: ACTION_TYPES, required: true },
    actionValue: { type: String, default: null },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

automationRuleSchema.index({ projectId: 1, trigger: 1, enabled: 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
module.exports.TRIGGERS = TRIGGERS;
module.exports.CONDITION_FIELDS = CONDITION_FIELDS;
module.exports.ACTION_TYPES = ACTION_TYPES;
