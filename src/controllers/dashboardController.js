const { Transaction, Product, WorkOrder, PurchaseOrder, PurchaseRequest, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRange = {
      date: { [Op.between]: [firstDayOfMonth.toISOString().split('T')[0], now.toISOString().split('T')[0]] },
    };

    // Financial summary
    const [monthlyIncome, monthlyExpense] = await Promise.all([
      Transaction.sum('amount', { where: { ...monthRange, type: 'ingreso' } }),
      Transaction.sum('amount', { where: { ...monthRange, type: 'egreso' } }),
    ]);

    // Work orders summary
    const [pendingOT, inProgressOT, urgentOT, overdueOT] = await Promise.all([
      WorkOrder.count({ where: { status: 'pendiente' } }),
      WorkOrder.count({ where: { status: 'en_curso' } }),
      WorkOrder.count({ where: { status: { [Op.in]: ['pendiente', 'en_curso'] }, priority: 'alta' } }),
      WorkOrder.count({
        where: {
          status: { [Op.in]: ['pendiente', 'en_curso'] },
          due_date: { [Op.lt]: now.toISOString().split('T')[0] },
        },
      }),
    ]);

    // Pending OT for more than 48 hours
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const staleOT = await WorkOrder.count({
      where: {
        status: 'pendiente',
        created_at: { [Op.lt]: fortyEightHoursAgo },
      },
    });

    // Inventory alerts
    const [criticalStock, lowStock] = await Promise.all([
      Product.count({
        where: {
          active: true,
          current_stock: { [Op.lte]: sequelize.col('min_stock') },
          min_stock: { [Op.gt]: 0 },
        },
      }),
      Product.count({
        where: {
          active: true,
          current_stock: { [Op.gt]: sequelize.col('min_stock') },
          current_stock: { [Op.lte]: sequelize.literal('"Product"."min_stock" * 1.5') },
          min_stock: { [Op.gt]: 0 },
        },
      }),
    ]);

    // Purchasing alerts
    const [pendingPR, activePO] = await Promise.all([
      PurchaseRequest.count({ where: { status: 'Pendiente' } }),
      PurchaseOrder.count({ where: { status: { [Op.in]: ['Emitida', 'Pendiente de Pago'] } } }),
    ]);

    const totalIncome = parseFloat(monthlyIncome || 0);
    const totalExpense = parseFloat(monthlyExpense || 0);
    const balance = totalIncome - totalExpense;

    // Alert levels
    const alerts = {
      financial: balance < 0 ? 'red' : balance < totalIncome * 0.1 ? 'yellow' : 'green',
      workOrders: (urgentOT > 0 || overdueOT > 0) ? 'red' : (staleOT > 0) ? 'yellow' : 'green',
      inventory: criticalStock > 0 ? 'red' : lowStock > 0 ? 'yellow' : 'green',
      purchasing: pendingPR > 0 ? 'red' : activePO > 0 ? 'yellow' : 'green',
    };

    res.json({
      financial: {
        monthlyIncome: totalIncome,
        monthlyExpense: totalExpense,
        balance,
      },
      workOrders: {
        pending: pendingOT,
        inProgress: inProgressOT,
        urgent: urgentOT,
        overdue: overdueOT,
        stale: staleOT,
      },
      inventory: {
        criticalStock,
        lowStock,
      },
      purchasing: {
        pendingRequests: pendingPR,
        activeOrders: activePO
      },
      alerts,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Error al obtener resumen del dashboard' });
  }
};
