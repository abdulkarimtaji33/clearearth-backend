const db = require('../models');
const { Op } = db.Sequelize;
const { DEAL_STATUS, JOB_STATUS, INVOICE_STATUS, LOT_STATUS, RECORD_STATUS } = require('../constants');

const getOverviewKPIs = async tenantId => {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  // Clients & Vendors
  const [activeClients, activeVendors] = await Promise.all([
    db.Client.count({ where: { tenant_id: tenantId, status: RECORD_STATUS.ACTIVE } }),
    db.Vendor.count({ where: { tenant_id: tenantId, status: RECORD_STATUS.ACTIVE } }),
  ]);

  // Deals Pipeline
  const [totalDeals, wonDeals, lostDeals, activeDeals] = await Promise.all([
    db.Deal.count({ where: { tenant_id: tenantId } }),
    db.Deal.count({ where: { tenant_id: tenantId, status: DEAL_STATUS.WON } }),
    db.Deal.count({ where: { tenant_id: tenantId, status: DEAL_STATUS.LOST } }),
    db.Deal.count({ where: { tenant_id: tenantId, status: { [Op.notIn]: [DEAL_STATUS.WON, DEAL_STATUS.LOST] } } }),
  ]);

  const totalDealValue = await db.Deal.sum('expected_value', {
    where: { tenant_id: tenantId, status: { [Op.notIn]: [DEAL_STATUS.LOST] } },
  });

  // Jobs & Operations
  const [totalJobs, pendingJobs, inProgressJobs, completedJobs] = await Promise.all([
    db.Job.count({ where: { tenant_id: tenantId } }),
    db.Job.count({ where: { tenant_id: tenantId, status: JOB_STATUS.PENDING } }),
    db.Job.count({ where: { tenant_id: tenantId, status: JOB_STATUS.IN_PROGRESS } }),
    db.Job.count({ where: { tenant_id: tenantId, status: JOB_STATUS.COMPLETED } }),
  ]);

  // Inventory
  const [openLots, totalInventoryValue] = await Promise.all([
    db.Lot.count({ where: { tenant_id: tenantId, status: { [Op.in]: [LOT_STATUS.OPEN, LOT_STATUS.WORK_IN_PROGRESS] } } }),
    db.Inventory.sum('total_value', { where: { tenant_id: tenantId } }),
  ]);

  // Invoices & Revenue
  const [
    totalInvoices,
    draftInvoices,
    approvedInvoices,
    paidInvoices,
    overdueInvoices,
    totalRevenue,
    totalReceivables,
    monthlyRevenue,
    lastMonthRevenue,
  ] = await Promise.all([
    db.Invoice.count({ where: { tenant_id: tenantId } }),
    db.Invoice.count({ where: { tenant_id: tenantId, status: INVOICE_STATUS.DRAFT } }),
    db.Invoice.count({ where: { tenant_id: tenantId, status: INVOICE_STATUS.APPROVED } }),
    db.Invoice.count({ where: { tenant_id: tenantId, status: INVOICE_STATUS.PAID } }),
    db.Invoice.count({
      where: {
        tenant_id: tenantId,
        status: { [Op.notIn]: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] },
        due_date: { [Op.lt]: currentDate },
      },
    }),
    db.Invoice.sum('total_amount', {
      where: { tenant_id: tenantId, status: { [Op.notIn]: [INVOICE_STATUS.CANCELLED] } },
    }),
    db.Invoice.sum('balance_amount', {
      where: {
        tenant_id: tenantId,
        status: { [Op.notIn]: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] },
      },
    }),
    db.Invoice.sum('total_amount', {
      where: {
        tenant_id: tenantId,
        status: INVOICE_STATUS.PAID,
        invoice_date: { [Op.gte]: startOfMonth },
      },
    }),
    db.Invoice.sum('total_amount', {
      where: {
        tenant_id: tenantId,
        status: INVOICE_STATUS.PAID,
        invoice_date: { [Op.between]: [startOfLastMonth, endOfLastMonth] },
      },
    }),
  ]);

  // Calculate revenue growth
  const revenueGrowth = lastMonthRevenue > 0 ? (((monthlyRevenue || 0) - (lastMonthRevenue || 0)) / lastMonthRevenue) * 100 : 0;

  // Collection rate
  const collectionRate = totalRevenue > 0 ? ((totalRevenue - (totalReceivables || 0)) / totalRevenue) * 100 : 0;

  return {
    clients: { active: activeClients || 0 },
    vendors: { active: activeVendors || 0 },
    deals: {
      total: totalDeals || 0,
      active: activeDeals || 0,
      won: wonDeals || 0,
      lost: lostDeals || 0,
      totalValue: totalDealValue || 0,
      winRate: totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(2) : 0,
    },
    jobs: {
      total: totalJobs || 0,
      pending: pendingJobs || 0,
      inProgress: inProgressJobs || 0,
      completed: completedJobs || 0,
    },
    inventory: {
      openLots: openLots || 0,
      totalValue: totalInventoryValue || 0,
    },
    invoices: {
      total: totalInvoices || 0,
      draft: draftInvoices || 0,
      approved: approvedInvoices || 0,
      paid: paidInvoices || 0,
      overdue: overdueInvoices || 0,
    },
    revenue: {
      total: totalRevenue || 0,
      receivables: totalReceivables || 0,
      monthlyRevenue: monthlyRevenue || 0,
      lastMonthRevenue: lastMonthRevenue || 0,
      revenueGrowth: revenueGrowth.toFixed(2),
      collectionRate: collectionRate.toFixed(2),
    },
  };
};

const getSalesTrends = async (tenantId, filters) => {
  const { startDate, endDate } = filters;
  const where = { tenant_id: tenantId, status: INVOICE_STATUS.PAID };

  if (startDate && endDate) {
    where.invoice_date = { [Op.between]: [startDate, endDate] };
  }

  const salesData = await db.Invoice.findAll({
    where,
    attributes: [
      [db.Sequelize.fn('DATE', db.Sequelize.col('invoice_date')), 'date'],
      [db.Sequelize.fn('SUM', db.Sequelize.col('total_amount')), 'revenue'],
      [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
    ],
    group: [db.Sequelize.fn('DATE', db.Sequelize.col('invoice_date'))],
    order: [[db.Sequelize.fn('DATE', db.Sequelize.col('invoice_date')), 'ASC']],
    raw: true,
  });

  return salesData;
};

const getMaterialTypeBreakdown = async tenantId => {
  const breakdown = await db.Inventory.findAll({
    where: { tenant_id: tenantId },
    include: [{ model: db.MaterialType, as: 'materialType', attributes: ['name', 'category'] }],
    attributes: [
      'material_type_id',
      [db.Sequelize.fn('SUM', db.Sequelize.col('total_quantity')), 'totalQuantity'],
      [db.Sequelize.fn('SUM', db.Sequelize.col('total_value')), 'totalValue'],
    ],
    group: ['material_type_id', 'materialType.id'],
    raw: false,
  });

  return breakdown;
};

const getTopClients = async (tenantId, limit = 10) => {
  const topClients = await db.Invoice.findAll({
    where: { tenant_id: tenantId, status: { [Op.notIn]: [INVOICE_STATUS.CANCELLED] } },
    include: [{ model: db.Client, as: 'client', attributes: ['id', 'company_name', 'email'] }],
    attributes: [
      'client_id',
      [db.Sequelize.fn('COUNT', db.Sequelize.col('Invoice.id')), 'invoiceCount'],
      [db.Sequelize.fn('SUM', db.Sequelize.col('total_amount')), 'totalRevenue'],
      [db.Sequelize.fn('SUM', db.Sequelize.col('balance_amount')), 'pendingAmount'],
    ],
    group: ['client_id', 'client.id'],
    order: [[db.Sequelize.literal('totalRevenue'), 'DESC']],
    limit,
    raw: false,
  });

  return topClients;
};

const getRecentActivities = async (tenantId, limit = 20) => {
  const [recentDeals, recentJobs, recentInvoices] = await Promise.all([
    db.Deal.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: db.Client, as: 'client', attributes: ['company_name'] }],
      limit: 5,
      order: [['updated_at', 'DESC']],
    }),
    db.Job.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: db.Client, as: 'client', attributes: ['company_name'] }],
      limit: 5,
      order: [['updated_at', 'DESC']],
    }),
    db.Invoice.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: db.Client, as: 'client', attributes: ['company_name'] }],
      limit: 5,
      order: [['updated_at', 'DESC']],
    }),
  ]);

  return {
    deals: recentDeals,
    jobs: recentJobs,
    invoices: recentInvoices,
  };
};

module.exports = {
  getOverviewKPIs,
  getSalesTrends,
  getMaterialTypeBreakdown,
  getTopClients,
  getRecentActivities,
};
