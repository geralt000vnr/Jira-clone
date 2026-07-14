const { z } = require('zod');
const { ROLES } = require('../models/ProjectMember');

exports.createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  key: z.string().trim().min(2).max(10).regex(/^[A-Za-z0-9]+$/, 'Key must be alphanumeric'),
  description: z.string().max(2000).optional().default(''),
});

exports.updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
});

exports.addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES),
});
