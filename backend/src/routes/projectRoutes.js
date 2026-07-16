const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const requireProjectRole = require('../middleware/requireProjectRole');
const validate = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema, addMemberSchema } = require('../validation/projectSchemas');
const { createWorkflowStatusSchema, updateWorkflowStatusSchema } = require('../validation/workflowStatusSchemas');
const projectController = require('../controllers/projectController');
const workflowStatusController = require('../controllers/workflowStatusController');

router.use(auth, tenantScope);

router.get('/', projectController.listProjects);
router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/:projectId', projectController.getProject);
router.patch('/:projectId', requireProjectRole(['admin']), validate(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', requireProjectRole(['admin']), projectController.deleteProject);

router.get('/:projectId/members', projectController.listMembers);
router.post(
  '/:projectId/members',
  requireProjectRole(['admin', 'manager']),
  validate(addMemberSchema),
  projectController.addMember
);
router.delete('/:projectId/members/:userId', requireProjectRole(['admin', 'manager']), projectController.removeMember);

router.get('/:projectId/workflow-statuses', workflowStatusController.listWorkflowStatuses);
router.post(
  '/:projectId/workflow-statuses',
  requireProjectRole(['admin', 'manager']),
  validate(createWorkflowStatusSchema),
  workflowStatusController.createWorkflowStatus
);
router.patch(
  '/:projectId/workflow-statuses/:id',
  requireProjectRole(['admin', 'manager']),
  validate(updateWorkflowStatusSchema),
  workflowStatusController.updateWorkflowStatus
);
router.delete(
  '/:projectId/workflow-statuses/:id',
  requireProjectRole(['admin', 'manager']),
  workflowStatusController.deleteWorkflowStatus
);

module.exports = router;
