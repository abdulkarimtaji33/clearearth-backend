/**
 * Role-aware dashboard overview
 */
const db = require('../models');
const { Op, fn, col, literal } = db.Sequelize;
const receivablesService = require('./receivables.service');
const payablesService = require('./payables.service');
const driverService = require('./driver.service');
const { baseCurrency } = require('../utils/currency');

const OPEN_DEAL_STATUSES = ['new', 'approved', 'quotation_sent', 'negotiation'];
const CLOSED_WON = 'won';
const CLOSED_LOST = 'lost';

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Monday-based start of the week containing `d`. */
function startOfWeek(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt;
}

const PERIODS = ['today', 'week', 'month', 'last_month', '3months', '6months', 'year', 'custom'];
const DAY_MS = 86400000;

function parseYmd(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Resolves the dashboard date filter into a current range plus the equally long
 * range immediately before it (used for "vs last period"). `to` is capped at now.
 * Presets: today, week, month (default), last_month, 3months, 6months, year, custom (+ dateFrom/dateTo).
 */
function startOfPeriod(period = 'month', dateFrom, dateTo) {
  const now = new Date();
  const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const eod = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  let from;
  let periodEnd;

  if (period === 'custom') {
    const f = parseYmd(dateFrom);
    const t = parseYmd(dateTo);
    if (f && t) {
      from = sod(f);
      periodEnd = eod(t < f ? f : t);
    } else {
      period = 'month';
    }
  }
  if (period === 'today') {
    from = sod(now); periodEnd = eod(now);
  } else if (period === 'week') {
    from = startOfWeek(now); periodEnd = eod(new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6));
  } else if (period === 'last_month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === '3months') {
    from = sod(new Date(now.getFullYear(), now.getMonth() - 2, 1)); periodEnd = eod(now);
  } else if (period === '6months') {
    from = sod(new Date(now.getFullYear(), now.getMonth() - 5, 1)); periodEnd = eod(now);
  } else if (period === 'year') {
    from = new Date(now.getFullYear(), 0, 1); periodEnd = eod(now);
  } else if (period !== 'custom') {
    period = 'month';
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const to = periodEnd < now ? periodEnd : now;
  const spanMs = periodEnd.getTime() - from.getTime() + 1;
  const prevTo = new Date(from);
  const prevFrom = new Date(from.getTime() - spanMs);
  return { period, from, to, periodEnd, prevFrom, prevTo };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatPeriodLabel({ period, from, periodEnd }) {
  const fmt = (d) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  if (period === 'today') return fmt(from);
  if (period === 'month' || period === 'last_month') return `${MONTH_NAMES[from.getMonth()]} ${from.getFullYear()}`;
  return `${fmt(from)} – ${fmt(periodEnd < new Date() ? periodEnd : new Date())}`;
}

function pctDelta(cur, prev) {
  const c = parseFloat(cur) || 0;
  const p = parseFloat(prev) || 0;
  if (!p) return c > 0 ? 100 : 0;
  return Math.round(((c - p) / p) * 1000) / 10;
}

/** Splits [from,to] into ~12 equal buckets (min 1 day each). */
function trendBuckets(range) {
  const spanDays = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / DAY_MS));
  const stepDays = Math.max(1, Math.ceil(spanDays / 12));
  const stepMs = stepDays * DAY_MS;
  const count = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / stepMs));
  return { since: range.from, stepMs, count };
}

/** Sums `valueField` (or counts rows) per bucket across the selected range. */
async function rangeTrend(model, tenantId, range, dateField, extraWhere = {}, valueField = null) {
  const { since, stepMs, count } = trendBuckets(range);
  const rows = await model.findAll({
    where: { tenant_id: tenantId, ...extraWhere, [dateField]: { [Op.gte]: range.from, [Op.lte]: range.to } },
    attributes: [dateField, ...(valueField ? [valueField] : [])],
    raw: true,
  }).catch(() => []);

  const buckets = Array.from({ length: count }, (_, i) => ({ start: new Date(since.getTime() + i * stepMs), value: 0 }));
  rows.forEach((r) => {
    const d = r[dateField] instanceof Date ? r[dateField] : new Date(r[dateField]);
    if (Number.isNaN(d.getTime())) return;
    const idx = Math.floor((d.getTime() - since.getTime()) / stepMs);
    if (idx >= 0 && idx < count) buckets[idx].value += valueField ? (parseFloat(r[valueField]) || 0) : 1;
  });
  return buckets.map((b) => ({ date: b.start.toISOString().slice(0, 10), value: b.value }));
}

/** Deal rows bucketed into otc/otp/foc counts across the selected range. */
async function rangeDealTypeTrend(tenantId, range) {
  const { since, stepMs, count } = trendBuckets(range);
  const rows = await db.Deal.findAll({
    where: { tenant_id: tenantId, created_at: { [Op.gte]: range.from, [Op.lte]: range.to } },
    attributes: ['deal_type', 'created_at'],
    raw: true,
  }).catch(() => []);

  const buckets = Array.from({ length: count }, (_, i) => ({ start: new Date(since.getTime() + i * stepMs), otc: 0, otp: 0, foc: 0 }));
  rows.forEach((r) => {
    const d = r.created_at instanceof Date ? r.created_at : new Date(r.created_at);
    if (Number.isNaN(d.getTime())) return;
    const idx = Math.floor((d.getTime() - since.getTime()) / stepMs);
    if (idx < 0 || idx >= count) return;
    if (r.deal_type === 'offer_to_charge') buckets[idx].otc += 1;
    else if (r.deal_type === 'offer_to_purchase') buckets[idx].otp += 1;
    else if (r.deal_type === 'free_of_charge') buckets[idx].foc += 1;
  });
  return buckets.map((b) => ({ date: b.start.toISOString().slice(0, 10), otc: b.otc, otp: b.otp, foc: b.foc }));
}

const QUOTATION_SENT_OR_BEYOND = ['sent', 'under_review', 'revised', 'pending_approval', 'approved', 'rejected'];

/**
 * Builds the "Operations Pulse" panel payload for the admin dashboard —
 * additive to `getAdminOverview`'s existing response, never required by it.
 */
async function getPulseData(tenantId, range) {
  const period = range.period;
  const { from, to, prevFrom, prevTo } = range;

  const periodWhere = (field = 'created_at') => ({ [field]: { [Op.gte]: from, [Op.lte]: to } });
  const prevWhere = (field = 'created_at') => ({ [field]: { [Op.gte]: prevFrom, [Op.lt]: prevTo } });

  const [
    leadsCreated, leadsCreatedPrev,
    dealsConverted, dealsConvertedPrev,
    quotationsSent, quotationsSentPrev,
    dealsWon, dealsWonPrev,
    woScheduled, woScheduledPrev,
    woCompleted, woCompletedPrev,
    invoicesRows, invoicesRowsPrev,
    dealTypeCurRows,
    arSummary, apSummary,
  ] = await Promise.all([
    db.Lead.count({ where: { tenant_id: tenantId, ...periodWhere() } }).catch(() => 0),
    db.Lead.count({ where: { tenant_id: tenantId, ...prevWhere() } }).catch(() => 0),
    db.Deal.count({ where: { tenant_id: tenantId, ...periodWhere() } }).catch(() => 0),
    db.Deal.count({ where: { tenant_id: tenantId, ...prevWhere() } }).catch(() => 0),
    db.Quotation.count({ where: { tenant_id: tenantId, status: { [Op.in]: QUOTATION_SENT_OR_BEYOND }, ...periodWhere() } }).catch(() => 0),
    db.Quotation.count({ where: { tenant_id: tenantId, status: { [Op.in]: QUOTATION_SENT_OR_BEYOND }, ...prevWhere() } }).catch(() => 0),
    db.Deal.count({ where: { tenant_id: tenantId, status: 'won', ...periodWhere('updated_at') } }).catch(() => 0),
    db.Deal.count({ where: { tenant_id: tenantId, status: 'won', ...prevWhere('updated_at') } }).catch(() => 0),
    db.WorkOrder.count({ where: { tenant_id: tenantId, ...periodWhere() } }).catch(() => 0),
    db.WorkOrder.count({ where: { tenant_id: tenantId, ...prevWhere() } }).catch(() => 0),
    db.WorkOrder.count({ where: { tenant_id: tenantId, status: 'completed', ...periodWhere('updated_at') } }).catch(() => 0),
    db.WorkOrder.count({ where: { tenant_id: tenantId, status: 'completed', ...prevWhere('updated_at') } }).catch(() => 0),
    db.TaxInvoice.findAll({ where: { tenant_id: tenantId, ...periodWhere() }, attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']], raw: true }).catch(() => [{ total: 0 }]),
    db.TaxInvoice.findAll({ where: { tenant_id: tenantId, ...prevWhere() }, attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']], raw: true }).catch(() => [{ total: 0 }]),
    db.Deal.findAll({ where: { tenant_id: tenantId, ...periodWhere() }, attributes: ['deal_type'], raw: true }).catch(() => []),
    receivablesService.getAgingSummary(tenantId, {}).catch(() => ({ buckets: {} })),
    payablesService.getAgingSummary(tenantId, {}).catch(() => ({ buckets: {} })),
  ]);

  const invoicesGenerated = parseFloat(invoicesRows[0]?.total || 0);
  const invoicesGeneratedPrev = parseFloat(invoicesRowsPrev[0]?.total || 0);

  const [
    leadsTrend, dealsConvertedTrend, quotationsSentTrend, dealsWonTrend,
    woScheduledTrend, woCompletedTrend, invoicesTrend, dealsByTypeTrend,
  ] = await Promise.all([
    rangeTrend(db.Lead, tenantId, range, 'created_at'),
    rangeTrend(db.Deal, tenantId, range, 'created_at'),
    rangeTrend(db.Quotation, tenantId, range, 'created_at', { status: { [Op.in]: QUOTATION_SENT_OR_BEYOND } }),
    rangeTrend(db.Deal, tenantId, range, 'updated_at', { status: 'won' }),
    rangeTrend(db.WorkOrder, tenantId, range, 'created_at'),
    rangeTrend(db.WorkOrder, tenantId, range, 'updated_at', { status: 'completed' }),
    rangeTrend(db.TaxInvoice, tenantId, range, 'created_at', {}, 'total'),
    rangeDealTypeTrend(tenantId, range),
  ]);

  const dealTypeCounts = { otc: 0, otp: 0, foc: 0 };
  dealTypeCurRows.forEach((r) => {
    if (r.deal_type === 'offer_to_charge') dealTypeCounts.otc += 1;
    else if (r.deal_type === 'offer_to_purchase') dealTypeCounts.otp += 1;
    else if (r.deal_type === 'free_of_charge') dealTypeCounts.foc += 1;
  });

  const receivables = Object.values(arSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const payables = Object.values(apSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const arB = arSummary.buckets || {};
  const apB = apSummary.buckets || {};

  return {
    period,
    periodLabel: formatPeriodLabel(range),
    updatedAt: new Date().toISOString(),
    metrics: [
      { key: 'leadsCreated', label: 'Leads Created', value: leadsCreated, deltaPct: pctDelta(leadsCreated, leadsCreatedPrev), trend: leadsTrend },
      { key: 'dealsConverted', label: 'Deals Converted', value: dealsConverted, deltaPct: pctDelta(dealsConverted, dealsConvertedPrev), trend: dealsConvertedTrend },
      { key: 'quotationsSent', label: 'Quotations Sent', value: quotationsSent, deltaPct: pctDelta(quotationsSent, quotationsSentPrev), trend: quotationsSentTrend },
      { key: 'dealsWon', label: 'Deals Won', value: dealsWon, deltaPct: pctDelta(dealsWon, dealsWonPrev), trend: dealsWonTrend },
      { key: 'workOrdersScheduled', label: 'Work Orders Scheduled', value: woScheduled, deltaPct: pctDelta(woScheduled, woScheduledPrev), trend: woScheduledTrend },
      { key: 'workOrdersCompleted', label: 'Work Orders Completed', value: woCompleted, deltaPct: pctDelta(woCompleted, woCompletedPrev), trend: woCompletedTrend },
      { key: 'invoicesGenerated', label: 'Invoices Generated', value: invoicesGenerated, deltaPct: pctDelta(invoicesGenerated, invoicesGeneratedPrev), trend: invoicesTrend, format: 'currency' },
    ],
    dealsByType: {
      period: dealTypeCounts,
      trend: dealsByTypeTrend,
    },
    receivablesPayables: {
      receivables,
      payables,
      receivablesAging: {
        '0-30': (arB.current || 0) + (arB.bucket_1_30 || 0),
        '31-60': arB.bucket_31_60 || 0,
        '61-90': arB.bucket_61_90 || 0,
        '90+': (arB.bucket_over_90 || 0) + (arB.bucket_no_due_date || 0),
      },
      payablesAging: {
        '0-30': (apB.current || 0) + (apB.bucket_1_30 || 0),
        '31-60': apB.bucket_31_60 || 0,
        '61-90': apB.bucket_61_90 || 0,
        '90+': (apB.bucket_over_90 || 0) + (apB.bucket_no_due_date || 0),
      },
    },
  };
}

async function countByStatus(model, tenantId, statusField = 'status', extraWhere = {}) {
  const rows = await model.findAll({
    where: { tenant_id: tenantId, ...extraWhere },
    attributes: [statusField, [fn('COUNT', col('id')), 'count']],
    group: [statusField],
    raw: true,
  });
  return rows.reduce((acc, r) => {
    acc[r[statusField]] = parseInt(r.count, 10);
    return acc;
  }, {});
}

async function getAdminOverview(tenantId, range) {
  const monthFrom = range.from;
  const rangeTo = range.to;
  const [
    arSummary, apSummary, woByStatus, dealsByStatus,
    pendingExpenses, draftGrns, pendingPos, unassignedPickups, revenueRows,
    completedWOsThisMonth, wonDealsThisMonth, recentDeals, recentWorkOrders,
    pulse,
  ] = await Promise.all([
    receivablesService.getAgingSummary(tenantId, {}),
    payablesService.getAgingSummary(tenantId, {}),
    countByStatus(db.WorkOrder, tenantId),
    countByStatus(db.Deal, tenantId),
    db.WorkOrderTaskExpense.count({
      where: { accounts_status: 'pending' },
      include: [{ model: db.WorkOrderTask, as: 'workOrderTask', required: true, include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }] }],
    }).catch(() => 0),
    db.Grn.count({ where: { tenant_id: tenantId, status: { [Op.in]: ['new', 'submitted'] } } }).catch(() => 0),
    db.PurchaseOrder.count({ where: { tenant_id: tenantId, status: 'pending' } }).catch(() => 0),
    db.WorkOrderTask.count({
      where: { assigned_to: null, [Op.or]: [{ type_of_work: { [Op.like]: '%pickup%' } }] },
      include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }],
    }).catch(() => 0),
    db.TaxInvoice.findAll({
      where: { tenant_id: tenantId, payment_status: 'paid', updated_at: { [Op.gte]: monthFrom, [Op.lte]: rangeTo } },
      attributes: [[fn('SUM', col('paid_amount')), 'total']],
      raw: true,
    }),
    db.WorkOrder.count({ where: { tenant_id: tenantId, status: 'completed', updated_at: { [Op.gte]: monthFrom, [Op.lte]: rangeTo } } }).catch(() => 0),
    db.Deal.count({ where: { tenant_id: tenantId, status: 'won', updated_at: { [Op.gte]: monthFrom, [Op.lte]: rangeTo } } }).catch(() => 0),
    db.Deal.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id', 'deal_number', 'title', 'status', 'total', 'updated_at'],
      order: [['updated_at', 'DESC']],
      limit: 6,
    }).catch(() => []),
    db.WorkOrder.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id', 'title', 'status', 'updated_at'],
      order: [['updated_at', 'DESC']],
      limit: 5,
    }).catch(() => []),
    getPulseData(tenantId, range).catch(() => null),
  ]);

  const outstandingAr = Object.values(arSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const outstandingAp = Object.values(apSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const pendingOutboundsAdmin = await require('./outbound.service').pendingCount(tenantId);

  return {
    role: 'admin',
    kpis: [
      { label: 'Revenue collected', value: parseFloat(revenueRows[0]?.total || 0), format: 'currency' },
      { label: 'Outstanding AR', value: outstandingAr, format: 'currency' },
      { label: 'Outstanding AP', value: outstandingAp, format: 'currency' },
      { label: 'Open deals', value: OPEN_DEAL_STATUSES.reduce((s, st) => s + (dealsByStatus[st] || 0), 0), format: 'number' },
      { label: 'Pending outbounds', value: pendingOutboundsAdmin, format: 'number', highlight: pendingOutboundsAdmin > 0 },
    ],
    stats: {
      completedWOsThisMonth,
      wonDealsThisMonth,
    },
    actionables: [
      { id: 'expenses', label: 'Expense approvals pending', count: pendingExpenses, href: '/erp/accounts/work-orders' },
      { id: 'grn', label: 'GRNs awaiting approval', count: draftGrns, href: '/erp/grn' },
      { id: 'outbound', label: 'Pending outbounds', count: pendingOutboundsAdmin, href: '/erp/outbound' },
      { id: 'po', label: 'POs pending approval', count: pendingPos, href: '/erp/purchase-orders' },
      { id: 'pickup', label: 'Unassigned pickup tasks', count: unassignedPickups, href: '/erp/work-orders' },
    ].filter((a) => a.count > 0),
    charts: {
      workOrdersByStatus: woByStatus,
      dealsByStatus,
    },
    recentDeals: recentDeals.map((d) => d.get({ plain: true })),
    recentWorkOrders: recentWorkOrders.map((w) => w.get({ plain: true })),
    pulse,
  };
}

async function getSalesOverview(tenantId, userId) {
  const monthFrom = monthStart();
  const baseWhere = { tenant_id: tenantId, assigned_to: userId };

  const [deals, openCount, wonMonthCount, openValueRows, missingPickupCount, staleCount] = await Promise.all([
    db.Deal.findAll({
      where: baseWhere,
      attributes: ['id', 'deal_number', 'title', 'status', 'total', 'updated_at', 'pickup_location'],
      order: [['updated_at', 'DESC']],
      limit: 100,
    }),
    db.Deal.count({ where: { ...baseWhere, status: { [Op.in]: OPEN_DEAL_STATUSES } } }),
    db.Deal.count({
      where: { ...baseWhere, status: CLOSED_WON, updated_at: { [Op.gte]: monthFrom } },
    }),
    db.Deal.findAll({
      where: { ...baseWhere, status: { [Op.in]: OPEN_DEAL_STATUSES } },
      attributes: [[fn('COALESCE', fn('SUM', col('total')), 0), 'total']],
      raw: true,
    }),
    db.Deal.count({
      where: {
        ...baseWhere,
        status: CLOSED_WON,
        [Op.or]: [{ pickup_location: null }, { pickup_location: '' }],
      },
    }),
    db.Deal.count({
      where: {
        ...baseWhere,
        status: { [Op.in]: OPEN_DEAL_STATUSES },
        updated_at: { [Op.lt]: new Date(daysAgo(7)) },
      },
    }),
  ]);

  const openValue = parseFloat(openValueRows[0]?.total || 0);
  const open = deals.filter((d) => OPEN_DEAL_STATUSES.includes(d.status));
  const stale = open.filter((d) => d.updated_at < new Date(daysAgo(7)));
  const missingPickup = deals.filter((d) => d.status === CLOSED_WON && !d.pickup_location);

  const pipeline = await Promise.all(
    OPEN_DEAL_STATUSES.map(async (st) => {
      const rows = await db.Deal.findAll({
        where: { ...baseWhere, status: st },
        attributes: [[fn('COUNT', col('id')), 'count'], [fn('COALESCE', fn('SUM', col('total')), 0), 'value']],
        raw: true,
      });
      return {
        status: st,
        count: parseInt(rows[0]?.count || 0, 10),
        value: parseFloat(rows[0]?.value || 0),
      };
    })
  );

  return {
    role: 'sales',
    kpis: [
      {
        label: 'My open deals',
        value: openCount,
        sub: `${baseCurrency()} ${openValue.toLocaleString()}`,
        format: 'number',
      },
      { label: 'Won this month', value: wonMonthCount, format: 'number' },
      { label: 'Needs follow-up', value: staleCount, format: 'number' },
      { label: 'Missing collection info', value: missingPickupCount, format: 'number' },
    ],
    actionables: [
      ...stale.slice(0, 5).map((d) => ({ id: `deal-${d.id}`, label: `${d.deal_number} — no update 7+ days`, href: `/erp/deals/view/${d.id}` })),
      ...missingPickup.slice(0, 3).map((d) => ({ id: `pickup-${d.id}`, label: `${d.deal_number} — add collection details`, href: `/erp/deals/edit/${d.id}` })),
    ],
    pipeline,
    recentDeals: deals.slice(0, 10).map((d) => d.get({ plain: true })),
  };
}

async function getSalesManagerOverview(tenantId) {
  const [deals, pendingDealRows, pendingQuotationRows, recentLeads] = await Promise.all([
    db.Deal.findAll({
      where: { tenant_id: tenantId, status: { [Op.notIn]: [CLOSED_LOST] } },
      attributes: ['id', 'deal_number', 'title', 'status', 'total', 'updated_at', 'assigned_to', 'created_at'],
      include: [{ model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false }],
      order: [['created_at', 'DESC']],
    }),
    db.Deal.findAll({
      where: { tenant_id: tenantId, status: 'pending_approval' },
      attributes: ['id', 'deal_number', 'title', 'total', 'created_at', 'assigned_to'],
      include: [
        { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
        { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name'], required: false },
      ],
      order: [['created_at', 'ASC']],
      limit: 20,
    }),
    db.Quotation.findAll({
      where: { tenant_id: tenantId, status: 'pending_approval' },
      attributes: ['id', 'quotation_amount', 'created_at'],
      include: [
        { model: db.Deal, as: 'deal', attributes: ['id', 'deal_number', 'title'], required: false },
      ],
      order: [['created_at', 'ASC']],
      limit: 20,
    }),
    db.Lead.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id', 'lead_number', 'source', 'status', 'created_at', 'assigned_to'],
      include: [
        { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
        { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
        { model: db.ProductService, as: 'productService', attributes: ['id', 'name'], required: false },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    }),
  ]);

  const pendingDeals = pendingDealRows.length;
  const pendingQuotations = pendingQuotationRows.length;
  const pendingApprovalsTotal = pendingDeals + pendingQuotations;

  const pipelineValue = deals.reduce((s, d) => s + parseFloat(d.total || 0), 0);
  const won = deals.filter((d) => d.status === CLOSED_WON);
  const monthFromDate = new Date(monthStart());
  const wonThisMonth = won.filter((d) => d.updated_at >= monthFromDate);
  const stale = deals.filter((d) => OPEN_DEAL_STATUSES.includes(d.status) && d.updated_at < new Date(daysAgo(10)));

  const byRep = {};
  won.forEach((d) => {
    const key = d.assigned_to || 'unassigned';
    if (!byRep[key]) byRep[key] = { user: d.assignedUser, total: 0, count: 0 };
    byRep[key].total += parseFloat(d.total || 0);
    byRep[key].count += 1;
  });

  const activeDealRows = deals.filter((d) => OPEN_DEAL_STATUSES.includes(d.status));

  return {
    role: 'sales_manager',
    kpis: [
      { label: 'Pipeline value', value: pipelineValue, format: 'currency' },
      { label: 'Won this month', value: wonThisMonth.length, sub: `${won.length} all time`, format: 'number' },
      { label: 'Stale deals (10d+)', value: stale.length, format: 'number' },
      { label: 'Active deals', value: activeDealRows.length, format: 'number' },
    ],
    pendingApprovals: {
      total: pendingApprovalsTotal,
      deals: pendingDeals,
      quotations: pendingQuotations,
      dealRows: pendingDealRows.map((d) => d.get({ plain: true })),
      quotationRows: pendingQuotationRows.map((q) => {
        const plain = q.get({ plain: true });
        return { ...plain, total: plain.quotation_amount };
      }),
    },
    actionables: stale.slice(0, 8).map((d) => ({ id: `stale-${d.id}`, label: `Deal #${d.id} — ${d.title || ''}`.trim(), href: `/erp/deals/view/${d.id}`, dealNumber: d.deal_number })),
    leaderboard: Object.values(byRep).sort((a, b) => b.total - a.total).slice(0, 8),
    pipeline: OPEN_DEAL_STATUSES.map((st) => ({
      status: st,
      count: deals.filter((d) => d.status === st).length,
      value: deals.filter((d) => d.status === st).reduce((s, d) => s + parseFloat(d.total || 0), 0),
    })),
    recentDeals: activeDealRows.slice(0, 10).map((d) => d.get({ plain: true })),
    recentLeads: recentLeads.map((l) => l.get({ plain: true })),
  };
}

async function getInspectionOverview(tenantId, userId) {
  const weekStart = daysAgo(7);

  const [openRequests, completedThisWeek, completedThisMonth] = await Promise.all([
    db.DealInspectionRequest.findAll({
      include: [
        { model: db.Deal, as: 'deal', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'deal_number', 'title'] },
        { model: db.MaterialType, as: 'materialType', required: false },
      ],
      where: {
        status: { [Op.notIn]: ['report_submitted', 'inspection_completed'] },
      },
      order: [
        [db.sequelize.literal(`FIELD(priority, 'critical', 'high', 'medium', 'low')`), 'ASC'],
        ['created_at', 'ASC'],
      ],
      limit: 50,
    }),
    db.DealInspectionRequest.count({
      include: [{ model: db.Deal, as: 'deal', required: true, where: { tenant_id: tenantId } }],
      where: {
        status: { [Op.in]: ['report_submitted', 'inspection_completed'] },
        updated_at: { [Op.gte]: weekStart },
      },
    }).catch(() => 0),
    db.DealInspectionRequest.count({
      include: [{ model: db.Deal, as: 'deal', required: true, where: { tenant_id: tenantId } }],
      where: {
        status: { [Op.in]: ['report_submitted', 'inspection_completed'] },
        updated_at: { [Op.gte]: monthStart() },
      },
    }).catch(() => 0),
  ]);

  const newCount = openRequests.filter((r) => r.status === 'request_submitted').length;
  const inProgress = openRequests.filter((r) => r.status === 'team_assigned').length;

  return {
    role: 'inspection_team',
    kpis: [
      { label: 'New requests', value: newCount, format: 'number', highlight: newCount > 0 },
      { label: 'In progress', value: inProgress, format: 'number' },
      { label: 'Completed this week', value: completedThisWeek, format: 'number' },
      { label: 'Completed this month', value: completedThisMonth, format: 'number' },
    ],
    actionables: openRequests.slice(0, 15).map((r) => ({
      id: `insp-${r.id}`,
      requestId: r.id,
      label: `${r.deal?.deal_number || 'Deal'} — ${r.deal?.title || ''} (${(r.status || '').replace(/_/g, ' ')})`,
      href: `/erp/inspection-requests/${r.id}`,
      priority: r.priority,
      responseStatus: r.response_status || null,
    })),
  };
}

async function getOperationsOverview(tenantId) {
  const today = new Date().toISOString().slice(0, 10);

  const [
    woInProgress, overdueTasks, pendingExpenses, draftGrns, unassignedPickups, overdueTaskRows, driverActivity,
    recentServiceOrderRows, recentPurchaseOrderRows, todayTaskRows, todayCreatedWorkOrders,
    pendingPickupQuotes, pendingPickupPos, unassignedTaskRows, grnsNew, grnsSubmitted, soAwaitingWo, poAwaitingWo,
  ] = await Promise.all([
    db.WorkOrder.count({ where: { tenant_id: tenantId, status: 'in_progress' } }),
    db.WorkOrderTask.count({
      where: { status: { [Op.ne]: 'completed' }, end_date: { [Op.lt]: today } },
      include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }],
    }).catch(() => 0),
    db.WorkOrderTaskExpense.count({
      where: { accounts_status: 'pending' },
      include: [{ model: db.WorkOrderTask, as: 'workOrderTask', required: true, include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }] }],
    }).catch(() => 0),
    db.Grn.count({ where: { tenant_id: tenantId, status: { [Op.in]: ['new', 'submitted'] } } }).catch(() => 0),
    db.WorkOrderTask.findAll({
      where: { assigned_to: null, type_of_work: { [Op.like]: '%pickup%' } },
      include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'title'] }],
      limit: 10,
    }).catch(() => []),
    db.WorkOrderTask.findAll({
      where: { status: { [Op.ne]: 'completed' }, end_date: { [Op.lt]: today } },
      include: [
        { model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'title'] },
        { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
      ],
      order: [['end_date', 'ASC']],
      limit: 10,
    }).catch(() => []),
    db.WorkOrderTask.findAll({
      where: {
        assigned_to: { [Op.ne]: null },
        [Op.or]: [{ type_of_work: { [Op.like]: '%pickup%' } }],
        status: { [Op.ne]: 'completed' },
      },
      include: [
        { model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'title'] },
        { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
      ],
      limit: 10,
    }).catch(() => []),
    db.Quotation.findAll({
      where: { tenant_id: tenantId, status: 'approved' },
      include: [
        { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
        { model: db.WorkOrder, as: 'workOrder', attributes: ['id', 'status'], required: false },
      ],
      order: [['approved_at', 'DESC']],
      limit: 10,
    }).catch(() => []),
    db.PurchaseOrder.findAll({
      where: { tenant_id: tenantId, status: 'approved', company_id: { [Op.ne]: null }, document_type: 'quotation' },
      include: [
        { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
        { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
        { model: db.WorkOrder, as: 'sourceWorkOrder', attributes: ['id', 'status'], required: false },
      ],
      order: [['approved_at', 'DESC']],
      limit: 10,
    }).catch(() => []),
    db.WorkOrderTask.findAll({
      where: {
        status: { [Op.ne]: 'completed' },
        start_date: { [Op.lte]: today },
        [Op.or]: [{ end_date: { [Op.gte]: today } }, { end_date: null }],
      },
      include: [
        { model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'title', 'status'] },
        { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
      ],
      order: [['start_date', 'ASC']],
      limit: 20,
    }).catch(() => []),
    db.WorkOrder.findAll({
      where: {
        tenant_id: tenantId,
        status: { [Op.ne]: 'cancelled' },
        created_at: { [Op.gte]: `${today} 00:00:00`, [Op.lt]: `${today} 23:59:59` },
      },
      attributes: ['id', 'title', 'status'],
      order: [['created_at', 'DESC']],
      limit: 20,
    }).catch(() => []),
    db.Quotation.findAll({
      where: { tenant_id: tenantId, status: 'approved', pickup_date_status: 'pending' },
      include: [{ model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false }],
      order: [['approved_at', 'DESC']],
      limit: 20,
    }).catch(() => []),
    db.PurchaseOrder.findAll({
      where: { tenant_id: tenantId, status: 'approved', pickup_date_status: 'pending', document_type: 'quotation' },
      include: [
        { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
        { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
        { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      ],
      order: [['approved_at', 'DESC']],
      limit: 20,
    }).catch(() => []),
    db.WorkOrderTask.findAll({
      where: { assigned_to: null, status: { [Op.ne]: 'completed' } },
      include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId, status: { [Op.in]: ['new', 'in_progress'] } }, attributes: ['id', 'title'] }],
      order: [['start_date', 'ASC']],
      limit: 20,
    }).catch(() => []),
    db.Grn.count({ where: { tenant_id: tenantId, status: 'new' } }).catch(() => 0),
    db.Grn.count({ where: { tenant_id: tenantId, status: 'submitted' } }).catch(() => 0),
    db.Quotation.count({
      where: { tenant_id: tenantId, status: 'approved', '$workOrder.id$': null },
      include: [{ model: db.WorkOrder, as: 'workOrder', attributes: [], required: false }],
      distinct: true,
    }).catch(() => 0),
    db.PurchaseOrder.count({
      where: { tenant_id: tenantId, status: 'approved', document_type: 'quotation', company_id: { [Op.ne]: null }, '$sourceWorkOrder.id$': null },
      include: [{ model: db.WorkOrder, as: 'sourceWorkOrder', attributes: [], required: false }],
      distinct: true,
    }).catch(() => 0),
  ]);

  const pendingPickupConfirmations = [
    ...pendingPickupQuotes.map((q) => {
      const p = q.get({ plain: true });
      return {
        entityType: 'quotation',
        id: p.id,
        dealId: p.deal?.id || p.deal_id,
        dealTitle: p.deal?.title || p.deal?.deal_number || `Deal #${p.deal_id}`,
        partyName: null,
        requestedPickupDate: p.requested_pickup_date,
      };
    }),
    ...pendingPickupPos.map((po) => {
      const p = po.get({ plain: true });
      return {
        entityType: 'purchase_order',
        id: p.id,
        dealId: p.deal?.id || p.deal_id,
        dealTitle: p.deal?.title || p.deal?.deal_number || (p.deal_id ? `Deal #${p.deal_id}` : null),
        partyName: p.company?.company_name || p.supplier?.company_name || null,
        requestedPickupDate: p.requested_pickup_date,
      };
    }),
  ];

  const unassignedTasks = unassignedTaskRows.map((t) => {
    const p = t.get({ plain: true });
    return {
      taskId: p.id,
      workOrderId: p.work_order_id,
      workOrderTitle: p.workOrder?.title || `WO #${p.work_order_id}`,
      typeOfWork: p.type_of_work,
      startDate: p.start_date,
      endDate: p.end_date,
      status: p.status,
    };
  });

  return {
    role: 'operations_manager',
    counts: {
      ordersAwaitingWo: (soAwaitingWo || 0) + (poAwaitingWo || 0),
      pendingOutbounds: await require('./outbound.service').pendingCount(tenantId),
      grnsNew: grnsNew || 0,
      grnsSubmitted: grnsSubmitted || 0,
      overdueTasks: overdueTasks || 0,
      pendingPickupConfirmations: pendingPickupConfirmations.length,
    },
    pendingPickupConfirmations,
    unassignedTasks,
    kpis: [
      { label: 'Work orders in progress', value: woInProgress, format: 'number' },
      { label: 'Overdue tasks', value: overdueTasks, format: 'number', highlight: overdueTasks > 0 },
      { label: 'Expenses pending', value: pendingExpenses, format: 'number' },
      { label: 'GRNs pending', value: draftGrns, format: 'number' },
      { label: 'Pending outbounds', value: await require('./outbound.service').pendingCount(tenantId), format: 'number' },
    ],
    actionables: [
      pendingExpenses > 0 && { id: 'exp', label: `${pendingExpenses} expense(s) need approval`, count: pendingExpenses, href: '/erp/accounts/work-orders' },
      draftGrns > 0 && { id: 'grn', label: `${draftGrns} GRN(s) pending review`, count: draftGrns, href: '/erp/grn' },
      ...unassignedPickups.map((t) => ({ id: `pickup-${t.id}`, label: `Unassigned pickup: ${t.workOrder?.title || 'WO'}`, href: `/erp/work-orders/edit/${t.work_order_id}` })),
    ].filter(Boolean),
    overdueTasks: overdueTaskRows.map((t) => {
      const plain = t.get({ plain: true });
      return {
        taskId: plain.id,
        workOrderId: plain.work_order_id,
        workOrderTitle: plain.workOrder?.title || `WO #${plain.work_order_id}`,
        assignedTo: plain.assignedUser
          ? `${plain.assignedUser.first_name} ${plain.assignedUser.last_name}`
          : 'Unassigned',
        endDate: plain.end_date,
        status: plain.status,
        typeOfWork: plain.type_of_work,
      };
    }),
    driverActivity: driverActivity.map((t) => {
      const plain = t.get({ plain: true });
      return {
        taskId: plain.id,
        workOrderTitle: plain.workOrder?.title || `WO #${plain.work_order_id}`,
        driverName: plain.assignedUser
          ? `${plain.assignedUser.first_name} ${plain.assignedUser.last_name}`
          : 'Unknown',
        status: plain.status,
        startDate: plain.start_date,
      };
    }),
    recentServiceOrders: recentServiceOrderRows.map((q) => {
      const plain = q.get({ plain: true });
      return {
        id: plain.id,
        dealId: plain.deal?.id || plain.deal_id,
        dealTitle: plain.deal?.title || plain.deal?.deal_number || `Deal #${plain.deal_id}`,
        approvedAt: plain.approved_at,
        requestedPickupDate: plain.requested_pickup_date,
        workOrderId: plain.workOrder?.id || null,
        workOrderStatus: plain.workOrder?.status || null,
      };
    }),
    recentPurchaseOrders: recentPurchaseOrderRows.map((po) => {
      const plain = po.get({ plain: true });
      return {
        id: plain.id,
        dealId: plain.deal?.id || plain.deal_id,
        dealTitle: plain.deal?.title || plain.deal?.deal_number || (plain.deal_id ? `Deal #${plain.deal_id}` : null),
        companyName: plain.company?.company_name || null,
        approvedAt: plain.approved_at,
        requestedPickupDate: plain.requested_pickup_date,
        workOrderId: plain.sourceWorkOrder?.id || null,
        workOrderStatus: plain.sourceWorkOrder?.status || null,
      };
    }),
    todayWorkOrders: (() => {
      const seen = new Map();
      todayTaskRows.forEach((t) => {
        const plain = t.get({ plain: true });
        const woId = plain.work_order_id;
        if (!woId || seen.has(woId)) return;
        seen.set(woId, {
          workOrderId: woId,
          workOrderTitle: plain.workOrder?.title || `WO #${woId}`,
          workOrderStatus: plain.workOrder?.status || null,
          typeOfWork: plain.type_of_work,
          assignedTo: plain.assignedUser
            ? `${plain.assignedUser.first_name} ${plain.assignedUser.last_name}`
            : 'Unassigned',
          startDate: plain.start_date,
          endDate: plain.end_date,
          status: plain.status,
        });
      });
      todayCreatedWorkOrders.forEach((wo) => {
        if (seen.has(wo.id)) return;
        seen.set(wo.id, {
          workOrderId: wo.id,
          workOrderTitle: wo.title || `WO #${wo.id}`,
          workOrderStatus: wo.status || null,
          typeOfWork: 'New work order',
          assignedTo: 'Unassigned',
          startDate: null,
          endDate: null,
          status: wo.status,
        });
      });
      return Array.from(seen.values());
    })(),
  };
}

async function getDriverOverview(tenantId, userId) {
  const pickups = await driverService.listPickups(tenantId, userId);
  const today = new Date().toISOString().slice(0, 10);

  const overdue   = pickups.filter((p) => p.priority === 'overdue');
  const todayList = pickups.filter((p) => p.priority === 'today');
  const upcoming  = pickups.filter((p) => p.priority === 'upcoming');
  const completedToday = pickups.filter((p) => p.taskStatus === 'completed' && p.endDate === today);

  return {
    role: 'driver',
    kpis: [
      { label: 'Overdue', value: overdue.length, format: 'number', highlight: overdue.length > 0, color: 'error' },
      { label: 'Due today', value: todayList.length, format: 'number', highlight: todayList.length > 0, color: 'warning' },
      { label: 'Upcoming', value: upcoming.length, format: 'number' },
      { label: 'Done today', value: completedToday.length, format: 'number', color: 'success' },
    ],
    overdue,
    today: todayList,
    upcoming,
    completedToday,
  };
}

async function getSuperAdminOverview() {
  const [tenants, users, newTenants] = await Promise.all([
    db.Tenant.count({ where: { status: 'active' } }).catch(() => db.Tenant.count()),
    db.User.count(),
    db.Tenant.count({ where: { created_at: { [Op.gte]: monthStart() } } }).catch(() => 0),
  ]);

  const tenantRows = await db.Tenant.findAll({
    attributes: ['id', 'company_name', 'status', 'created_at'],
    order: [['created_at', 'DESC']],
    limit: 20,
  });

  return {
    role: 'super_admin',
    kpis: [
      { label: 'Active tenants', value: tenants, format: 'number' },
      { label: 'Total users', value: users, format: 'number' },
      { label: 'New tenants (month)', value: newTenants, format: 'number' },
    ],
    tenants: tenantRows.map((t) => t.get({ plain: true })),
  };
}

async function getAccountsOverview(tenantId) {
  const [arSummary, apSummary, pendingExpenses] = await Promise.all([
    receivablesService.getAgingSummary(tenantId, {}),
    payablesService.getAgingSummary(tenantId, {}),
    db.WorkOrderTaskExpense.count({
      where: { accounts_status: 'pending' },
      include: [{ model: db.WorkOrderTask, as: 'workOrderTask', required: true, include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }] }],
    }).catch(() => 0),
  ]);

  const outstandingAr = Object.values(arSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const outstandingAp = Object.values(apSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return {
    role: 'accounts',
    kpis: [
      { label: 'Outstanding AR', value: outstandingAr, format: 'currency' },
      { label: 'Outstanding AP', value: outstandingAp, format: 'currency' },
      { label: 'Expense approvals', value: pendingExpenses, format: 'number' },
    ],
    arAgingBuckets: arSummary.buckets || {},
    apAgingBuckets: apSummary.buckets || {},
    actionables: [
      { id: 'recv', label: 'Review receivables', href: '/erp/receivables' },
      { id: 'pay', label: 'Review payables', href: '/erp/payables' },
      pendingExpenses > 0 && { id: 'exp', label: `${pendingExpenses} expenses to approve`, href: '/erp/accounts/work-orders' },
    ].filter(Boolean),
  };
}

/**
 * Which dashboard a user gets is driven by the dashboard.view_* permissions (first match wins),
 * so any custom role can be given any dashboard from the Roles UI.
 */
const DASHBOARD_VARIANTS = [
  ['dashboard.view_super_admin', 'super_admin'],
  ['dashboard.view_admin', 'admin'],
  ['dashboard.view_operations', 'operations_manager'],
  ['dashboard.view_accounts', 'accounts'],
  ['dashboard.view_sales_manager', 'sales_manager'],
  ['dashboard.view_inspection', 'inspection_team'],
  ['dashboard.view_driver', 'driver'],
  ['dashboard.view_sales', 'sales'],
];

const resolveDashboardVariant = (user) => {
  const access = user?.access;
  if (!access) return user?.role?.name || user?.Role?.name || 'sales';
  const hit = DASHBOARD_VARIANTS.find(([perm]) => access.has(perm));
  return hit ? hit[1] : 'sales';
};

const getOverview = async (tenantId, user, options = {}) => {
  const period = PERIODS.includes(options.period) ? options.period : 'month';
  const range = startOfPeriod(period, options.dateFrom, options.dateTo);
  const roleName = resolveDashboardVariant(user);

  switch (roleName) {
    case 'super_admin':
      return getSuperAdminOverview();
    case 'tenant_admin':
    case 'admin':
      return getAdminOverview(tenantId, range);
    case 'sales_manager':
      return getSalesManagerOverview(tenantId);
    case 'sales':
      return getSalesOverview(tenantId, user.id);
    case 'inspection_team':
      return getInspectionOverview(tenantId, user.id);
    case 'operations_manager':
      return getOperationsOverview(tenantId);
    case 'driver':
      return getDriverOverview(tenantId, user.id);
    case 'accounts':
      return getAccountsOverview(tenantId);
    default:
      return getSalesOverview(tenantId, user.id);
  }
};

module.exports = { getOverview, resolveDashboardVariant };
