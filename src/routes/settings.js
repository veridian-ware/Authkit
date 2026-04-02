const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const auditLog = require('../middleware/audit');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', settingsController.get);
router.put('/', authorize('admin'), auditLog('UPDATE', 'settings'), settingsController.update);
router.post('/logo', authorize('admin'), upload.single('logo'), auditLog('UPLOAD', 'logo'), settingsController.uploadLogo);

module.exports = router;
