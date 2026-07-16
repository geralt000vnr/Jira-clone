const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { createWorklogSchema } = require('../validation/worklogSchemas');
const worklogController = require('../controllers/worklogController');

router.use(auth, tenantScope);

// nested under issues: /api/issues/:id/worklogs
router.get('/issues/:id/worklogs', worklogController.listWorklogs);
router.post('/issues/:id/worklogs', validate(createWorklogSchema), worklogController.createWorklog);

// standalone by worklog id: /api/worklogs/:id
router.delete('/worklogs/:id', worklogController.deleteWorklog);

module.exports = router;
