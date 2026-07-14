const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validation/authSchemas');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

module.exports = router;
