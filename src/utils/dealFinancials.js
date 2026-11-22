/**
 * Hide deal financial fields for roles that need operational detail without pricing.
 */
const ApiError = require('./apiError');

// Legacy fallback only (used when a bare role-name string is passed instead of a request / access object).
const ROLES_HIDE_DEAL_FINANCIALS = new Set(['operations_manager']);

const DEAL_AMOUNT_FIELDS = ['subtotal', 'vat_percentage', 'vat_amount', 'total', 'paid_amount'];
const LINE_ITEM_AMOUNT_FIELDS = ['unit_price', 'line_total'];
const INVOICE_AMOUNT_FIELDS = ['subtotal', 'vat_percentage', 'vat_amount', 'total', 'paid_amount'];

/**
 * Whether the "financials" field group (prices & amounts) is hidden for the caller.
 * Accepts an Express request, a user, an Access object, or (legacy) a role name string.
 * Configured per role under Roles → Field visibility.
 */
const shouldHideDealFinancials = (subject) => {
  if (subject == null) return false;
  if (typeof subject === 'string') return ROLES_HIDE_DEAL_FINANCIALS.has(subject);
  if (typeof subject.hidesField === 'function') return subject.hidesField('financials');
  const access = subject.access || subject.user?.access;
  if (access) return access.hidesField('financials');
  return false;
};

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

/**
 * Users without the `orders.modify` permission may view quotations/orders but cannot create,
 * edit, approve, or delete them. Accepts an Express request, a user, an Access object or (legacy) a role name.
 */
const assertCanModifyQuotationsAndOrders = (subject) => {
  let allowed;
  if (typeof subject === 'string' || subject == null) {
    allowed = !ROLES_HIDE_DEAL_FINANCIALS.has(subject);
  } else {
    const access = typeof subject.has === 'function' ? subject : (subject.access || subject.user?.access);
    allowed = access ? access.has('orders.modify') : true;
  }
  if (!allowed) {
    throw ApiError.forbidden('Your role can view quotations and orders but cannot modify them.');
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
