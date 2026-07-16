const { z } = require('zod');

exports.createWorklogSchema = z.object({
  timeSpentSeconds: z.number().int().min(60).max(999 * 3600), // 1 minute .. 999 hours
  description: z.string().max(2000).optional().default(''),
  startedAt: z.string().datetime().optional(),
});
