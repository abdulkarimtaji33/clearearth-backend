/**
 * Tax invoice service (from proforma invoices)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const proformaInvoiceService = require('./proformaInvoice.service');

const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

async function nextTaxInvoiceNumber(tenantId, transaction) {
  const count = await db.TaxInvoice.count({
    where: { tenant_id: tenantId },
    transaction,
  });
  const n = count + 1;
  const year = new Date().getFullYear();
  return `TI-${year}-${String(n).padStart(5, '0')}`;
}

const getPreviewFromProforma = async (tenantId, proformaInvoiceId, scope = {}) => {
  const proforma = await proformaInvoiceService.getById(tenantId, proformaInvoiceId, scope);
  const plain = proforma.get ? proforma.get({ plain: true }) : proforma;

  const existing = await db.TaxInvoice.findOne({
    where: { proforma_invoice_id: proformaInvoiceId, tenant_id: tenantId },
  });
  if (existing) {
    throw ApiError.conflict('A tax invoice already exists for this proforma invoice');
  }

  const items = (plain.items || []).map((it, idx) => ({
    productServiceId: it.product_service_id,
    description: it.description || it.productService?.name || '',
    quantity: parseFloat(it.quantity) || 0,
    unitPrice: parseFloat(it.unit_price) || 0,
    lineTotal: parseFloat(it.line_total) || 0,
    unitOfMeasure: it.unit_of_measure || it.productService?.unit_of_measure || null,
    sortOrder: idx,
  }));

  return {
    proformaInvoice: {
      id: plain.id,
      proformaNumber: plain.proforma_number,
      invoiceDate: plain.invoice_date,
      dueDate: plain.due_date,
      currency: plain.currency,
      subtotal: parseFloat(plain.subtotal) || 0,
      vatPercentage: parseFloat(plain.vat_percentage) || 0,
      vatAmount: parseFloat(plain.vat_amount) || 0,
      total: parseFloat(plain.total) || 0,
    },
    deal: plain.deal
      ? {
          id: plain.deal.id,
          title: plain.deal.title,
          dealNumber: plain.deal.deal_number,
        }
      : null,
    items,
    defaults: {
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: plain.due_date || null,
      paymentStatus: 'unpaid',
      paymentMethod: '',
      referenceNo: '',
    },
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

  const { count, rows } = await db.TaxInvoice.findAndCountAll({
    where,
    include: [
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoice',
        required: true,
        include: [
          {
            model: db.Quotation,
            as: 'quotation',
            attributes: ['id', 'prepared_by'],
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
        ],
      },
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
    subQuery: false,
  });

  return { taxInvoices: rows, total: count };
};

const getById = async (tenantId, id, scope = {}) => {
  const where = { id, tenant_id: tenantId };
  const row = await db.TaxInvoice.findOne({
    where,
    include: [
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoice',
        include: [
          { model: db.Quotation, as: 'quotation', attributes: ['id', 'quotation_date', 'status', 'prepared_by'] },
          { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'] },
        ],
      },
      {
        model: db.TaxInvoiceItem,
        as: 'items',
        separate: true,
        order: [
          ['sort_order', 'ASC'],
          ['id', 'ASC'],
        ],
        include: [
          {
            model: db.ProductService,
            as: 'productService',
            attributes: ['id', 'name', 'type', 'category', 'description', 'unit_of_measure', 'price', 'currency'],
          },
        ],
      },
      { model: db.User, as: 'createdByUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
    ],
  });

  if (!row) throw ApiError.notFound('Tax invoice not found');

  if (scope.scopeUserId) {
    const q = row.proformaInvoice?.quotation;
    if (!q || q.prepared_by !== scope.scopeUserId) throw ApiError.notFound('Tax invoice not found');
  }

  return row;
};

const create = async (tenantId, userId, body, scope = {}) => {
  const {
    proformaInvoiceId,
    invoiceDate,
    dueDate,
    paymentStatus,
    paymentMethod,
    referenceNo,
    attachmentPath,
    remarks,
  } = body;

  if (!proformaInvoiceId) throw ApiError.badRequest('proformaInvoiceId is required');

  const proforma = await proformaInvoiceService.getById(tenantId, proformaInvoiceId, scope);
  const plain = proforma.get ? proforma.get({ plain: true }) : proforma;

  const dup = await db.TaxInvoice.findOne({
    where: { proforma_invoice_id: proformaInvoiceId, tenant_id: tenantId },
  });
  if (dup) throw ApiError.conflict('A tax invoice already exists for this proforma invoice');

  const ps = String(paymentStatus || 'unpaid').toLowerCase();
  if (!PAYMENT_STATUSES.includes(ps)) {
    throw ApiError.badRequest(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(', ')}`);
  }

  const t = await db.sequelize.transaction();
  let createdId;
  try {
    const taxInvoiceNumber = await nextTaxInvoiceNumber(tenantId, t);

    const header = await db.TaxInvoice.create(
      {
        tenant_id: tenantId,
        proforma_invoice_id: proformaInvoiceId,
        tax_invoice_number: taxInvoiceNumber,
        invoice_date: invoiceDate || new Date().toISOString().slice(0, 10),
        due_date: dueDate || plain.due_date || null,
        currency: plain.currency || 'AED',
        subtotal: parseFloat(plain.subtotal) || 0,
        vat_percentage: parseFloat(plain.vat_percentage) || 0,
        vat_amount: parseFloat(plain.vat_amount) || 0,
        total: parseFloat(plain.total) || 0,
        payment_status: ps,
        payment_method: paymentMethod || null,
        reference_no: referenceNo || null,
        attachment_path: attachmentPath || null,
        remarks: remarks || null,
        created_by: userId,
      },
      { transaction: t }
    );
    createdId = header.id;

    const pItems = plain.items || [];
    const rows = pItems.map((it, idx) => ({
      tax_invoice_id: header.id,
      product_service_id: it.product_service_id || null,
      description: it.description || null,
      quantity: parseFloat(it.quantity) || 0,
      unit_price: parseFloat(it.unit_price) || 0,
      line_total: parseFloat(it.line_total) || 0,
      unit_of_measure: it.unit_of_measure || null,
      sort_order: it.sort_order ?? idx,
    }));

    if (rows.length) {
      await db.TaxInvoiceItem.bulkCreate(rows, { transaction: t });
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    if (e.name === 'SequelizeUniqueConstraintError' || e.name === 'UniqueConstraintError') {
      throw ApiError.conflict('Could not create tax invoice; retry or check duplicate');
    }
    throw e;
  }

  return getById(tenantId, createdId, scope);
};

const update = async (tenantId, id, body, scope = {}) => {
  await getById(tenantId, id, scope);
  const row = await db.TaxInvoice.findOne({ where: { id, tenant_id: tenantId } });

  const {
    invoiceDate,
    dueDate,
    paymentStatus,
    paymentMethod,
    referenceNo,
    attachmentPath,
    remarks,
  } = body;

  if (paymentStatus !== undefined) {
    const ps = String(paymentStatus).toLowerCase();
    if (!PAYMENT_STATUSES.includes(ps)) {
      throw ApiError.badRequest(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(', ')}`);
    }
    row.payment_status = ps;
  }

  if (invoiceDate !== undefined) row.invoice_date = invoiceDate;
  if (dueDate !== undefined) row.due_date = dueDate;
  if (paymentMethod !== undefined) row.payment_method = paymentMethod;
  if (referenceNo !== undefined) row.reference_no = referenceNo;
  if (attachmentPath !== undefined) row.attachment_path = attachmentPath;
  if (remarks !== undefined) row.remarks = remarks;

  await row.save();
  return getById(tenantId, id, scope);
};

const remove = async (tenantId, id, scope = {}) => {
  await getById(tenantId, id, scope);
  const row = await db.TaxInvoice.findOne({ where: { id, tenant_id: tenantId } });
  await row.destroy();
};

module.exports = {
  getPreviewFromProforma,
  getAll,
  getById,
  create,
  update,
  remove,
  PAYMENT_STATUSES,
};
