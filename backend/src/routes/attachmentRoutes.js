const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const attachmentController = require('../controllers/attachmentController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(auth, tenantScope);

router.get('/issues/:issueId/attachments', attachmentController.listAttachments);
router.post('/issues/:issueId/attachments', upload.single('file'), attachmentController.uploadAttachment);
router.delete('/attachments/:id', attachmentController.deleteAttachment);
router.get('/attachments/file/:storageKey', attachmentController.serveFile);

module.exports = router;
