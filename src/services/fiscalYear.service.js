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

  const overlap = await db.FiscalYear.findOne({
    where: {
      tenant_id: tenantId,
      start_date: { [db.Sequelize.Op.lte]: endDate },
      end_date: { [db.Sequelize.Op.gte]: startDate },
    },
  });
  if (overlap) throw ApiError.conflict(`These dates overlap the existing fiscal year ${overlap.name}`);

  const t = await db.sequelize.transaction();
  try {
    const fy = await db.FiscalYear.create(
      { tenant_id: tenantId, name, start_date: startDate, end_date: endDate, status: 'open', created_by: userId },
      { transaction: t }
    );

    // Auto-create monthly periods (calendar months; first/last are clipped to the year's dates)
    let year = parseInt(startDate.slice(0, 4), 10);
    let month = parseInt(startDate.slice(5, 7), 10) - 1;
    const pad = (n) => String(n).padStart(2, '0');
    let periodNum = 1;
    for (;;) {
      const monthStart = `${year}-${pad(month + 1)}-01`;
      if (monthStart > endDate) break;
      const monthEnd = `${year}-${pad(month + 1)}-${pad(lastDayOfMonth(year, month).getDate())}`;
      await db.AccountingPeriod.create(
        {
          tenant_id: tenantId,
          fiscal_year_id: fy.id,
          period_number: periodNum,
          name: `${MONTHS[month]} ${year}`,
          start_date: monthStart < startDate ? startDate : monthStart,
          end_date: monthEnd > endDate ? endDate : monthEnd,
          status: 'open',
        },
        { transaction: t }
      );
      periodNum += 1;
      month += 1;
      if (month > 11) { month = 0; year += 1; }
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
  // A period inside a closed fiscal year is only usable if the year is open again.
  await db.FiscalYear.update({ status: 'open' }, { where: { id: period.fiscal_year_id, tenant_id: tenantId } });
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
