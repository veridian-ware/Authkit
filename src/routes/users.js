const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');
const auditLog = require('../middleware/audit');
const validate = require('../middleware/validate');
const { createUserValidator, updateUserValidator, listUsersValidator } = require('../middleware/validators/userValidators');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, supervisor, operario, contador]
 *     responses:
 *       200:
 *         description: Returns list of users
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize('admin'), listUsersValidator, validate, userController.getAll);

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
 *               - username
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, supervisor, operario, contador]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Username or email already exists
 */
router.post('/', authenticate, authorize('admin'), auditLog('CREATE', 'User'), createUserValidator, validate, userController.create);

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
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/:id', authenticate, authorize('admin'), auditLog('UPDATE', 'User'), updateUserValidator, validate, userController.update);

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
 *       404:
 *         description: User not found
 */
router.delete('/:id', authenticate, authorize('admin'), auditLog('DELETE', 'User'), userController.delete);

module.exports = router;
