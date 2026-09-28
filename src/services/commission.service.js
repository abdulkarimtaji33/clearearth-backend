/**
 * Sales Commission Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const jeService = require('./journalEntry.service');
const { Op } = db.Sequelize;

const SALES_ROLES = ['sales', 'sales_executive', 'sales_manager'];

/** Admin sets (or updates) a user's active commission rate. Deactivates any prior active row. */
const setRate = async (tenantId, actorUserId, targetUserId, percentage, effectiveFrom) => {
  const pct = parseFloat(percentage);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    throw ApiError.badRequest('percentage must be a number between 0 and 100');
  }
  if (!effectiveFrom) throw ApiError.badRequest('effectiveFrom is required');

  const user = await db.User.findOne({ where: { id: targetUserId, tenant_id: tenantId } });
  if (!user) throw ApiError.notFound('User not found');

  const row = await db.sequelize.transaction(async (t) => {
    await db.CommissionSetting.update(
      { is_active: false },
      { where: { tenant_id: tenantId, user_id: targetUserId, is_active: true }, transaction: t }
    );
    return db.CommissionSetting.create(
      {
        tenant_id: tenantId,
        user_id: targetUserId,
        commission_percentage: pct,
        effective_from: effectiveFrom,
        is_active: true,
        created_by: actorUserId || null,
      },
      { transaction: t }
    );
  });

  return row;
};

/** Returns the current active commission-setting row for a user, or null. */
const getRateForUser = async (tenantId, userId) => {
  return db.CommissionSetting.findOne({
    where: { tenant_id: tenantId, user_id: userId, is_active: true },
    order: [['id', 'DESC']],
  });
};

/** Admin settings screen: every sales-role user with their current active rate (0/null if unset). */
const getAllRates = async (tenantId) => {
  const users = await db.User.findAll({
    where: { tenant_id: tenantId },
    attributes: ['id', 'first_name', 'last_name', 'email', 'status'],
    include: [
      {
        model: db.Role,
        as: 'role',
        attributes: ['id', 'name'],
        required: true,
        where: { name: { [Op.in]: SALES_ROLES } },
      },
    ],
    order: [['first_name', 'ASC']],
  });

  const rates = await db.CommissionSetting.findAll({
    where: { tenant_id: tenantId, is_active: true },
  });
  const rateByUser = {};
  rates.forEach((r) => { rateByUser[r.user_id] = r; });

  return users.map((u) => {
    const plain = u.get({ plain: true });
    const rate = rateByUser[u.id];
    return {
      userId: u.id,
      firstName: plain.first_name,
      lastName: plain.last_name,
      email: plain.email,
      roleName: plain.role?.name,
      status: plain.status,
      commissionPercentage: rate ? parseFloat(rate.commission_percentage) : 0,
      effectiveFrom: rate ? rate.effective_from : null,
      settingId: rate ? rate.id : null,
    };
  });
};

/**
 * Called synchronously during quotation approval. Opt-in — no active rate or a
 * 0% rate means no commission is created (not an error).
 * Idempotent on quotation_id (unique constraint + pre-check).
 */
const createFromQuotation = async (tenantId, quotation, transaction = null) => {
  const existing = await db.Commission.findOne({
    where: { tenant_id: tenantId, quotation_id: quotation.id },
    transaction,
  });
  if (existing) return existing;

  const rate = await getRateForUser(tenantId, quotation.prepared_by);
  if (!rate) return null;
  const pct = parseFloat(rate.commission_percentage);
  if (!Number.isFinite(pct) || pct <= 0) return null;

  const amount = parseFloat(quotation.quotation_amount) || 0;
  const commissionAmount = Math.round((amount * pct / 100) * 100) / 100;

  const commission = await db.Commission.create(
    {
      tenant_id: tenantId,
      user_id: quotation.prepared_by,
      quotation_id: quotation.id,
      deal_id: quotation.deal_id || null,
      quotation_amount: amount,
      commission_percentage: pct,
      commission_amount: commissionAmount,
      status: 'accrued',
    },
    { transaction }
  );

  try {
    const expenseAccId = await jeService.getSystemAccountId(tenantId, '5710');
    const payableAccId = await jeService.getSystemAccountId(tenantId, '2410');
    const entryId = await jeService.createJournalEntry(
      tenantId,
      quotation.approved_by || quotation.prepared_by,
      {
        entryDate: new Date().toISOString().slice(0, 10),
        description: `Sales Commission — Quotation #${quotation.reference_number || quotation.id}`,
        sourceType: 'commission',
        sourceId: commission.id,
        lines: [
          { accountId: expenseAccId, debit: commissionAmount, credit: 0 },
          { accountId: payableAccId, debit: 0, credit: commissionAmount },
        ],
      },
      transaction
    );
    await commission.update({ journal_entry_id: entryId }, { transaction });
  } catch (jeErr) {
    console.warn('[GL] commission journal entry skipped:', jeErr.message);
  }

  return commission;
};

/** Standalone commission payout (not via payroll). */
const markPaid = async (tenantId, actorUserId, commissionId) => {
  const commission = await db.Commission.findOne({ where: { id: commissionId, tenant_id: tenantId } });
  if (!commission) throw ApiError.notFound('Commission not found');
  if (commission.status === 'paid') throw ApiError.badRequest('Commission is already paid');
  if (commission.status === 'in_payroll') throw ApiError.badRequest('This commission has been folded into a payroll run and cannot be paid separately');

  const amount = parseFloat(commission.commission_amount) || 0;

  await db.sequelize.transaction(async (t) => {
    await commission.update({ status: 'paid', paid_at: new Date() }, { transaction: t });

    try {
      const payableAccId = await jeService.getSystemAccountId(tenantId, '2410');
      const cashAccId = await jeService.getSystemAccountId(tenantId, '1000');
      await jeService.createJournalEntry(
        tenantId,
        actorUserId,
        {
          entryDate: new Date().toISOString().slice(0, 10),
          description: `Commission Payment — Quotation #${commission.quotation_id}`,
          sourceType: 'commission_payment',
          sourceId: commission.id,
          lines: [
            { accountId: payableAccId, debit: amount, credit: 0 },
            { accountId: cashAccId, debit: 0, credit: amount },
          ],
        },
        t
      );
    } catch (jeErr) {
      console.warn('[GL] commission payment journal entry skipped:', jeErr.message);
    }
  });

  return commission.reload();
};

/** Sales user's own commission history with running totals. */
const getMine = async (tenantId, userId, filters = {}) => {
  const { offset, limit, status, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId, user_id: userId };
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
    if (dateTo) where.created_at[Op.lte] = new Date(`${dateTo}T23:59:59`);
  }

  const include = [
    { model: db.Quotation, as: 'quotation', attributes: ['id', 'reference_number', 'quotation_date'], required: false },
  ];

  const { count, rows } = await db.Commission.findAndCountAll({
    where,
    include,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  const totals = await db.Commission.findAll({
    where: { tenant_id: tenantId, user_id: userId },
    attributes: [
      'status',
      [db.sequelize.fn('SUM', db.sequelize.col('commission_amount')), 'total'],
    ],
    group: ['status'],
    raw: true,
  });
  const sumByStatus = {};
  totals.forEach((r) => { sumByStatus[r.status] = parseFloat(r.total) || 0; });

  return {
    commissions: rows,
    total: count,
    totalAccrued: sumByStatus.accrued || 0,
    totalPaid: sumByStatus.paid || 0,
    totalInPayroll: sumByStatus.in_payroll || 0,
  };
};

/** Admin view, filterable. */
const getAll = async (tenantId, filters = {}) => {
  const { offset, limit, status, userId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  if (userId) where.user_id = userId;
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
    if (dateTo) where.created_at[Op.lte] = new Date(`${dateTo}T23:59:59`);
  }

  const include = [
    { model: db.User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    { model: db.Quotation, as: 'quotation', attributes: ['id', 'reference_number', 'quotation_date'], required: false },
  ];

  const { count, rows } = await db.Commission.findAndCountAll({
    where,
    include,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { commissions: rows, total: count };
};

module.exports = {
  SALES_ROLES,
  setRate,
  getRateForUser,
  getAllRates,
  createFromQuotation,
  markPaid,
  getMine,
  getAll,
};
