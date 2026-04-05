const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const auditLog = require('../middleware/audit');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns list of users
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize('admin'), userController.list);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: securepassword
 *               role:
 *                 type: string
 *                 enum: [admin, supervisor, operator, accountant]
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, authorize('admin'), auditLog('CREATE', 'User'), userController.create);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Forbidden
 */
router.put('/:id', authenticate, authorize('admin'), auditLog('UPDATE', 'User'), userController.update);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Deactivate a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authenticate, authorize('admin'), auditLog('DELETE', 'User'), userController.remove);

module.exports = router;
