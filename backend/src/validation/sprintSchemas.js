const { z } = require('zod');

exports.createSprintSchema = z
  .object({
    projectId: z.string().min(1),
    name: z.string().trim().min(1).max(120),
    goal: z.string().max(1000).optional().default(''),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

exports.updateSprintSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  goal: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

exports.addIssueToSprintSchema = z.object({
  issueId: z.string().min(1),
});
