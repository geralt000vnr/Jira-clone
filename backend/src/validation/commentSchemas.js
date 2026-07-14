const { z } = require('zod');

exports.createCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

exports.updateCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});
