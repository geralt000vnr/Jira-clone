const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { createIssueSchema, updateIssueSchema, moveIssueSchema } = require('../validation/issueSchemas');
const issueController = require('../controllers/issueController');

router.use(auth, tenantScope);

router.get('/', issueController.listIssues);
router.post('/', validate(createIssueSchema), issueController.createIssue);
router.get('/:id', issueController.getIssue);
router.patch('/:id', validate(updateIssueSchema), issueController.updateIssue);
router.patch('/:id/move', validate(moveIssueSchema), issueController.moveIssue);
router.delete('/:id', issueController.deleteIssue);
router.get('/:id/activity', issueController.getIssueActivity);

module.exports = router;
