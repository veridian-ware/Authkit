const { Product, StockMovement, User, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, alert } = req.query;
    const offset = (page - 1) * limit;

    const where = { active: true };
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (alert === 'critical') {
      where.current_stock = { [Op.lte]: sequelize.col('min_stock') };
    } else if (alert === 'low') {
      where[Op.and] = [
        { current_stock: { [Op.lte]: sequelize.literal('"Product"."min_stock" * 1.5') } },
        { current_stock: { [Op.gt]: sequelize.col('min_stock') } },
      ];
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: StockMovement,
        as: 'movements',
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'first_name', 'last_name'] }],
        order: [['date', 'DESC']],
        limit: 50,
      }],
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, unit, current_stock, min_stock } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const product = await Product.create({
      name, description,
      unit: unit || 'unidad',
      current_stock: current_stock || 0,
      min_stock: min_stock || 0,
    });

    res.status(201).json({ product, id: product.id });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { name, description, unit, min_stock, active } = req.body;
    await product.update({ name, description, unit, min_stock, active });

    res.json({ product, id: product.id });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

exports.delete = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await product.update({ active: false });
    res.json({ message: 'Producto desactivado', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Error al desactivar producto' });
  }
};

exports.addMovement = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const { type, quantity, description, date } = req.body;

    if (!type || !quantity) {
      return res.status(400).json({ error: 'Tipo y cantidad son obligatorios' });
    }

    if (type === 'salida' && parseFloat(quantity) > parseFloat(product.current_stock)) {
      return res.status(400).json({ error: 'Stock insuficiente para esta salida' });
    }

    const movement = await StockMovement.create({
      product_id: product.id,
      type,
      quantity: parseFloat(quantity),
      description,
      date: date || new Date(),
      user_id: req.user.id,
    });

    // Update stock
    const newStock = type === 'entrada'
      ? parseFloat(product.current_stock) + parseFloat(quantity)
      : parseFloat(product.current_stock) - parseFloat(quantity);

    await product.update({ current_stock: newStock });

    res.status(201).json({
      movement,
      product: { ...product.toJSON(), current_stock: newStock },
      id: movement.id,
    });
  } catch (error) {
    console.error('Add movement error:', error);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  }
};

exports.getMovements = async (req, res) => {
  try {
    const { page = 1, limit = 50, from, to } = req.query;
    const offset = (page - 1) * limit;

    const where = { product_id: req.params.id };
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    const { rows, count } = await StockMovement.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'first_name', 'last_name'] }],
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      movements: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
};
