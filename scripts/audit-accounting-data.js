// READ-ONLY audit of accounting data on dev. Prints findings; changes nothing.
require('dotenv').config();
const db = require('../src/models');
(async () => {
  const q = async (s) => (await db.sequelize.query(s))[0];
  const p = async (label, fn) => {
    try { const r = await fn(); console.log(`\n## ${label}\n` + JSON.stringify(r, null, 0)); }
    catch (e) { console.log(`\n## ${label}\nERR ${e.message}`); }
  };
  await p('trial balance (non-void)', () => q("SELECT ROUND(SUM(debit),2) dr, ROUND(SUM(credit),2) cr FROM journal_entry_lines l JOIN journal_entries je ON je.id=l.journal_entry_id WHERE je.status<>'void'"));
  await p('unbalanced journal entries', () => q("SELECT je.id, je.entry_number, ROUND(SUM(l.debit),2) dr, ROUND(SUM(l.credit),2) cr FROM journal_entries je JOIN journal_entry_lines l ON l.journal_entry_id=je.id GROUP BY je.id HAVING ABS(dr-cr)>0.005"));
  await p('lines posted to GROUP or INACTIVE accounts', () => q("SELECT je.id, je.entry_number, je.entry_date, je.source_type, je.status, a.code, a.name, a.is_group, a.is_active, l.debit, l.credit FROM journal_entry_lines l JOIN journal_entries je ON je.id=l.journal_entry_id JOIN chart_of_accounts a ON a.id=l.account_id WHERE a.is_group=1 OR a.is_active=0"));
  await p('account balances (non-zero)', () => q("SELECT a.tenant_id, a.code, a.name, ROUND(SUM(l.debit-l.credit),2) net FROM journal_entry_lines l JOIN journal_entries je ON je.id=l.journal_entry_id AND je.status<>'void' JOIN chart_of_accounts a ON a.id=l.account_id GROUP BY a.id HAVING ABS(net)>0.004 ORDER BY a.tenant_id, a.code"));
  await p('journal entries by source/status', () => q("SELECT source_type, status, COUNT(*) n FROM journal_entries GROUP BY source_type, status"));
  await p('JEs without creator', () => q("SELECT id, entry_number, source_type FROM journal_entries WHERE created_by IS NULL"));
  await p('tax invoices vs journal', () => q("SELECT ti.id, ti.tax_invoice_number, ti.total, ti.paid_amount, ti.credited_amount, ti.payment_status, ti.invoice_date, ti.due_date, (SELECT ROUND(SUM(l.debit),2) FROM journal_entries je JOIN journal_entry_lines l ON l.journal_entry_id=je.id WHERE je.source_type='tax_invoice' AND je.source_id=ti.id AND je.status<>'void') je_total, (SELECT COUNT(*) FROM journal_entries je WHERE je.source_type='tax_invoice' AND je.source_id=ti.id) je_count FROM tax_invoices ti WHERE ti.deleted_at IS NULL"));
  await p('tax invoice payments vs paid_amount', () => q("SELECT ti.id, ti.tax_invoice_number, ti.paid_amount, (SELECT ROUND(COALESCE(SUM(pt.amount),0),2) FROM payment_transactions pt WHERE pt.source_type='receivable' AND pt.source_id=ti.id) tx_sum FROM tax_invoices ti WHERE ti.deleted_at IS NULL"));
  await p('invoices due before invoice date', () => q("SELECT id, tax_invoice_number, invoice_date, due_date FROM tax_invoices WHERE due_date < invoice_date AND deleted_at IS NULL"));
  await p('proformas', () => q("SELECT p.id, p.proforma_number, p.deal_id, p.invoice_date, p.due_date, p.subtotal, p.vat_percentage, p.vat_amount, p.total, ROUND(p.subtotal*p.vat_percentage/100,2) vat_expected, (SELECT COUNT(*) FROM tax_invoices t WHERE t.proforma_invoice_id=p.id AND t.deleted_at IS NULL) invoiced FROM proforma_invoices p WHERE p.deleted_at IS NULL"));
  await p('proformas with wrong VAT or due<date', () => q("SELECT id, proforma_number, vat_amount, ROUND(subtotal*vat_percentage/100,2) expected, invoice_date, due_date FROM proforma_invoices WHERE deleted_at IS NULL AND (ABS(vat_amount - ROUND(subtotal*vat_percentage/100,2))>0.02 OR due_date<invoice_date)"));
  await p('duplicate proformas (same deal+total)', () => q("SELECT deal_id, total, COUNT(*) n, GROUP_CONCAT(proforma_number) nums FROM proforma_invoices WHERE deleted_at IS NULL GROUP BY deal_id, total HAVING n>1"));
  await p('duplicate company names', () => q("SELECT tenant_id, LOWER(TRIM(company_name)) nm, COUNT(*) n, GROUP_CONCAT(id) ids FROM companies WHERE deleted_at IS NULL GROUP BY tenant_id, nm HAVING n>1"));
  await p('purchase orders', () => q("SELECT po.id, po.status, po.payment_status, po.paid_amount, po.bill_flow, po.po_date, (SELECT COALESCE(SUM(total),0) FROM purchase_order_items i WHERE i.purchase_order_id=po.id) total, (SELECT COUNT(*) FROM journal_entries je WHERE je.source_type='purchase_order_approved' AND je.source_id=po.id AND je.status<>'void') accrual_jes FROM purchase_orders po WHERE po.deleted_at IS NULL AND po.status='approved'"));
  await p('approved POs with NO accrual journal', () => q("SELECT po.id, po.status, po.bill_flow FROM purchase_orders po WHERE po.deleted_at IS NULL AND po.status='approved' AND NOT EXISTS (SELECT 1 FROM journal_entries je WHERE je.source_type='purchase_order_approved' AND je.source_id=po.id AND je.status<>'void')"));
  await p('zero-total approved POs', () => q("SELECT po.id, po.status FROM purchase_orders po WHERE po.deleted_at IS NULL AND po.status='approved' AND (SELECT COALESCE(SUM(total),0) FROM purchase_order_items i WHERE i.purchase_order_id=po.id)=0"));
  await p('vendor bills', () => q("SELECT id, bill_number, purchase_order_id, total, paid_amount, status FROM vendor_bills"));
  await p('payment transactions', () => q("SELECT pt.id, pt.source_type, pt.source_id, pt.amount, pt.paid_at, a.code acct, a.name, pt.journal_entry_id FROM payment_transactions pt LEFT JOIN chart_of_accounts a ON a.id=pt.payment_account_id ORDER BY pt.id"));
  await p('expenses', () => q("SELECT e.id, e.category, e.amount, e.expense_date, e.payment_status, e.paid_amount, e.reference, a.code gl, a.is_group FROM expenses e LEFT JOIN chart_of_accounts a ON a.id=e.gl_account_id WHERE e.deleted_at IS NULL"));
  await p('work order task expenses', () => q("SELECT e.id, t.work_order_id, e.description, e.amount, e.accounts_status FROM work_order_task_expenses e JOIN work_order_tasks t ON t.id=e.work_order_task_id"));
  await p('credit notes', () => q("SELECT id, credit_note_number, tax_invoice_id, subtotal, vat_amount, total, journal_entry_id FROM credit_notes"));
  await p('fiscal periods not open', () => q("SELECT fp.id, fp.name, fp.status FROM fiscal_periods fp WHERE fp.status<>'open'"));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
