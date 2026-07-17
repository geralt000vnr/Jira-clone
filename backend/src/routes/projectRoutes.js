const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const requireProjectRole = require('../middleware/requireProjectRole');
const validate = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema, addMemberSchema } = require('../validation/projectSchemas');
const { createWorkflowStatusSchema, updateWorkflowStatusSchema } = require('../validation/workflowStatusSchemas');
const { createCustomFieldSchema, updateCustomFieldSchema } = require('../validation/customFieldSchemas');
const { createAutomationRuleSchema, updateAutomationRuleSchema } = require('../validation/automationRuleSchemas');
const projectController = require('../controllers/projectController');
const workflowStatusController = require('../controllers/workflowStatusController');
const customFieldController = require('../controllers/customFieldController');
const automationRuleController = require('../controllers/automationRuleController');

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

router.get('/:projectId/custom-fields', customFieldController.listCustomFields);
router.post(
  '/:projectId/custom-fields',
  requireProjectRole(['admin', 'manager']),
  validate(createCustomFieldSchema),
  customFieldController.createCustomField
);
router.patch(
  '/:projectId/custom-fields/:id',
  requireProjectRole(['admin', 'manager']),
  validate(updateCustomFieldSchema),
  customFieldController.updateCustomField
);
router.delete(
  '/:projectId/custom-fields/:id',
  requireProjectRole(['admin', 'manager']),
  customFieldController.deleteCustomField
);

router.get('/:projectId/roadmap', projectController.getRoadmap);

router.get('/:projectId/automation-rules', automationRuleController.listAutomationRules);
router.post(
  '/:projectId/automation-rules',
  requireProjectRole(['admin', 'manager']),
  validate(createAutomationRuleSchema),
  automationRuleController.createAutomationRule
);
router.patch(
  '/:projectId/automation-rules/:id',
  requireProjectRole(['admin', 'manager']),
  validate(updateAutomationRuleSchema),
  automationRuleController.updateAutomationRule
);
router.delete(
  '/:projectId/automation-rules/:id',
  requireProjectRole(['admin', 'manager']),
  automationRuleController.deleteAutomationRule
);

module.exports = router;
