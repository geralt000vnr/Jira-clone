const { z } = require('zod');
const { ISSUE_TYPES, STATUSES, PRIORITIES } = require('../models/Issue');

exports.createIssueSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(300),
  description: z.string().max(10000).optional().default(''),
  type: z.enum(ISSUE_TYPES).optional().default('task'),
  priority: z.enum(PRIORITIES).optional().default('medium'),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  labels: z.array(z.string().trim().max(40)).max(20).optional().default([]),
  parentId: z.string().nullable().optional(),
});

exports.updateIssueSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(10000).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  labels: z.array(z.string().trim().max(40)).max(20).optional(),
  sprintId: z.string().nullable().optional(),
});

exports.moveIssueSchema = z.object({
  toStatus: z.enum(STATUSES),
  toPosition: z.number().int().nonnegative(),
  fromStatus: z.enum(STATUSES).optional(),
  expectedVersion: z.number().int().nonnegative(),
});
