const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { createIssueSchema, updateIssueSchema, moveIssueSchema } = require('../validation/issueSchemas');
const { createIssueLinkSchema } = require('../validation/issueLinkSchemas');
const { bulkUpdateIssuesSchema, bulkDeleteIssuesSchema } = require('../validation/issueBulkSchemas');
const issueController = require('../controllers/issueController');

router.use(auth, tenantScope);

router.get('/', issueController.listIssues);
router.post('/', validate(createIssueSchema), issueController.createIssue);

// bulk routes must be registered before the /:id routes below, or Express would
// match the literal segment "bulk" as an :id parameter instead
router.patch('/bulk', validate(bulkUpdateIssuesSchema), issueController.bulkUpdateIssues);
router.delete('/bulk', validate(bulkDeleteIssuesSchema), issueController.bulkDeleteIssues);

router.get('/:id', issueController.getIssue);
router.patch('/:id', validate(updateIssueSchema), issueController.updateIssue);
router.patch('/:id/move', validate(moveIssueSchema), issueController.moveIssue);
router.delete('/:id', issueController.deleteIssue);
router.get('/:id/activity', issueController.getIssueActivity);
router.post('/:id/links', validate(createIssueLinkSchema), issueController.createIssueLink);
router.delete('/:id/links/:linkId', issueController.deleteIssueLink);

module.exports = router;
