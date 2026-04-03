const { WorkOrder, WorkOrderAttachment, WorkOrderHistory, User } = require('../models');
const { Op } = require('sequelize');

const VALID_TRANSITIONS = {
  pendiente: ['en_curso', 'esperando_repuesto'],
  en_curso: ['completada', 'pendiente', 'esperando_repuesto'],
  esperando_repuesto: ['en_curso', 'pendiente'],
  completada: ['cerrada', 'en_curso'],
  cerrada: [],
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, sector, assigned_to, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (sector) where.sector = sector;
    if (assigned_to) where.assigned_to = assigned_to;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Role-based filtering
    if (req.user.role === 'operario') {
      where[Op.or] = [
        { assigned_to: req.user.id },
        { created_by: req.user.id },
      ];
    } else if (req.user.role === 'supervisor') {
      // Supervisors can see anything they created OR everything in their assigned area
      const supervisorFilters = [{ created_by: req.user.id }];
      if (req.user.area) {
        supervisorFilters.push({ sector: req.user.area });
      }
      where[Op.or] = supervisorFilters;
    }

    const { rows, count } = await WorkOrder.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'first_name', 'last_name'] },
      ],
      order: [
        ['priority', 'ASC'],
        ['due_date', 'ASC'],
        ['created_at', 'DESC'],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      workOrders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({ error: 'Error al obtener órdenes de trabajo' });
  }
};

exports.getById = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: WorkOrderAttachment, as: 'attachments', include: [{ model: User, as: 'uploader', attributes: ['id', 'username'] }] },
        { model: WorkOrderHistory, as: 'history', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'first_name', 'last_name'] }], order: [['created_at', 'DESC']] },
      ],
    });

    if (!workOrder) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
    }

    res.json({ workOrder });
  } catch (error) {
    console.error('Get work order error:', error);
    res.status(500).json({ error: 'Error al obtener orden de trabajo' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, priority, sector, assigned_to, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    const workOrder = await WorkOrder.create({
      title,
      description,
      priority: priority || 'media',
      sector,
      assigned_to,
      created_by: req.user.id,
      due_date,
    });

    // Create initial history entry
    await WorkOrderHistory.create({
      work_order_id: workOrder.id,
      previous_status: null,
      new_status: 'pendiente',
      changed_by: req.user.id,
      comment: 'Orden de trabajo creada',
    });

    const full = await WorkOrder.findByPk(workOrder.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'first_name', 'last_name'] },
      ],
    });

    res.status(201).json({ workOrder: full, id: workOrder.id });
  } catch (error) {
    console.error('Create work order error:', error);
    res.status(500).json({ error: 'Error al crear orden de trabajo' });
  }
};

exports.update = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
    }

    if (workOrder.status === 'cerrada') {
      return res.status(400).json({ error: 'No se puede modificar una orden cerrada' });
    }

    const { title, description, priority, sector, assigned_to, due_date } = req.body;
    await workOrder.update({ title, description, priority, sector, assigned_to, due_date });

    const full = await WorkOrder.findByPk(workOrder.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'first_name', 'last_name'] },
      ],
    });

    res.json({ workOrder: full, id: workOrder.id });
  } catch (error) {
    console.error('Update work order error:', error);
    res.status(500).json({ error: 'Error al actualizar orden de trabajo' });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
    }

    const { status, comment, digital_signature } = req.body;

    if (!VALID_TRANSITIONS[workOrder.status]?.includes(status)) {
      return res.status(400).json({
        error: `Transición no válida: ${workOrder.status} → ${status}`,
        validTransitions: VALID_TRANSITIONS[workOrder.status],
      });
    }

    // Require signature to close
    if (status === 'cerrada' && !digital_signature) {
      return res.status(400).json({ error: 'Se requiere firma digital para cerrar la orden' });
    }

    const previousStatus = workOrder.status;
    let finalStatus = status;

    // Requirement: When completed, it must appear as "cerrada"
    if (status === 'completada') {
      finalStatus = 'cerrada';
    }

    const updateData = { status: finalStatus };

    if (status === 'completada' || status === 'cerrada') {
      updateData.completed_at = new Date();
      updateData.closed_at = new Date();
      updateData.digital_signature = true;
      updateData.signature_user_id = req.user.id;
    }

    await workOrder.update(updateData);

    await WorkOrderHistory.create({
      work_order_id: workOrder.id,
      previous_status: previousStatus,
      new_status: finalStatus,
      changed_by: req.user.id,
      comment,
    });

    const full = await WorkOrder.findByPk(workOrder.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: WorkOrderHistory, as: 'history', include: [{ model: User, as: 'user', attributes: ['id', 'username'] }] },
      ],
    });

    res.json({ workOrder: full, id: workOrder.id });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se ha adjuntado un archivo' });
    }

    const attachment = await WorkOrderAttachment.create({
      work_order_id: workOrder.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploaded_by: req.user.id,
    });

    res.status(201).json({ attachment, id: attachment.id });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};

exports.delete = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByPk(req.params.id);
    if (!workOrder) {
      return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
    }

    await workOrder.destroy();
    res.json({ message: 'Orden de trabajo eliminada', id: parseInt(req.params.id) });
  } catch (error) {
    console.error('Delete work order error:', error);
    res.status(500).json({ error: 'Error al eliminar orden de trabajo' });
  }
};
