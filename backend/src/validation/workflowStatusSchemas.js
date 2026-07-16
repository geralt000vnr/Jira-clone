const { z } = require('zod');
const { CATEGORIES, COLORS } = require('../models/WorkflowStatus');

exports.createWorkflowStatusSchema = z.object({
  name: z.string().trim().min(1).max(60),
  category: z.enum(CATEGORIES),
  color: z.enum(COLORS).optional().default('slate'),
});

exports.updateWorkflowStatusSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  category: z.enum(CATEGORIES).optional(),
  color: z.enum(COLORS).optional(),
  order: z.number().int().min(0).optional(),
});
