const router = require('express').Router();
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const dashboardController = require('../controllers/dashboardController');

router.use(auth, tenantScope);

router.get('/my-issues', dashboardController.getMyIssues);
router.get('/activity', dashboardController.getRecentActivity);

module.exports = router;
