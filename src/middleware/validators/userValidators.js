const { body, query, param } = require('express-validator');

const VALID_ROLES = ['admin', 'supervisor', 'operario', 'contador'];

const createUserValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('El username solo puede contener letras, números, guiones y puntos'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('first_name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 50 }).withMessage('El nombre no puede superar 50 caracteres'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ max: 50 }).withMessage('El apellido no puede superar 50 caracteres'),
  body('role')
    .optional()
    .isIn(VALID_ROLES).withMessage(`El rol debe ser uno de: ${VALID_ROLES.join(', ')}`),
  body('area')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El área no puede superar 50 caracteres'),
];

const updateUserValidator = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de usuario inválido'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('El username debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('El username solo puede contener letras, números, guiones y puntos'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El nombre no puede superar 50 caracteres'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El apellido no puede superar 50 caracteres'),
  body('role')
    .optional()
    .isIn(VALID_ROLES).withMessage(`El rol debe ser uno de: ${VALID_ROLES.join(', ')}`),
  body('active')
    .optional()
    .isBoolean().withMessage('El campo active debe ser true o false'),
];

const listUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
  query('role')
    .optional()
    .isIn(VALID_ROLES).withMessage(`El rol debe ser uno de: ${VALID_ROLES.join(', ')}`),
];

module.exports = { createUserValidator, updateUserValidator, listUsersValidator };
