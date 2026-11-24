/**
 * Registers (read-only) for the Inbound and Outbound menus. Each register lists orders and invoices in one
 * place; the accounting stays where it already is (purchase orders and vendor bills -> Accounts Payable,
 * tax invoices -> Accounts Receivable).
 *
 *   purchase  Offer to Purchase deals: purchase orders + vendor bills (purchase invoices)
 *   service   Offer to Service deals : service quotations/orders + tax invoices
 *   sales     Free of Cost resale / outbound sales: outbound sale entries (sales orders) + tax invoices
 */
const db = require('../models');

const q = async (sql, replacements) => (await db.sequelize.query(sql, { replacements }))[0];
const num = (v) => Math.round((Number(v) || 0) * 100) / 100;

async function purchase(tenantId) {
  const orders = await q(
    `SELECT po.id, po.po_date AS date, po.status,
            COALESCE(s.company_name, c.company_name, '') AS party,
            COALESCE((SELECT SUM(i.total) FROM purchase_order_items i WHERE i.purchase_order_id = po.id), 0) AS amount
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN companies c ON c.id = po.company_id
      WHERE po.tenant_id = ?`, [tenantId]);
  const bills = await q(
    `SELECT b.id, b.bill_number, b.supplier_invoice_no, b.bill_date AS date, b.total AS amount, b.paid_amount, b.debit_note_amount, b.status,
            COALESCE(s.company_name, c.company_name, '') AS party
       FROM vendor_bills b
       LEFT JOIN suppliers s ON s.id = b.supplier_id
       LEFT JOIN companies c ON c.id = b.company_id
      WHERE b.tenant_id = ?`, [tenantId]);
  return [
    ...orders.map((o) => ({ type: 'Purchase Order', reference: `PO-${o.id}`, party: o.party, date: o.date, amount: num(o.amount), status: o.status, link: `/erp/purchase-orders/view/${o.id}` })),
    ...bills.map((b) => ({
      type: 'Purchase Invoice', reference: b.bill_number, party: b.party, date: b.date, amount: num(b.amount),
      balance: num(num(b.amount) - num(b.paid_amount) - num(b.debit_note_amount)), status: b.status, link: '/erp/vendor-bills',
    })),
  ];
}

async function invoicesForDealType(tenantId, dealType) {
  return q(
    `SELECT t.id, t.tax_invoice_number AS reference, t.invoice_date AS date, t.due_date, t.total AS amount, t.paid_amount, t.credited_amount, t.payment_status AS status,
            COALESCE(co.company_name, '') AS party
       FROM tax_invoices t
       JOIN proforma_invoices p ON p.id = t.proforma_invoice_id
       JOIN deals d ON d.id = p.deal_id
       LEFT JOIN companies co ON co.id = d.company_id
      WHERE t.tenant_id = ? AND d.deal_type = ?`, [tenantId, dealType]);
}

const invoiceRow = (t, label) => ({
  type: label, reference: t.reference, party: t.party, date: t.date, due_date: t.due_date, amount: num(t.amount),
  balance: num(num(t.amount) - num(t.paid_amount) - num(t.credited_amount)), status: t.status, link: `/erp/tax-invoices/view/${t.id}`,
});

async function service(tenantId) {
  const orders = await q(
    `SELECT qt.id, qt.quotation_date AS date, qt.quotation_amount AS amount, qt.status, COALESCE(co.company_name, '') AS party, d.deal_number
       FROM quotations qt
       JOIN deals d ON d.id = qt.deal_id
       LEFT JOIN companies co ON co.id = d.company_id
      WHERE qt.tenant_id = ? AND d.deal_type = 'offer_to_charge'`, [tenantId]);
  const invoices = await invoicesForDealType(tenantId, 'offer_to_charge');
  return [
    ...orders.map((o) => ({ type: 'Service Order', reference: `${o.deal_number || 'Deal'} / Q${o.id}`, party: o.party, date: o.date, amount: num(o.amount), status: o.status, link: `/erp/quotations/view/${o.id}` })),
    ...invoices.map((t) => invoiceRow(t, 'Service Invoice')),
  ];
}

async function sales(tenantId) {
  const orders = await q(
    `SELECT o.id, o.outbound_number, o.completed_at AS date, o.status, COALESCE(co.company_name, '') AS party,
            COALESCE((SELECT SUM(i.quantity * COALESCE(i.unit_value, 0)) FROM outbound_items i WHERE i.outbound_id = o.id), 0) AS amount
       FROM outbounds o
       LEFT JOIN companies co ON co.id = o.company_id
      WHERE o.tenant_id = ? AND o.outbound_type = 'sale'`, [tenantId]);
  const invoices = await invoicesForDealType(tenantId, 'free_of_charge');
  return [
    ...orders.map((o) => ({ type: 'Sales Order', reference: o.outbound_number, party: o.party, date: o.date, amount: num(o.amount), status: o.status === 'completed' ? 'dispatched' : o.status, link: `/erp/outbound/view/${o.id}` })),
    ...invoices.map((t) => invoiceRow(t, 'Sales Invoice')),
  ];
}

/** Accounts: every sales (tax) invoice, whatever the deal type. */
async function salesInvoices(tenantId) {
  const invoices = await q(
    `SELECT t.id, t.tax_invoice_number AS reference, t.invoice_date AS date, t.due_date, t.total AS amount, t.paid_amount, t.credited_amount, t.payment_status AS status,
            COALESCE(co.company_name, '') AS party
       FROM tax_invoices t
       LEFT JOIN proforma_invoices p ON p.id = t.proforma_invoice_id
       LEFT JOIN deals d ON d.id = p.deal_id
       LEFT JOIN companies co ON co.id = COALESCE(d.company_id, t.company_id)
      WHERE t.tenant_id = ?`, [tenantId]).catch(async () => q(
    `SELECT t.id, t.tax_invoice_number AS reference, t.invoice_date AS date, t.due_date, t.total AS amount, t.paid_amount, t.credited_amount, t.payment_status AS status,
            COALESCE(co.company_name, '') AS party
       FROM tax_invoices t
       LEFT JOIN proforma_invoices p ON p.id = t.proforma_invoice_id
       LEFT JOIN deals d ON d.id = p.deal_id
       LEFT JOIN companies co ON co.id = d.company_id
      WHERE t.tenant_id = ?`, [tenantId]));
  return invoices.map((t) => invoiceRow(t, 'Sales Invoice'));
}

/** Accounts: every purchase bill (vendor bill) with its Purchase-bill reference. */
async function purchaseBills(tenantId) {
  const sql = (ref) => `SELECT b.id, b.bill_number, b.supplier_invoice_no, ${ref} AS purchase_bill_reference, b.bill_date AS date, b.total AS amount, b.paid_amount, b.debit_note_amount, b.status,
            COALESCE(s.company_name, c.company_name, '') AS party
       FROM vendor_bills b
       LEFT JOIN suppliers s ON s.id = b.supplier_id
       LEFT JOIN companies c ON c.id = b.company_id
      WHERE b.tenant_id = ?`;
  let bills;
  try { bills = await q(sql('b.purchase_bill_reference'), [tenantId]); } catch (e) { bills = await q(sql('NULL'), [tenantId]); }
  return bills.map((b) => ({
    type: 'Purchase Bill', reference: b.bill_number, bill_reference: b.purchase_bill_reference || '', party: b.party, date: b.date, amount: num(b.amount),
    balance: num(num(b.amount) - num(b.paid_amount) - num(b.debit_note_amount)), status: b.status, link: '/erp/vendor-bills',
  }));
}

const KINDS = { purchase, service, sales, sales_invoices: salesInvoices, purchase_bills: purchaseBills };

/** kind: purchase | service | sales. `docType` limits to one document type (e.g. "Sales Order"). */
async function list(tenantId, kind, { search, docType, offset = 0, limit = 25 } = {}) {
  const fn = KINDS[kind];
  if (!fn) throw Object.assign(new Error('Unknown register'), { statusCode: 404 });
  let rows = await fn(tenantId);
  if (docType) rows = rows.filter((r) => r.type === docType);
  if (search) {
    const s = String(search).trim().toLowerCase();
    rows = rows.filter((r) => [r.reference, r.bill_reference, r.party, r.status, r.type].some((v) => String(v || '').toLowerCase().includes(s)));
  }
  rows.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return { rows: rows.slice(offset, offset + limit), total: rows.length };
}

module.exports = { list, KINDS: Object.keys(KINDS) };
