/**
 * Hide deal financial fields for roles that need operational detail without pricing.
 */
const ApiError = require('./apiError');

const ROLES_HIDE_DEAL_FINANCIALS = new Set(['operations_manager']);

const DEAL_AMOUNT_FIELDS = ['subtotal', 'vat_percentage', 'vat_amount', 'total', 'paid_amount'];
const LINE_ITEM_AMOUNT_FIELDS = ['unit_price', 'line_total'];
const INVOICE_AMOUNT_FIELDS = ['subtotal', 'vat_percentage', 'vat_amount', 'total', 'paid_amount'];

const shouldHideDealFinancials = (roleName) => (
  roleName != null && ROLES_HIDE_DEAL_FINANCIALS.has(roleName)
);

const redactFields = (obj, fields) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of fields) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = null;
    }
  }
};

const toPlain = (deal) => (deal?.get ? deal.get({ plain: true }) : { ...deal });

const sanitizeDealPayload = (deal, hideFinancials) => {
  if (!hideFinancials || !deal) return deal;
  const d = toPlain(deal);

  redactFields(d, DEAL_AMOUNT_FIELDS);

  if (Array.isArray(d.items)) {
    d.items.forEach((item) => redactFields(item, LINE_ITEM_AMOUNT_FIELDS));
  }

  if (Array.isArray(d.proformaInvoices)) {
    d.proformaInvoices.forEach((proforma) => {
      redactFields(proforma, INVOICE_AMOUNT_FIELDS);
      if (proforma.taxInvoice) redactFields(proforma.taxInvoice, INVOICE_AMOUNT_FIELDS);
    });
  }

  return d;
};

const PO_AMOUNT_FIELDS = ['paid_amount'];
const PO_ITEM_AMOUNT_FIELDS = ['price', 'total'];

const sanitizeQuotationPayload = (row, hideFinancials) => {
  if (!hideFinancials || !row) return row;
  const q = row?.get ? row.get({ plain: true }) : { ...row };
  redactFields(q, ['quotation_amount']);
  if (q.deal) {
    q.deal = sanitizeDealPayload(q.deal, true);
  }
  return q;
};

const sanitizePurchaseOrderPayload = (po, hideFinancials) => {
  if (!hideFinancials || !po) return po;
  const p = toPlain(po);
  redactFields(p, PO_AMOUNT_FIELDS);
  if (Array.isArray(p.items)) {
    p.items.forEach((item) => redactFields(item, PO_ITEM_AMOUNT_FIELDS));
  }
  return p;
};

/** Operations managers may view quotations/orders but cannot create, edit, approve, or delete them. */
const assertCanModifyQuotationsAndOrders = (roleName) => {
  if (shouldHideDealFinancials(roleName)) {
    throw ApiError.forbidden('Operations managers can view quotations and orders but cannot modify them.');
  }
};

module.exports = {
  shouldHideDealFinancials,
  sanitizeDealPayload,
  sanitizeQuotationPayload,
  sanitizeQuotationListItem: sanitizeQuotationPayload,
  sanitizePurchaseOrderPayload,
  assertCanModifyQuotationsAndOrders,
};
