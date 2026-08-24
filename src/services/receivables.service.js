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
const { daysOverdue, agingBucketByDueDate, emptyAgingBuckets, addToBucket } = require('../utils/aging');

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

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const plain = rows.map((r) => {
    const o = r.get({ plain: true });
    o.balance_due = balanceDue(o);
    o.days_open = daysOpen(o.invoice_date);
    // Aging bucket is due-date based (days overdue vs due_date), matching the Aging Summary and Statement of Account
    o.aging_bucket = agingBucketByDueDate(daysOverdue(o.due_date, today));
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

      const paymentTx = await paymentTxService.createPaymentTransaction(tenantId, userId || row.created_by || 1, {
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
        const entryId = await jeService.createJournalEntry(tenantId, row.created_by || 1, {
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
        await paymentTx.update({ journal_entry_id: entryId }, { transaction: t });
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

  const buckets = emptyAgingBuckets();
  const byClient = {};

  for (const o of rows) {
    const bal = o.balance_due;
    if (bal <= 0.005) continue;
    const b = o.aging_bucket;
    addToBucket(buckets, b, bal);

    const cid = o.proformaInvoice?.deal?.company?.id;
    const cname = o.proformaInvoice?.deal?.company?.company_name || '—';
    const key = cid || `nocompany-${o.id}`;
    if (!byClient[key]) {
      byClient[key] = {
        companyId: cid || null,
        companyName: cname,
        total: 0,
        ...emptyAgingBuckets(),
      };
    }
    byClient[key].total += bal;
    addToBucket(byClient[key], b, bal);
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

/** Best-effort date for a payment row — falls back to when it was recorded if `paid_at` is missing (legacy rows). */
function paymentEntryDate(p) {
  if (p.paid_at) return p.paid_at;
  const created = p.createdAt || p.created_at;
  if (!created) return null;
  return (created instanceof Date ? created : new Date(created)).toISOString().slice(0, 10);
}

const DOC_TYPE_SORT_RANK = { Invoice: 0, 'Payment Received': 1 };

/**
 * Customer-facing statement: opening balance + dated ledger of invoices/receipts + running
 * balance + 5-bucket aging (current / 1-30 / 31-60 / 61-90 / >90 / no due date), all as of
 * `dateTo`. Every row carries a `breakdown` object so the UI can show how the figure was
 * computed (see docs/plan — statement of account correctness + drill-down).
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
          { model: db.Deal, as: 'deal', required: true, where: { company_id: companyId }, attributes: ['id', 'deal_number', 'title'] },
          { model: db.Quotation, as: 'quotation', required: false, attributes: ['id', 'quotation_date'] },
        ],
      },
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
    order: [['invoice_date', 'ASC'], ['id', 'ASC']],
  });

  const invoiceIds = invoices.map((i) => i.id);
  const payments = invoiceIds.length
    ? await db.PaymentTransaction.findAll({
        where: { tenant_id: tenantId, source_type: 'receivable', source_id: { [Op.in]: invoiceIds } },
        include: [
          { model: db.ChartOfAccounts, as: 'paymentAccount', attributes: ['id', 'code', 'name'], required: false },
          { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
          { model: db.JournalEntry, as: 'journalEntry', attributes: ['id', 'entry_number'], required: false },
        ],
        order: [['paid_at', 'ASC'], ['id', 'ASC']],
      })
    : [];

  const invoiceById = {};
  invoices.forEach((i) => { invoiceById[i.id] = i; });

  // Payments grouped per invoice, in date order — used both for the ledger and for
  // computing each invoice's balance as of an arbitrary date (see aging below).
  const paymentsByInvoice = {};
  payments.forEach((p) => {
    (paymentsByInvoice[p.source_id] = paymentsByInvoice[p.source_id] || []).push(p);
  });

  const userName = (u) => (u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : null);

  const entries = [];
  invoices.forEach((inv) => {
    const proforma = inv.proformaInvoice;
    const deal = proforma?.deal;
    const quotation = proforma?.quotation;
    entries.push({
      date: inv.invoice_date,
      docType: 'Invoice',
      details: inv.tax_invoice_number,
      dueDate: inv.due_date || null,
      amount: parseNum(inv.total),
      receipts: 0,
      breakdown: {
        sourceType: 'tax_invoice',
        sourceId: inv.id,
        invoiceNumber: inv.tax_invoice_number,
        invoiceDate: inv.invoice_date,
        dueDate: inv.due_date || null,
        subtotal: parseNum(inv.subtotal),
        vatPercentage: parseNum(inv.vat_percentage),
        vatAmount: parseNum(inv.vat_amount),
        total: parseNum(inv.total),
        currency: inv.currency || 'AED',
        preparedBy: userName(inv.createdByUser),
        chain: {
          dealId: deal?.id || null,
          dealNumber: deal?.deal_number || null,
          dealTitle: deal?.title || null,
          quotationId: quotation?.id || null,
          quotationDate: quotation?.quotation_date || null,
          proformaInvoiceId: proforma?.id || null,
          proformaInvoiceNumber: proforma?.proforma_number || null,
        },
      },
    });
  });
  payments.forEach((p) => {
    const inv = invoiceById[p.source_id];
    entries.push({
      date: paymentEntryDate(p),
      docType: 'Payment Received',
      details: `${p.receipt_number || ''}${p.receipt_number ? '\n' : ''}${inv?.currency || 'AED'}${parseNum(p.amount).toFixed(2)} for payment of ${inv?.tax_invoice_number || ''}`.trim(),
      amount: 0,
      receipts: parseNum(p.amount),
      breakdown: {
        sourceType: 'payment',
        paymentId: p.id,
        invoiceId: inv?.id || null,
        invoiceNumber: inv?.tax_invoice_number || null,
        receiptNumber: p.receipt_number || null,
        amount: parseNum(p.amount),
        currency: inv?.currency || 'AED',
        paymentMethod: p.payment_method || null,
        referenceNo: p.reference_no || null,
        receivedFrom: p.received_from || null,
        paidAt: p.paid_at || null,
        recordedAt: p.createdAt || p.created_at || null,
        paymentAccount: p.paymentAccount ? { id: p.paymentAccount.id, code: p.paymentAccount.code, name: p.paymentAccount.name } : null,
        recordedBy: userName(p.createdByUser),
        journalEntryId: p.journalEntry?.id || null,
        journalEntryNumber: p.journalEntry?.entry_number || null,
      },
    });
  });

  entries.sort((a, b) => {
    const dateDiff = new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`);
    if (dateDiff !== 0) return dateDiff;
    return (DOC_TYPE_SORT_RANK[a.docType] ?? 9) - (DOC_TYPE_SORT_RANK[b.docType] ?? 9);
  });

  const from = dateFrom || (entries[0]?.date ?? new Date().toISOString().slice(0, 10));
  const to = dateTo || new Date().toISOString().slice(0, 10);

  let openingBalance = 0;
  const openingBalanceEntries = [];
  const inRange = [];
  entries.forEach((e) => {
    if (e.date < from) {
      openingBalance += e.amount - e.receipts;
      openingBalanceEntries.push(e);
    } else if (e.date <= to) {
      inRange.push(e);
    }
  });

  let running = openingBalance;
  const transactions = inRange.map((e) => {
    const balanceBefore = running;
    running += e.amount - e.receipts;
    return { ...e, balanceBefore, balance: running };
  });

  // Balance due is the overall current outstanding balance (not limited to the date range)
  const invoiceTotal = entries.reduce((s, e) => s + e.amount, 0);
  const receiptTotal = entries.reduce((s, e) => s + e.receipts, 0);
  const currentBalanceDue = invoiceTotal - receiptTotal;

  // Aging is computed as of `to` — an invoice's balance only reflects payments recorded on or before that date,
  // not today's payment state, so a statement run for a past period reflects that period's balances.
  const asOfDate = new Date(`${to}T12:00:00`);
  const aging = emptyAgingBuckets();
  const agingDetail = { current: [], bucket_1_30: [], bucket_31_60: [], bucket_61_90: [], bucket_over_90: [], bucket_no_due_date: [] };
  invoices.forEach((inv) => {
    const total = parseNum(inv.total);
    const paidAsOfTo = (paymentsByInvoice[inv.id] || [])
      .filter((p) => (paymentEntryDate(p) || '9999-99-99') <= to)
      .reduce((s, p) => s + parseNum(p.amount), 0);
    const bal = Math.max(0, total - paidAsOfTo);
    if (bal <= 0.005) return;
    const dOverdue = daysOverdue(inv.due_date, asOfDate);
    const bucket = agingBucketByDueDate(dOverdue);
    addToBucket(aging, bucket, bal);
    const field = { current: 'current', '1_30': 'bucket_1_30', '31_60': 'bucket_31_60', '61_90': 'bucket_61_90', over_90: 'bucket_over_90', no_due_date: 'bucket_no_due_date' }[bucket];
    agingDetail[field].push({
      invoiceId: inv.id,
      invoiceNumber: inv.tax_invoice_number,
      dueDate: inv.due_date || null,
      daysOverdue: dOverdue,
      balance: bal,
    });
  });

  return {
    company: company.get({ plain: true }),
    dateFrom: from,
    dateTo: to,
    openingBalance,
    openingBalanceEntries,
    transactions,
    balanceDue: currentBalanceDue,
    balanceDueBreakdown: {
      invoiceCount: entries.filter((e) => e.amount > 0).length,
      invoiceTotal,
      receiptCount: entries.filter((e) => e.receipts > 0).length,
      receiptTotal,
    },
    aging,
    agingDetail,
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
