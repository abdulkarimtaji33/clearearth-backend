/**
 * Credit notes — the only way to correct or cancel a posted tax invoice.
 *
 *   Credit note -> Dr 4000 Revenue + Dr 2100 VAT Payable / Cr 1100 Accounts Receivable
 *
 * A credit note can never exceed what the customer still owes on the invoice. If the invoice
 * is already (partly) paid, only the unpaid part can be credited here.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');

const EPS = 0.01;
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

const REASONS = [
  'Invoice issued by mistake',
  'Wrong quantity or price',
  'Wrong customer',
  'Service not delivered',
  'Discount or goodwill',
  'Other',
];

function invoiceNumbers(inv) {
  const total = round2(inv.total);
  const paid = round2(inv.paid_amount || 0);
  const credited = round2(inv.credited_amount || 0);
  const outstanding = Math.max(0, round2(total - paid - credited));
  const vatPct = parseFloat(inv.vat_percentage) || 0;
  return { total, paid, credited, outstanding, vatPct };
}

/** Split a VAT-inclusive amount into ex-VAT + VAT at the invoice's VAT rate. */
function splitInclusive(totalInclusive, vatPct) {
  const subtotal = round2(totalInclusive / (1 + vatPct / 100));
  return { subtotal, vat: round2(totalInclusive - subtotal) };
}

async function nextNumber(tenantId, transaction) {
  const count = await db.CreditNote.count({ where: { tenant_id: tenantId }, transaction });
  return `CN/CE/${new Date().getFullYear()}/${count + 1}`;
}

async function loadInvoice(tenantId, taxInvoiceId, transaction = null) {
  const inv = await db.TaxInvoice.findOne({ where: { id: taxInvoiceId, tenant_id: tenantId }, transaction });
  if (!inv) throw ApiError.notFound('Tax invoice not found');
  return inv;
}

/** What the "Issue credit note" screen needs: how much can still be credited, and the reasons. */
const getInvoiceCreditInfo = async (tenantId, taxInvoiceId) => {
  const inv = await loadInvoice(tenantId, taxInvoiceId);
  const n = invoiceNumbers(inv);
  const full = splitInclusive(n.outstanding, n.vatPct);
  return {
    taxInvoiceId: inv.id,
    taxInvoiceNumber: inv.tax_invoice_number,
    invoiceDate: inv.invoice_date,
    currency: inv.currency || 'AED',
    vatPercentage: n.vatPct,
    total: n.total,
    paid: n.paid,
    credited: n.credited,
    outstanding: n.outstanding,
    maxSubtotal: full.subtotal,
    maxVat: full.vat,
    reasons: REASONS,
    canCredit: n.outstanding > EPS,
  };
};

const createCreditNote = async (tenantId, userId, body = {}) => {
  const { taxInvoiceId, reason, notes, creditDate, amountExVat } = body;
  if (!taxInvoiceId) throw ApiError.badRequest('Choose the tax invoice to credit');
  if (!reason || !String(reason).trim()) throw ApiError.badRequest('Select a reason for the credit note');

  const date = creditDate || new Date().toISOString().slice(0, 10);
  // Period lock: fail loudly before anything is saved.
  await jeService.assertPostingDateOpen(tenantId, date);

  const t = await db.sequelize.transaction();
  try {
    const inv = await db.TaxInvoice.findOne({ where: { id: taxInvoiceId, tenant_id: tenantId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!inv) throw ApiError.notFound('Tax invoice not found');
    if (String(date) < String(inv.invoice_date).slice(0, 10)) {
      throw ApiError.badRequest(`The credit note date cannot be before the invoice date (${String(inv.invoice_date).slice(0, 10)})`);
    }

    const n = invoiceNumbers(inv);
    if (n.outstanding <= EPS) {
      throw ApiError.badRequest('This invoice has nothing left to credit — it is already fully paid or fully credited');
    }

    // Blank amount = credit everything still owed; otherwise a partial amount excluding VAT.
    let subtotal;
    let vat;
    if (amountExVat === undefined || amountExVat === null || amountExVat === '') {
      ({ subtotal, vat } = splitInclusive(n.outstanding, n.vatPct));
    } else {
      subtotal = round2(amountExVat);
      if (!(subtotal > 0)) throw ApiError.badRequest('Enter an amount greater than zero');
      vat = round2((subtotal * n.vatPct) / 100);
    }
    const total = round2(subtotal + vat);
    if (total > n.outstanding + EPS) {
      throw ApiError.badRequest(
        `The credit (AED ${total.toFixed(2)} incl. VAT) is more than the customer still owes on this invoice (AED ${n.outstanding.toFixed(2)})`
      );
    }

    const creditNoteNumber = await nextNumber(tenantId, t);
    const note = await db.CreditNote.create(
      {
        tenant_id: tenantId,
        credit_note_number: creditNoteNumber,
        tax_invoice_id: inv.id,
        credit_date: date,
        reason: String(reason).trim().slice(0, 100),
        notes: notes ? String(notes).trim() : null,
        subtotal,
        vat_amount: vat,
        total,
        created_by: userId,
      },
      { transaction: t }
    );

    const arId = await jeService.getSystemAccountId(tenantId, '1100');
    const revId = await jeService.getSystemAccountId(tenantId, '4000');
    const lines = [
      { accountId: revId, debit: subtotal, credit: 0, description: `Revenue reversed: ${creditNoteNumber}` },
    ];
    if (vat > 0.005) {
      const vatId = await jeService.getSystemAccountId(tenantId, '2100');
      lines.push({ accountId: vatId, debit: vat, credit: 0, description: `VAT reversed: ${creditNoteNumber}` });
    }
    lines.push({ accountId: arId, debit: 0, credit: total, description: `AR: ${creditNoteNumber} (${inv.tax_invoice_number})` });

    const entryId = await jeService.createJournalEntry(
      tenantId,
      userId,
      {
        entryDate: date,
        description: `Credit Note ${creditNoteNumber} — ${inv.tax_invoice_number} (${String(reason).trim()})`,
        sourceType: 'credit_note',
        sourceId: note.id,
        lines,
      },
      t
    );
    await note.update({ journal_entry_id: entryId }, { transaction: t });

    const credited = round2(n.credited + total);
    const balance = round2(n.total - n.paid - credited);
    let ps = 'unpaid';
    if (balance <= EPS) ps = 'paid';
    else if (n.paid > 0) ps = 'partial';
    await inv.update({ credited_amount: credited, payment_status: ps }, { transaction: t });

    await t.commit();
    return getCreditNote(tenantId, note.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const includes = () => [
  {
    model: db.TaxInvoice,
    as: 'taxInvoice',
    attributes: ['id', 'tax_invoice_number', 'invoice_date', 'total', 'credited_amount', 'paid_amount', 'currency'],
    required: false,
  },
  { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
];

const getCreditNote = async (tenantId, id) => {
  const row = await db.CreditNote.findOne({ where: { id, tenant_id: tenantId }, include: includes() });
  if (!row) throw ApiError.notFound('Credit note not found');
  return row.get({ plain: true });
};

const listCreditNotes = async (tenantId, filters = {}) => {
  const { offset, limit, search, taxInvoiceId } = filters;
  const where = { tenant_id: tenantId };
  if (taxInvoiceId) where.tax_invoice_id = taxInvoiceId;
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [{ credit_note_number: { [Op.like]: s } }, { reason: { [Op.like]: s } }];
  }
  const { count, rows } = await db.CreditNote.findAndCountAll({
    where,
    include: includes(),
    offset,
    limit,
    order: [['credit_date', 'DESC'], ['id', 'DESC']],
  });
  return { creditNotes: rows.map((r) => r.get({ plain: true })), total: count };
};

module.exports = { REASONS, getInvoiceCreditInfo, createCreditNote, getCreditNote, listCreditNotes };
