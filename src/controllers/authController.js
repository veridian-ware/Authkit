const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { User, AuditLog } = require('../models');
const { Op } = require('sequelize');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username: username },
          { email: username }
        ]
      } 
    });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Cuenta desactivada. Contacte al administrador.' });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiration }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiration }
    );

    // Save refresh token
    await user.update({ refresh_token: refreshToken, last_login: new Date() });

    // Audit log
    await AuditLog.create({
      user_id: user.id,
      username: user.username,
      action: 'LOGIN',
      entity: 'auth',
      ip_address: req.ip,
    });

    res.json({
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.active || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiration }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiration }
    );

    await user.update({ refresh_token: newRefreshToken });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expirado, inicie sesión nuevamente' });
    }
    res.status(401).json({ error: 'Refresh token inválido' });
  }
};

exports.logout = async (req, res) => {
  try {
    await req.user.update({ refresh_token: null });

    await AuditLog.create({
      user_id: req.user.id,
      username: req.user.username,
      action: 'LOGOUT',
      entity: 'auth',
      ip_address: req.ip,
    });

    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
};
