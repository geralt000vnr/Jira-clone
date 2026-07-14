const { z } = require('zod');

exports.signupSchema = z.object({
  orgName: z.string().trim().min(2).max(100),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72), // bcrypt truncates beyond 72 bytes
});

exports.loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});
