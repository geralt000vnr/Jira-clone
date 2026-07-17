const { z } = require('zod');
const { ISSUE_TYPES, PRIORITIES } = require('../models/Issue');

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
  storyPoints: z.number().min(0).max(999).nullable().optional(),
});

const customFieldValuesSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

exports.updateIssueSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(10000).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  labels: z.array(z.string().trim().max(40)).max(20).optional(),
  sprintId: z.string().nullable().optional(),
  storyPoints: z.number().min(0).max(999).nullable().optional(),
  originalEstimateSeconds: z.number().min(0).nullable().optional(),
  customFieldValues: customFieldValuesSchema.optional(),
});

exports.moveIssueSchema = z.object({
  toStatusId: z.string().min(1),
  toPosition: z.number().int().nonnegative(),
  fromStatusId: z.string().min(1).optional(),
  expectedVersion: z.number().int().nonnegative(),
});

exports.listIssuesQuerySchema = z.object({
  projectId: z.string().min(1),
  statusId: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
  q: z.string().optional(),
  // coerce since query params always arrive as strings
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});
