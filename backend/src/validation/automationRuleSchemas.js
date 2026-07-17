const { z } = require('zod');
const { TRIGGERS, CONDITION_FIELDS, ACTION_TYPES } = require('../models/AutomationRule');

exports.createAutomationRuleSchema = z.object({
  name: z.string().trim().min(1).max(100),
  trigger: z.enum(TRIGGERS),
  conditionField: z.enum(CONDITION_FIELDS).nullable().optional(),
  conditionValue: z.string().nullable().optional(),
  actionType: z.enum(ACTION_TYPES),
  actionValue: z.string().nullable().optional(),
  enabled: z.boolean().optional().default(true),
});

exports.updateAutomationRuleSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  trigger: z.enum(TRIGGERS).optional(),
  conditionField: z.enum(CONDITION_FIELDS).nullable().optional(),
  conditionValue: z.string().nullable().optional(),
  actionType: z.enum(ACTION_TYPES).optional(),
  actionValue: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});
