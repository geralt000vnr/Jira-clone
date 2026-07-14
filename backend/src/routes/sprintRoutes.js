const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const requireProjectRole = require('../middleware/requireProjectRole');
const requireSprintProjectRole = require('../middleware/requireSprintProjectRole');
const validate = require('../middleware/validate');
const { createSprintSchema, updateSprintSchema, addIssueToSprintSchema } = require('../validation/sprintSchemas');
const sprintController = require('../controllers/sprintController');

router.use(auth, tenantScope);

router.get('/', sprintController.listSprints);
router.post('/', requireProjectRole(['admin', 'manager']), validate(createSprintSchema), sprintController.createSprint);
router.get('/:id', sprintController.getSprint);
router.patch(
  '/:id',
  requireSprintProjectRole(['admin', 'manager']),
  validate(updateSprintSchema),
  sprintController.updateSprint
);
router.delete('/:id', requireSprintProjectRole(['admin', 'manager']), sprintController.deleteSprint);
router.post('/:id/start', requireSprintProjectRole(['admin', 'manager']), sprintController.startSprint);
router.post('/:id/complete', requireSprintProjectRole(['admin', 'manager']), sprintController.completeSprint);
router.post('/:id/issues', validate(addIssueToSprintSchema), sprintController.addIssueToSprint);

module.exports = router;
