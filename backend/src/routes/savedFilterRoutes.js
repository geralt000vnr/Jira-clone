const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const validate = require('../middleware/validate');
const { createSavedFilterSchema } = require('../validation/savedFilterSchemas');
const savedFilterController = require('../controllers/savedFilterController');

router.use(auth, tenantScope);

// nested under projects: /api/projects/:projectId/saved-filters
router.get('/projects/:projectId/saved-filters', savedFilterController.listSavedFilters);
router.post(
  '/projects/:projectId/saved-filters',
  validate(createSavedFilterSchema),
  savedFilterController.createSavedFilter
);

// standalone by filter id: /api/saved-filters/:id
router.delete('/saved-filters/:id', savedFilterController.deleteSavedFilter);

module.exports = router;
