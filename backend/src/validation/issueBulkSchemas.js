const { z } = require('zod');
const { PRIORITIES } = require('../models/Issue');

exports.bulkUpdateIssuesSchema = z.object({
  items: z
    .array(
      z.object({
        issueId: z.string().min(1),
        expectedVersion: z.number().int().nonnegative(),
      })
    )
    .min(1)
    .max(100),
  updates: z
    .object({
      statusId: z.string().min(1).optional(),
      assigneeId: z.string().nullable().optional(),
      priority: z.enum(PRIORITIES).optional(),
    })
    .refine((u) => Object.keys(u).length > 0, { message: 'At least one field to update is required' }),
});

exports.bulkDeleteIssuesSchema = z.object({
  issueIds: z.array(z.string().min(1)).min(1).max(100),
});
