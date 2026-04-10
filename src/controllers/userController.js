const { User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, active } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (active !== undefined) where.active = active === 'true';

    // Supervisor ABAC: can only see users in their area
    if (req.user && req.user.role !== 'admin') {
      where.area = req.user.area;
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refresh_token'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      users: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    logger.error('Get users error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user error', { error: error.message });
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role, area } = req.body;

    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });

    if (existing) {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }

    const user = await User.create({
      username, email, password, first_name, last_name,
      role: role || 'operario',
      area: area || 'General',
    });

    res.status(201).json({ user: user.toSafeJSON(), id: user.id });
  } catch (error) {
    logger.error('Create user error', { error: error.message });
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { username, email, first_name, last_name, role, active, password, area } = req.body;

    if (username && username !== user.username) {
      const existing = await User.findOne({ where: { username } });
      if (existing) return res.status(409).json({ error: 'Username ya existe' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email ya existe' });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (role) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (password) updateData.password = password;
    if (area) updateData.area = area;

    await user.update(updateData);

    res.json({ user: user.toSafeJSON(), id: user.id });
  } catch (error) {
    logger.error('Update user error', { error: error.message });
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

exports.delete = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await user.update({ active: false });

    res.json({ message: 'Usuario desactivado exitosamente', id: user.id });
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    res.status(500).json({ error: 'Error al desactivar usuario' });
  }
};
