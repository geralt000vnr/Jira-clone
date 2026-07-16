const { z } = require('zod');
const { LINK_TYPES } = require('../models/IssueLink');

exports.createIssueLinkSchema = z.object({
  targetIssueId: z.string().min(1),
  type: z.enum(LINK_TYPES),
});
