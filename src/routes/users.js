const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const auditLog = require('../middleware/audit');

router.use(authenticate);

router.get('/', authorize('admin', 'supervisor'), userController.getAll);
router.get('/:id', authorize('admin', 'supervisor'), userController.getById);
router.post('/', authorize('admin'), auditLog('CREATE', 'user'), userController.create);
router.put('/:id', authorize('admin'), auditLog('UPDATE', 'user'), userController.update);
router.delete('/:id', authorize('admin'), auditLog('DELETE', 'user'), userController.delete);

module.exports = router;
