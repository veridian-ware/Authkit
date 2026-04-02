const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const auditLog = require('../middleware/audit');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, auditLog('LOGOUT', 'auth'), authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
