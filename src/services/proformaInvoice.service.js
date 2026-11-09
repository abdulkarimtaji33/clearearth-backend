/**
 * Proforma invoice service (from quotations)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { assertDueNotBeforeInvoice } = require('../utils/invoiceDates');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const quotationService = require('./quotation.service');

async function nextProformaNumber(tenantId, transaction) {
  const count = await db.ProformaInvoice.count({
    where: { tenant_id: tenantId },
    transaction,
  });
  const n = count + 1;
  const year = new Date().getFullYear();
  return `PF-${year}-${String(n).padStart(5, '0')}`;
}

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

/** Other proformas on the same deal with the same total (warning only, never blocks). */
const findDuplicates = async (tenantId, quotationId, total, scope = {}) => {
  const quotation = await quotationService.getById(tenantId, quotationId, scope);
  const target = round2(total);
  const rows = await db.ProformaInvoice.findAll({
    where: { tenant_id: tenantId, deal_id: quotation.deal_id },
    attributes: ['id', 'proforma_number', 'total', 'invoice_date'],
  });
  return rows
    .filter((r) => Math.abs(round2(r.total) - target) < 0.01)
    .map((r) => ({ id: r.id, proformaNumber: r.proforma_number, total: round2(r.total), invoiceDate: r.invoice_date }));
};

const getPreviewFromQuotation = async (tenantId, quotationId, scope = {}) => {
  const quotation = await quotationService.getById(tenantId, quotationId, scope);
  const plain = quotation.get ? quotation.get({ plain: true }) : quotation;
  const deal = plain.deal;
  if (!deal) throw ApiError.notFound('Deal not found for quotation');

  const items = (deal.items || []).map((it, idx) => {
    const ps = it.productService || {};
    const name = ps.name || 'Item';
    return {
      dealItemId: it.id,
      productServiceId: it.product_service_id,
      description: name,
      quantity: parseFloat(it.quantity) || 0,
      unitPrice: parseFloat(it.unit_price) || 0,
      lineTotal: parseFloat(it.line_total) || 0,
      unitOfMeasure: it.unit_of_measure || ps.unit_of_measure || null,
      sortOrder: idx,
    };
  });

  const subtotal = parseFloat(deal.subtotal) || items.reduce((s, r) => s + (parseFloat(r.lineTotal) || 0), 0);
  const vatPercentage = parseFloat(deal.vat_percentage) || 0;
  const vatAmount = parseFloat(deal.vat_amount) || 0;
  const total = parseFloat(deal.total) || subtotal + vatAmount;

  return {
    quotation: {
      id: plain.id,
      quotationDate: plain.quotation_date,
      status: plain.status,
      quotationAmount: plain.quotation_amount,
      currency: plain.currency || deal.currency || 'AED',
    },
    deal: {
      id: deal.id,
      title: deal.title,
      dealNumber: deal.deal_number,
      subtotal,
      vatPercentage,
      vatAmount,
      total,
      currency: deal.currency || 'AED',
    },
    items,
  };
};

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, scopeUserId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  const quotationWhere = {};
  if (scopeUserId) quotationWhere.prepared_by = scopeUserId;

  const dealWhereForSearch = () => {
    if (!search) return undefined;
    const s = String(search).trim();
    return {
      [Op.or]: [
        { title: { [Op.like]: `%${s}%` } },
        { deal_number: { [Op.like]: `%${s}%` } },
      ],
    };
  };

  applyDateOnlyColumnFilter(where, 'invoice_date', dateFrom, dateTo);

  const { count, rows } = await db.ProformaInvoice.findAndCountAll({
    where,
    include: [
      {
        model: db.Quotation,
        as: 'quotation',
        attributes: ['id', 'quotation_date', 'status', 'prepared_by'],
        required: true,
        where: Object.keys(quotationWhere).length ? quotationWhere : undefined,
      },
      {
        model: db.Deal,
        as: 'deal',
        attributes: ['id', 'title', 'deal_number'],
        required: !search,
        where: dealWhereForSearch(),
      },
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      { model: db.TaxInvoice, as: 'taxInvoice', attributes: ['id', 'tax_invoice_number'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
    subQuery: false,
  });

  return { proformaInvoices: rows, total: count };
};

const getById = async (tenantId, id, scope = {}) => {
  const where = { id, tenant_id: tenantId };
  const include = [
    {
      model: db.Quotation,
      as: 'quotation',
      attributes: ['id', 'quotation_date', 'status', 'prepared_by', 'quotation_amount'],
    },
    {
      model: db.Deal,
      as: 'deal',
      attributes: ['id', 'title', 'deal_number', 'subtotal', 'vat_percentage', 'vat_amount', 'total', 'currency'],
    },
    {
      model: db.ProformaInvoiceItem,
      as: 'items',
      separate: true,
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [{ model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'unit_of_measure'] }],
    },
    { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
    {
      model: db.TaxInvoice,
      as: 'taxInvoice',
      attributes: ['id', 'tax_invoice_number', 'payment_status', 'invoice_date'],
      required: false,
    },
  ];

  const row = await db.ProformaInvoice.findOne({ where, include });
  if (!row) throw ApiError.notFound('Proforma invoice not found');

  if (scope.scopeUserId) {
    const q = row.quotation;
    if (!q || q.prepared_by !== scope.scopeUserId) throw ApiError.notFound('Proforma invoice not found');
  }

  return row;
};

const create = async (tenantId, userId, body, scope = {}) => {
  const {
    quotationId,
    invoiceDate,
    dueDate,
    subtotal,
    vatPercentage,
    vatAmount,
    total,
    currency,
    remarks,
    items = [],
  } = body;

  if (!quotationId) throw ApiError.badRequest('quotationId is required');

  const quotation = await quotationService.getById(tenantId, quotationId, scope);
  const dealId = quotation.deal_id;

  const existing = await db.ProformaInvoice.findOne({
    where: { tenant_id: tenantId, quotation_id: quotationId },
    attributes: ['id'],
  });
  if (existing) throw ApiError.badRequest('A proforma invoice already exists for this quotation');

  assertDueNotBeforeInvoice(invoiceDate || new Date().toISOString().slice(0, 10), dueDate);

  // Totals are always derived from the lines and the VAT %, never trusted from the client:
  // a stale VAT amount (e.g. copied from the deal) used to be saved as-is.
  const lineRows = (items || []).map((it) => parseFloat(it.lineTotal ?? it.line_total) || 0);
  const vatPct = parseFloat(vatPercentage) || 0;
  const computedSubtotal = lineRows.length ? round2(lineRows.reduce((s, v) => s + v, 0)) : round2(subtotal);
  const computedVat = round2((computedSubtotal * vatPct) / 100);
  const computedTotal = round2(computedSubtotal + computedVat);

  const t = await db.sequelize.transaction();
  let createdId;
  try {
    const proformaNumber = await nextProformaNumber(tenantId, t);

    const header = await db.ProformaInvoice.create(
      {
        tenant_id: tenantId,
        quotation_id: quotationId,
        deal_id: dealId,
        proforma_number: proformaNumber,
        invoice_date: invoiceDate || new Date().toISOString().slice(0, 10),
        due_date: dueDate || null,
        currency: currency || 'AED',
        subtotal: computedSubtotal,
        vat_percentage: vatPct,
        vat_amount: computedVat,
        total: computedTotal,
        remarks: remarks || null,
        created_by: userId,
      },
      { transaction: t }
    );
    createdId = header.id;

    const rows = (items || []).map((it, idx) => ({
      proforma_invoice_id: header.id,
      product_service_id: it.productServiceId || it.product_service_id || null,
      description: it.description || null,
      quantity: parseFloat(it.quantity) || 0,
      unit_price: parseFloat(it.unitPrice ?? it.unit_price) || 0,
      line_total: parseFloat(it.lineTotal ?? it.line_total) || 0,
      unit_of_measure: it.unitOfMeasure || it.unit_of_measure || null,
      sort_order: it.sortOrder ?? it.sort_order ?? idx,
    }));

    if (rows.length) {
      await db.ProformaInvoiceItem.bulkCreate(rows, { transaction: t });
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    if (e.name === 'SequelizeUniqueConstraintError' || e.name === 'UniqueConstraintError') {
      throw ApiError.conflict('Could not assign proforma number; retry');
    }
    throw e;
  }

  return getById(tenantId, createdId, scope);
};

const update = async (tenantId, id, body, scope = {}) => {
  await getById(tenantId, id, scope);
  const row = await db.ProformaInvoice.findOne({ where: { id, tenant_id: tenantId } });
  const { invoiceDate, dueDate, remarks } = body;
  if (invoiceDate !== undefined || dueDate !== undefined) {
    assertDueNotBeforeInvoice(
      invoiceDate !== undefined ? invoiceDate : row.invoice_date,
      dueDate !== undefined ? dueDate : row.due_date
    );
  }
  if (invoiceDate !== undefined) row.invoice_date = invoiceDate;
  if (dueDate !== undefined) row.due_date = dueDate;
  if (remarks !== undefined) row.remarks = remarks;
  await row.save();
  return getById(tenantId, id, scope);
};

const remove = async (tenantId, id, scope = {}) => {
  await getById(tenantId, id, scope);
  const row = await db.ProformaInvoice.findOne({ where: { id, tenant_id: tenantId } });
  const invoiced = await db.TaxInvoice.findOne({ where: { proforma_invoice_id: id, tenant_id: tenantId }, attributes: ['id', 'tax_invoice_number'] });
  if (invoiced) {
    throw ApiError.conflict(`This proforma has already been invoiced (${invoiced.tax_invoice_number}) and cannot be deleted. Cancel the tax invoice with a credit note instead.`);
  }
  await row.destroy();
};

module.exports = {
  getPreviewFromQuotation,
  findDuplicates,
  getAll,
  getById,
  create,
  update,
  remove,
};
