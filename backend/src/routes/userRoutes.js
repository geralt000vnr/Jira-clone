const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { lookupUserQuerySchema } = require('../validation/userSchemas');
const userController = require('../controllers/userController');

router.use(auth, tenantScope);

router.get('/', validate(lookupUserQuerySchema, 'query'), userController.lookupByEmail);

module.exports = router;
