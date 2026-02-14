const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { COMMISSION_STATUS, INVOICE_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, status, salesUserId, dealId, startDate, endDate } = filters;
  const where = { tenant_id: tenantId };

  if (status) where.status = status;
  if (salesUserId) where.sales_user_id = salesUserId;
  if (dealId) where.deal_id = dealId;
  if (startDate && endDate) {
    where.commission_date = { [Op.between]: [startDate, endDate] };
  }

  const { count, rows } = await db.Commission.findAndCountAll({
    where,
    include: [
      { model: db.User, as: 'salesUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: db.Deal, as: 'deal', attributes: ['id', 'deal_number', 'title'] },
      { model: db.Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'total_amount'] },
      { model: db.Lot, as: 'lot', attributes: ['id', 'lot_number'] },
    ],
    offset,
    limit,
    order: [['commission_date', 'DESC']],
  });

  return { commissions: rows, total: count };
};

const getById = async (tenantId, commissionId) => {
  const commission = await db.Commission.findOne({
    where: { id: commissionId, tenant_id: tenantId },
    include: [
      { model: db.User, as: 'salesUser' },
      { model: db.Deal, as: 'deal' },
      { model: db.Invoice, as: 'invoice' },
      { model: db.Lot, as: 'lot' },
    ],
  });

  if (!commission) throw ApiError.notFound('Commission not found');
  return commission;
};

const calculateCommission = async (tenantId, data) => {
  const {
    salesUserId,
    dealId,
    invoiceId,
    lotId,
    baseAmount,
    commissionRate,
    thresholdAmount,
    accrualBasis,
  } = data;

  // Check if threshold is met
  if (thresholdAmount && baseAmount < thresholdAmount) {
    return {
      eligible: false,
      reason: 'Threshold not met',
      thresholdAmount,
      baseAmount,
    };
  }

  // Calculate commission
  const commissionableAmount = baseAmount;
  const commissionAmount = (commissionableAmount * commissionRate) / 100;

  // Determine commission date based on accrual basis
  let commissionDate = new Date();
  let status = COMMISSION_STATUS.PENDING;

  if (accrualBasis === 'invoice_created') {
    status = COMMISSION_STATUS.ACCRUED;
  } else if (accrualBasis === 'payment_received') {
    // Commission will be pending until payment is received
    if (invoiceId) {
      const invoice = await db.Invoice.findOne({
        where: { id: invoiceId, tenant_id: tenantId },
      });

      if (invoice && invoice.status === INVOICE_STATUS.PAID) {
        status = COMMISSION_STATUS.ACCRUED;
      }
    }
  }

  return {
    eligible: true,
    salesUserId,
    dealId,
    invoiceId,
    lotId,
    baseAmount,
    commissionRate,
    commissionableAmount,
    commissionAmount,
    commissionDate,
    status,
    thresholdAmount,
    accrualBasis,
  };
};

const create = async (tenantId, userId, data) => {
  const calculationResult = await calculateCommission(tenantId, data);

  if (!calculationResult.eligible) {
    throw ApiError.badRequest(`Commission calculation failed: ${calculationResult.reason}`);
  }

  const commissionNumber = generateReferenceNumber('COMM');

  const commission = await db.Commission.create({
    tenant_id: tenantId,
    commission_number: commissionNumber,
    sales_user_id: calculationResult.salesUserId,
    deal_id: calculationResult.dealId,
    invoice_id: calculationResult.invoiceId,
    lot_id: calculationResult.lotId,
    commission_date: calculationResult.commissionDate,
    base_amount: calculationResult.baseAmount,
    commission_rate: calculationResult.commissionRate,
    commissionable_amount: calculationResult.commissionableAmount,
    commission_amount: calculationResult.commissionAmount,
    threshold_amount: calculationResult.thresholdAmount,
    accrual_basis: calculationResult.accrualBasis,
    status: calculationResult.status,
    calculated_by: userId,
    notes: data.notes,
  });

  return await getById(tenantId, commission.id);
};

const approve = async (tenantId, commissionId, userId) => {
  const commission = await db.Commission.findOne({
    where: { id: commissionId, tenant_id: tenantId },
  });

  if (!commission) throw ApiError.notFound('Commission not found');

  if (commission.status !== COMMISSION_STATUS.ACCRUED && commission.status !== COMMISSION_STATUS.PENDING) {
    throw ApiError.badRequest('Only accrued or pending commissions can be approved');
  }

  await commission.update({
    status: COMMISSION_STATUS.APPROVED,
    approved_by: userId,
    approved_at: new Date(),
  });

  return await getById(tenantId, commissionId);
};

const processPayment = async (tenantId, commissionId, userId) => {
  const commission = await db.Commission.findOne({
    where: { id: commissionId, tenant_id: tenantId },
  });

  if (!commission) throw ApiError.notFound('Commission not found');

  if (commission.status !== COMMISSION_STATUS.APPROVED) {
    throw ApiError.badRequest('Only approved commissions can be paid');
  }

  await commission.update({
    status: COMMISSION_STATUS.PAID,
    payment_date: new Date(),
    paid_by: userId,
  });

  // TODO: Create entry in Payroll or Accounts Payable based on employee type

  return await getById(tenantId, commissionId);
};

const reverseCommission = async (tenantId, commissionId, userId, reason) => {
  const commission = await db.Commission.findOne({
    where: { id: commissionId, tenant_id: tenantId },
  });

  if (!commission) throw ApiError.notFound('Commission not found');

  if (commission.status === COMMISSION_STATUS.REVERSED || commission.status === COMMISSION_STATUS.CANCELLED) {
    throw ApiError.badRequest('Commission already reversed or cancelled');
  }

  await commission.update({
    status: COMMISSION_STATUS.REVERSED,
    reversal_reason: reason,
    reversed_by: userId,
    reversed_at: new Date(),
  });

  return await getById(tenantId, commissionId);
};

const getCommissionSummary = async (tenantId, filters) => {
  const { salesUserId, startDate, endDate } = filters;
  const where = { tenant_id: tenantId };

  if (salesUserId) where.sales_user_id = salesUserId;
  if (startDate && endDate) {
    where.commission_date = { [Op.between]: [startDate, endDate] };
  }

  const [totalCommissions, totalEarned, totalPending, totalPaid] = await Promise.all([
    db.Commission.count({ where }),
    db.Commission.sum('commission_amount', { where }),
    db.Commission.sum('commission_amount', {
      where: { ...where, status: { [Op.in]: [COMMISSION_STATUS.PENDING, COMMISSION_STATUS.ACCRUED, COMMISSION_STATUS.APPROVED] } },
    }),
    db.Commission.sum('commission_amount', {
      where: { ...where, status: COMMISSION_STATUS.PAID },
    }),
  ]);

  return {
    totalCommissions: totalCommissions || 0,
    totalEarned: totalEarned || 0,
    totalPending: totalPending || 0,
    totalPaid: totalPaid || 0,
  };
};

module.exports = {
  getAll,
  getById,
  calculateCommission,
  create,
  approve,
  processPayment,
  reverseCommission,
  getCommissionSummary,
};
