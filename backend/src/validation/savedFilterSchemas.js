const { z } = require('zod');

exports.createSavedFilterSchema = z.object({
  name: z.string().trim().min(1).max(80),
  filters: z.object({
    statusId: z.string().optional().default(''),
    priority: z.string().optional().default(''),
    assigneeId: z.string().optional().default(''),
    q: z.string().optional().default(''),
  }),
  isShared: z.boolean().optional().default(false),
});
