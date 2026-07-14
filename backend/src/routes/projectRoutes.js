const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const requireProjectRole = require('../middleware/requireProjectRole');
const validate = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema, addMemberSchema } = require('../validation/projectSchemas');
const projectController = require('../controllers/projectController');

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

module.exports = router;
