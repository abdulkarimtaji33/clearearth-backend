/**
 * Accounts receivable (tax invoices with balance due)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');
const paymentTxService = require('./paymentTransaction.service');
const { resolvePaymentAccount } = require('../utils/paymentAccount');

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

const recordPayment = async (tenantId, taxInvoiceId, body, userId = null) => {
  const row = await db.TaxInvoice.findOne({
    where: { id: taxInvoiceId, tenant_id: tenantId },
    include: [
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoice',
        required: false,
        include: [
          {
            model: db.Deal,
            as: 'deal',
            required: false,
            include: [{ model: db.Company, as: 'company', attributes: ['company_name'], required: false }],
          },
        ],
      },
    ],
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

  const delta = next - cur;

  const t = await db.sequelize.transaction();
  try {
    await row.update(
      {
        paid_amount: next,
        payment_status: ps,
        payment_method: body.paymentMethod !== undefined ? body.paymentMethod || null : row.payment_method,
        reference_no: body.referenceNo !== undefined ? body.referenceNo || null : row.reference_no,
        remarks:
          body.paymentDate && String(body.paymentDate).trim()
            ? [row.remarks, `Payment ${String(body.paymentDate).trim()}`].filter(Boolean).join('\n')
            : row.remarks,
      },
      { transaction: t }
    );

    // GL: Dr payment account / Cr Accounts Receivable (1100)
    if (delta > 0.005) {
      const payDate = body.paymentDate || new Date().toISOString().slice(0, 10);
      const clientName = row.proformaInvoice?.deal?.company?.company_name
        || row.proformaInvoice?.deal?.title
        || null;
      const payAcct = await resolvePaymentAccount(tenantId, {
        paymentMethod: body.paymentMethod ?? row.payment_method,
        paymentAccountId: body.paymentAccountId,
      });

      await paymentTxService.createPaymentTransaction(tenantId, userId || row.created_by || 1, {
        sourceType: 'receivable',
        sourceId: taxInvoiceId,
        amount: delta,
        paymentMethod: body.paymentMethod ?? row.payment_method,
        paymentAccountId: payAcct.accountId,
        referenceNo: body.referenceNo ?? row.reference_no,
        receivedFrom: body.receivedFrom ?? clientName,
        paidAt: payDate,
      }, t);

      try {
        const arId = await jeService.getSystemAccountId(tenantId, '1100');
        await jeService.createJournalEntry(tenantId, row.created_by || 1, {
          entryDate: payDate,
          description: `Payment Received — Invoice ${row.tax_invoice_number || taxInvoiceId}`,
          sourceType: 'payment_received',
          sourceId: taxInvoiceId,
          receivedFrom: body.receivedFrom ?? clientName,
          lines: [
            { accountId: payAcct.accountId, debit: delta, credit: 0 },
            { accountId: arId, debit: 0, credit: delta },
          ],
        }, t);
      } catch (jeErr) {
        console.warn('[GL] payment_received journal entry skipped:', jeErr.message);
      }
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

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

const listPayments = async (tenantId, taxInvoiceId) => {
  const row = await db.TaxInvoice.findOne({ where: { id: taxInvoiceId, tenant_id: tenantId } });
  if (!row) throw ApiError.notFound('Tax invoice not found');
  return paymentTxService.listPaymentTransactions(tenantId, 'receivable', taxInvoiceId);
};

function daysOverdue(dueDateStr, asOf) {
  if (!dueDateStr) return 0;
  const due = new Date(`${dueDateStr}T12:00:00`);
  return Math.floor((asOf - due) / 86400000);
}

function agingBucketByDueDate(d) {
  if (d <= 0) return 'current';
  if (d <= 30) return '1_30';
  if (d <= 60) return '31_60';
  if (d <= 90) return '61_90';
  return 'over_90';
}

/**
 * Customer-facing statement: opening balance + dated ledger of invoices/receipts + running
 * balance + 5-bucket aging (current / 1-30 / 31-60 / 61-90 / >90), all as of `dateTo`.
 */
const getStatementOfAccount = async (tenantId, companyId, { dateFrom, dateTo } = {}) => {
  const company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
  if (!company) throw ApiError.notFound('Company not found');

  const invoices = await db.TaxInvoice.findAll({
    where: { tenant_id: tenantId },
    include: [
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoice',
        required: true,
        include: [
          { model: db.Deal, as: 'deal', required: true, where: { company_id: companyId } },
        ],
      },
    ],
    order: [['invoice_date', 'ASC'], ['id', 'ASC']],
  });

  const invoiceIds = invoices.map((i) => i.id);
  const payments = invoiceIds.length
    ? await db.PaymentTransaction.findAll({
        where: { tenant_id: tenantId, source_type: 'receivable', source_id: { [Op.in]: invoiceIds } },
        order: [['paid_at', 'ASC'], ['id', 'ASC']],
      })
    : [];

  const invoiceById = {};
  invoices.forEach((i) => { invoiceById[i.id] = i; });

  const entries = [];
  invoices.forEach((inv) => {
    entries.push({
      date: inv.invoice_date,
      docType: 'Invoice',
      details: inv.tax_invoice_number,
      dueDate: inv.due_date || null,
      amount: parseNum(inv.total),
      receipts: 0,
    });
  });
  payments.forEach((p) => {
    const inv = invoiceById[p.source_id];
    entries.push({
      date: p.paid_at,
      docType: 'Payment Received',
      details: `${p.receipt_number || ''}${p.receipt_number ? '\n' : ''}${inv?.currency || 'AED'}${parseNum(p.amount).toFixed(2)} for payment of ${inv?.tax_invoice_number || ''}`.trim(),
      amount: 0,
      receipts: parseNum(p.amount),
    });
  });

  entries.sort((a, b) => new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`) || 0);

  const from = dateFrom || (entries[0]?.date ?? new Date().toISOString().slice(0, 10));
  const to = dateTo || new Date().toISOString().slice(0, 10);

  let openingBalance = 0;
  const inRange = [];
  entries.forEach((e) => {
    if (e.date < from) {
      openingBalance += e.amount - e.receipts;
    } else if (e.date <= to) {
      inRange.push(e);
    }
  });

  let running = openingBalance;
  const transactions = inRange.map((e) => {
    running += e.amount - e.receipts;
    return { ...e, balance: running };
  });

  // Balance due is the overall current outstanding balance (not limited to the date range)
  const currentBalanceDue = entries.reduce((s, e) => s + (e.amount - e.receipts), 0);

  const asOfDate = new Date(`${to}T12:00:00`);
  const aging = { current: 0, bucket_1_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_over_90: 0 };
  invoices.forEach((inv) => {
    const bal = balanceDue(inv.get ? inv.get({ plain: true }) : inv);
    if (bal <= 0.005) return;
    const bucket = agingBucketByDueDate(daysOverdue(inv.due_date, asOfDate));
    if (bucket === 'current') aging.current += bal;
    else if (bucket === '1_30') aging.bucket_1_30 += bal;
    else if (bucket === '31_60') aging.bucket_31_60 += bal;
    else if (bucket === '61_90') aging.bucket_61_90 += bal;
    else aging.bucket_over_90 += bal;
  });

  return {
    company: company.get({ plain: true }),
    dateFrom: from,
    dateTo: to,
    openingBalance,
    transactions,
    balanceDue: currentBalanceDue,
    aging,
    currency: invoices[0]?.currency || 'AED',
  };
};

module.exports = {
  listReceivables,
  recordPayment,
  listPayments,
  getAgingSummary,
  getStatementOfAccount,
  balanceDue,
};
