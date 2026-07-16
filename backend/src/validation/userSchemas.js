const { z } = require('zod');

exports.lookupUserQuerySchema = z.object({
  email: z.string().trim().email(),
});
