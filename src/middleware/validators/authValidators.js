const { body } = require('express-validator');

const loginValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('El usuario o email es requerido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
];

const refreshValidator = [
  body('refreshToken')
    .notEmpty().withMessage('El refresh token es requerido'),
];

module.exports = { loginValidator, refreshValidator };
