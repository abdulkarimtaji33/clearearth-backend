/**
 * Accounts receivable (tax invoices with balance due)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

function parseNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function balanceDue(row) {
  const total = parseNum(row.total);
  const paid = row.paid_amount != null ? parseNum(row.paid_amount) : 0;
  return Math.max(0, total - paid);
}

function daysOpen(invoiceDateStr) {
  if (!invoiceDateStr) return 0;
  const inv = new Date(`${invoiceDateStr}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.floor((today - inv) / 86400000);
}

function agingBucketFromDaysOpen(d) {
  if (d <= 30) return 'current';
  if (d <= 60) return '31_60';
  if (d <= 90) return '61_90';
  return 'over_90';
}

const listReceivables = async (tenantId, filters = {}) => {
  const { offset, limit, search, dateFrom, dateTo, paymentStatus, companyId } = filters;

  const where = {
    tenant_id: tenantId,
    payment_status: { [Op.in]: ['unpaid', 'partial'] },
  };
  applyDateOnlyColumnFilter(where, 'invoice_date', dateFrom, dateTo);
  if (paymentStatus && PAYMENT_STATUSES.includes(String(paymentStatus).toLowerCase())) {
    where.payment_status = String(paymentStatus).toLowerCase();
  }

  const dealWhere = {};
  if (companyId) dealWhere.company_id = companyId;
  if (search) {
    const s = `%${String(search).trim()}%`;
    dealWhere[Op.or] = [
      { '$proformaInvoice.deal.company.company_name$': { [Op.like]: s } },
      { '$proformaInvoice.deal.title$': { [Op.like]: s } },
      { tax_invoice_number: { [Op.like]: s } },
    ];
  }

  const { count, rows } = await db.TaxInvoice.findAndCountAll({
    where,
    include: [
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoice',
        required: true,
        include: [
          {
            model: db.Deal,
            as: 'deal',
            required: true,
            where: Object.keys(dealWhere).length ? dealWhere : undefined,
            include: [
              { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
            ],
          },
        ],
      },
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    ],
    offset,
    limit,
    order: [['invoice_date', 'DESC'], ['id', 'DESC']],
    distinct: true,
    subQuery: false,
  });

  const plain = rows.map((r) => {
    const o = r.get({ plain: true });
    o.balance_due = balanceDue(o);
    const dOpen = daysOpen(o.invoice_date);
    o.days_open = dOpen;
    o.aging_bucket = agingBucketFromDaysOpen(dOpen);
    return o;
  });

  return { receivables: plain, total: count };
};

const recordPayment = async (tenantId, taxInvoiceId, body) => {
  const row = await db.TaxInvoice.findOne({
    where: { id: taxInvoiceId, tenant_id: tenantId },
  });
  if (!row) throw ApiError.notFound('Tax invoice not found');

  const add = body.amount != null && body.amount !== '' ? parseFloat(body.amount) : NaN;
  if (!Number.isFinite(add) || add <= 0) throw ApiError.badRequest('amount must be a positive number');

  const total = parseNum(row.total);
  const cur = row.paid_amount != null ? parseNum(row.paid_amount) : 0;
  const next = Math.min(total, cur + add);

  let ps = 'unpaid';
  if (next >= total - 0.01) ps = 'paid';
  else if (next > 0) ps = 'partial';

  await row.update({
    paid_amount: next,
    payment_status: ps,
    payment_method: body.paymentMethod !== undefined ? body.paymentMethod || null : row.payment_method,
    reference_no: body.referenceNo !== undefined ? body.referenceNo || null : row.reference_no,
    remarks:
      body.paymentDate && String(body.paymentDate).trim()
        ? [row.remarks, `Payment ${String(body.paymentDate).trim()}`].filter(Boolean).join('\n')
        : row.remarks,
  });

  const taxInvoiceService = require('./taxInvoice.service');
  return taxInvoiceService.getById(tenantId, taxInvoiceId, {});
};

const getAgingSummary = async (tenantId, filters = {}) => {
  const result = await listReceivables(tenantId, { ...filters, limit: 5000, offset: 0 });
  const rows = result.receivables;

  const buckets = {
    current: 0,
    bucket_31_60: 0,
    bucket_61_90: 0,
    bucket_over_90: 0,
  };

  const byClient = {};

  for (const o of rows) {
    const bal = o.balance_due;
    if (bal <= 0.005) continue;
    const b = o.aging_bucket;
    if (b === 'current') buckets.current += bal;
    else if (b === '31_60') buckets.bucket_31_60 += bal;
    else if (b === '61_90') buckets.bucket_61_90 += bal;
    else buckets.bucket_over_90 += bal;

    const cid = o.proformaInvoice?.deal?.company?.id;
    const cname = o.proformaInvoice?.deal?.company?.company_name || '—';
    const key = cid || `nocompany-${o.id}`;
    if (!byClient[key]) {
      byClient[key] = {
        companyId: cid || null,
        companyName: cname,
        total: 0,
        current: 0,
        bucket_31_60: 0,
        bucket_61_90: 0,
        bucket_over_90: 0,
      };
    }
    byClient[key].total += bal;
    if (b === 'current') byClient[key].current += bal;
    else if (b === '31_60') byClient[key].bucket_31_60 += bal;
    else if (b === '61_90') byClient[key].bucket_61_90 += bal;
    else byClient[key].bucket_over_90 += bal;
  }

  return {
    buckets,
    byClient: Object.values(byClient).sort((a, b) => b.total - a.total),
  };
};

module.exports = {
  listReceivables,
  recordPayment,
  getAgingSummary,
  balanceDue,
};
