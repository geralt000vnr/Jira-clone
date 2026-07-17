const { z } = require('zod');
const { TYPES } = require('../models/CustomField');

exports.createCustomFieldSchema = z.object({
  name: z.string().trim().min(1).max(60),
  type: z.enum(TYPES),
  options: z.array(z.string().trim().min(1).max(60)).max(20).optional().default([]),
});

exports.updateCustomFieldSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  type: z.enum(TYPES).optional(),
  options: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  order: z.number().int().min(0).optional(),
});
