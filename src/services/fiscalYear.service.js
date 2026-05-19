const db = require('../models');
const ApiError = require('../utils/apiError');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function lastDayOfMonth(year, month) { // month 0-11
  return new Date(year, month + 1, 0);
}

async function createFiscalYear(tenantId, userId, { name, startDate, endDate }) {
  if (!name || !startDate || !endDate) throw ApiError.badRequest('name, startDate, endDate are required');
  if (startDate >= endDate) throw ApiError.badRequest('startDate must be before endDate');

  const t = await db.sequelize.transaction();
  try {
    const fy = await db.FiscalYear.create(
      { tenant_id: tenantId, name, start_date: startDate, end_date: endDate, status: 'open', created_by: userId },
      { transaction: t }
    );

    // Auto-create monthly periods
    const start = new Date(`${startDate}T12:00:00`);
    let current = new Date(start);
    let periodNum = 1;
    while (toDateStr(current) <= endDate) {
      const pStart = toDateStr(current);
      const pEnd = toDateStr(lastDayOfMonth(current.getFullYear(), current.getMonth()));
      const monthName = `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;

      await db.AccountingPeriod.create(
        {
          tenant_id: tenantId,
          fiscal_year_id: fy.id,
          period_number: periodNum,
          name: monthName,
          start_date: pStart,
          end_date: pEnd > endDate ? endDate : pEnd,
          status: 'open',
        },
        { transaction: t }
      );

      periodNum++;
      current = addMonths(current, 1);
      current.setDate(1);
      if (periodNum > 24) break; // safety cap
    }

    await t.commit();
    return getFiscalYearById(tenantId, fy.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

const getFiscalYearById = async (tenantId, id) => {
  const fy = await db.FiscalYear.findOne({
    where: { id, tenant_id: tenantId },
    include: [{ model: db.AccountingPeriod, as: 'periods', order: [['period_number', 'ASC']] }],
  });
  if (!fy) throw ApiError.notFound('Fiscal year not found');
  return fy;
};

const listFiscalYears = async (tenantId) => {
  return db.FiscalYear.findAll({
    where: { tenant_id: tenantId },
    include: [{ model: db.AccountingPeriod, as: 'periods', order: [['period_number', 'ASC']] }],
    order: [['start_date', 'DESC']],
  });
};

const closeFiscalYear = async (tenantId, userId, fiscalYearId) => {
  const fy = await getFiscalYearById(tenantId, fiscalYearId);
  if (fy.status === 'closed') throw ApiError.conflict('Fiscal year is already closed');

  const t = await db.sequelize.transaction();
  try {
    await db.AccountingPeriod.update(
      { status: 'closed', closed_by: userId, closed_at: new Date() },
      { where: { fiscal_year_id: fiscalYearId, status: 'open' }, transaction: t }
    );
    await fy.update({ status: 'closed' }, { transaction: t });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
  return getFiscalYearById(tenantId, fiscalYearId);
};

const closePeriod = async (tenantId, userId, periodId) => {
  const period = await db.AccountingPeriod.findOne({ where: { id: periodId, tenant_id: tenantId } });
  if (!period) throw ApiError.notFound('Period not found');
  if (period.status === 'closed') throw ApiError.conflict('Period is already closed');
  await period.update({ status: 'closed', closed_by: userId, closed_at: new Date() });
  return period;
};

const reopenPeriod = async (tenantId, periodId) => {
  const period = await db.AccountingPeriod.findOne({ where: { id: periodId, tenant_id: tenantId } });
  if (!period) throw ApiError.notFound('Period not found');
  await period.update({ status: 'open', closed_by: null, closed_at: null });
  return period;
};

module.exports = {
  createFiscalYear,
  listFiscalYears,
  getFiscalYearById,
  closeFiscalYear,
  closePeriod,
  reopenPeriod,
};
