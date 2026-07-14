const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { createCommentSchema, updateCommentSchema } = require('../validation/commentSchemas');
const commentController = require('../controllers/commentController');

router.use(auth, tenantScope);

// nested under issues: /api/issues/:issueId/comments
router.get('/issues/:issueId/comments', commentController.listComments);
router.post('/issues/:issueId/comments', validate(createCommentSchema), commentController.createComment);

// standalone by comment id: /api/comments/:id
router.patch('/comments/:id', validate(updateCommentSchema), commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

module.exports = router;
