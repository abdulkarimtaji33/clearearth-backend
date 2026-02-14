const db = require('../models');
const { Op } = db.Sequelize;
const { INVOICE_STATUS, DEAL_STATUS } = require('../constants');

const getDealReport = async (tenantId, filters) => {
  const { startDate, endDate, status } = filters;
  const where = { tenant_id: tenantId };

  if (status) where.status = status;
  if (startDate && endDate) {
    where.created_at = { [Op.between]: [startDate, endDate] };
  }

  const deals = await db.Deal.findAll({
    where,
    include: [
      { model: db.Client, as: 'client', attributes: ['id', 'company_name'] },
      { model: db.User, as: 'owner', attributes: ['id', 'first_name', 'last_name'] },
    ],
    order: [['created_at', 'DESC']],
  });

  return deals;
};

const getInvoiceReport = async (tenantId, filters) => {
  const { startDate, endDate, status, clientId } = filters;
  const where = { tenant_id: tenantId };

  if (status) where.status = status;
  if (clientId) where.client_id = clientId;
  if (startDate && endDate) {
    where.invoice_date = { [Op.between]: [startDate, endDate] };
  }

  const invoices = await db.Invoice.findAll({
    where,
    include: [
      { model: db.Client, as: 'client', attributes: ['id', 'company_name'] },
    ],
    order: [['invoice_date', 'DESC']],
  });

  return invoices;
};

const getInventoryReport = async (tenantId, filters) => {
  const { warehouseId, materialTypeId } = filters;
  const where = { tenant_id: tenantId };

  if (warehouseId) where.warehouse_id = warehouseId;
  if (materialTypeId) where.material_type_id = materialTypeId;

  const inventory = await db.Inventory.findAll({
    where,
    include: [
      { model: db.Warehouse, as: 'warehouse', attributes: ['id', 'name'] },
      { model: db.MaterialType, as: 'materialType', attributes: ['id', 'name', 'category'] },
    ],
    order: [['warehouse_id', 'ASC'], ['material_type_id', 'ASC']],
  });

  return inventory;
};

const getSalesReport = async (tenantId, filters) => {
  const { startDate, endDate } = filters;
  const where = {
    tenant_id: tenantId,
    status: INVOICE_STATUS.PAID,
  };

  if (startDate && endDate) {
    where.invoice_date = { [Op.between]: [startDate, endDate] };
  }

  const sales = await db.Invoice.findAll({
    where,
    include: [
      { model: db.Client, as: 'client', attributes: ['id', 'company_name'] },
      { model: db.InvoiceLine, as: 'lines' },
    ],
    order: [['invoice_date', 'DESC']],
  });

  const totalRevenue = sales.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);

  return {
    sales,
    totalRevenue,
    totalInvoices: sales.length,
  };
};

const getVATReport = async (tenantId, filters) => {
  const { startDate, endDate } = filters;
  const where = {
    tenant_id: tenantId,
    status: { [Op.notIn]: [INVOICE_STATUS.CANCELLED] },
  };

  if (startDate && endDate) {
    where.invoice_date = { [Op.between]: [startDate, endDate] };
  }

  const invoices = await db.Invoice.findAll({
    where,
    attributes: [
      'id',
      'invoice_number',
      'invoice_date',
      'client_id',
      'vat_type',
      'vat_rate',
      'subtotal',
      'vat_amount',
      'total_amount',
    ],
    include: [
      { model: db.Client, as: 'client', attributes: ['id', 'company_name'] },
    ],
    order: [['invoice_date', 'ASC']],
  });

  const summary = {
    totalStandardRated: 0,
    totalZeroRated: 0,
    totalReverseCharge: 0,
    totalVATCollected: 0,
  };

  invoices.forEach(invoice => {
    if (invoice.vat_type === 'standard') {
      summary.totalStandardRated += parseFloat(invoice.subtotal);
      summary.totalVATCollected += parseFloat(invoice.vat_amount);
    } else if (invoice.vat_type === 'zero_rated') {
      summary.totalZeroRated += parseFloat(invoice.subtotal);
    } else if (invoice.vat_type === 'reverse_charge') {
      summary.totalReverseCharge += parseFloat(invoice.subtotal);
    }
  });

  return {
    invoices,
    summary,
  };
};

const getCustomerAgeingReport = async (tenantId, clientId = null) => {
  const where = {
    tenant_id: tenantId,
    status: { [Op.notIn]: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] },
  };

  if (clientId) where.client_id = clientId;

  const invoices = await db.Invoice.findAll({
    where,
    include: [
      { model: db.Client, as: 'client', attributes: ['id', 'company_name', 'email'] },
    ],
    order: [['due_date', 'ASC']],
  });

  const today = new Date();
  const ageingData = {};

  invoices.forEach(invoice => {
    const clientId = invoice.client_id;
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const balanceAmount = parseFloat(invoice.balance_amount);

    if (!ageingData[clientId]) {
      ageingData[clientId] = {
        client: invoice.client,
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_over_90: 0,
        total: 0,
      };
    }

    if (daysOverdue < 0) {
      ageingData[clientId].current += balanceAmount;
    } else if (daysOverdue <= 30) {
      ageingData[clientId].days_1_30 += balanceAmount;
    } else if (daysOverdue <= 60) {
      ageingData[clientId].days_31_60 += balanceAmount;
    } else if (daysOverdue <= 90) {
      ageingData[clientId].days_61_90 += balanceAmount;
    } else {
      ageingData[clientId].days_over_90 += balanceAmount;
    }

    ageingData[clientId].total += balanceAmount;
  });

  return Object.values(ageingData);
};

const getCommissionReport = async (tenantId, filters) => {
  const { startDate, endDate, salesUserId } = filters;
  const where = { tenant_id: tenantId };

  if (salesUserId) where.sales_user_id = salesUserId;
  if (startDate && endDate) {
    where.commission_date = { [Op.between]: [startDate, endDate] };
  }

  const commissions = await db.Commission.findAll({
    where,
    include: [
      { model: db.User, as: 'salesUser', attributes: ['id', 'first_name', 'last_name'] },
      { model: db.Deal, as: 'deal', attributes: ['id', 'deal_number'] },
    ],
    order: [['commission_date', 'DESC']],
  });

  return commissions;
};

const getExpenseReport = async (tenantId, filters) => {
  const { startDate, endDate, categoryId } = filters;
  const where = { tenant_id: tenantId };

  if (categoryId) where.category_id = categoryId;
  if (startDate && endDate) {
    where.expense_date = { [Op.between]: [startDate, endDate] };
  }

  const expenses = await db.Expense.findAll({
    where,
    include: [
      { model: db.ExpenseCategory, as: 'category', attributes: ['id', 'name'] },
      { model: db.User, as: 'submitter', attributes: ['id', 'first_name', 'last_name'] },
    ],
    order: [['expense_date', 'DESC']],
  });

  return expenses;
};

module.exports = {
  getDealReport,
  getInvoiceReport,
  getInventoryReport,
  getSalesReport,
  getVATReport,
  getCustomerAgeingReport,
  getCommissionReport,
  getExpenseReport,
};
