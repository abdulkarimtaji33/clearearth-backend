#!/usr/bin/env node
/**
 * Permanently (hard) delete transactional business data older than a cutoff,
 * while keeping the most recent N days and all system/seed data.
 *
 * Scope: leads, contacts, companies, suppliers, deals and everything chained off
 * a deal (items, WDS, inspection, images, terms, location tokens, quotations,
 * proforma/tax invoices + items, purchase orders + items/terms, work orders,
 * work order tasks/expenses/files, GRNs + items/images), plus journal_entries /
 * journal_entry_lines / payment_transactions that reference the deleted
 * invoices/purchase-orders/expenses (matched via source_type + source_id).
 *
 * Never touches: tenants, users, roles, permissions, and lookup/seed tables.
 *
 * A record chained off a deal is removed if the DEAL is old (created_at < cutoff),
 * regardless of the child row's own timestamp (children can't outlive a deleted
 * parent). Independent root tables (contacts, companies, suppliers, leads) are
 * filtered strictly by their OWN created_at.
 *
 * Usage:
 *   DRY_RUN=1 node scripts/purge-old-transactional-data.js            # preview only
 *   CONFIRM_CLEAR=YES node scripts/purge-old-transactional-data.js    # execute
 *   CONFIRM_CLEAR=YES CUTOFF_DAYS=2 node scripts/purge-old-transactional-data.js
 */
'use strict';

require('dotenv').config();
const db = require('../src/models');
const { sequelize } = db;

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const CUTOFF_DAYS = parseInt(process.env.CUTOFF_DAYS || '2', 10);

if (!DRY_RUN && process.env.CONFIRM_CLEAR !== 'YES') {
  console.error('Refusing to run without CONFIRM_CLEAR=YES (use DRY_RUN=1 to preview).');
  process.exit(1);
}

// SQL-safe "column IN (ids)" fragment; falls back to an always-false clause when empty.
function inClause(ids) {
  if (!ids || ids.length === 0) return '(-1)';
  return `(${ids.map((id) => Number(id)).join(',')})`;
}

async function selectIds(sql) {
  const [rows] = await sequelize.query(sql);
  return rows.map((r) => r.id);
}

async function run(sql, label) {
  if (DRY_RUN) {
    const countSql = sql.replace(/^DELETE FROM/i, 'SELECT COUNT(*) AS c FROM');
    const [[{ c }]] = await sequelize.query(countSql);
    if (Number(c) > 0) console.log(`  would delete ${c} from ${label}`);
    return Number(c);
  }
  const [result, meta] = await sequelize.query(sql);
  const affected = meta?.affectedRows ?? 0;
  if (affected > 0) console.log(`  deleted ${affected} from ${label}`);
  return affected;
}

async function main() {
  console.log(`Database: ${sequelize.config.database}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'DELETE'}`);
  console.log(`Cutoff: created_at < NOW() - INTERVAL ${CUTOFF_DAYS} DAY\n`);

  const [[{ cutoff }]] = await sequelize.query(
    `SELECT DATE_FORMAT(NOW() - INTERVAL ${CUTOFF_DAYS} DAY, '%Y-%m-%d %H:%i:%s') AS cutoff`
  );
  console.log(`Resolved cutoff timestamp: ${cutoff}\n`);
  const CUTOFF = `'${cutoff}'`;

  let total = 0;

  // ---- Gather ID sets (deal-chain records inherit their parent deal's age) ----
  const oldDealIds = await selectIds(`SELECT id FROM deals WHERE created_at < ${CUTOFF}`);
  const dealIn = inClause(oldDealIds);

  const oldQuotationIds = await selectIds(
    `SELECT id FROM quotations WHERE deal_id IN ${dealIn} OR created_at < ${CUTOFF}`
  );
  const quotationIn = inClause(oldQuotationIds);

  let oldWorkOrderIds = await selectIds(
    `SELECT id FROM work_orders WHERE deal_id IN ${dealIn} OR quotation_id IN ${quotationIn} OR created_at < ${CUTOFF}`
  );

  const oldPurchaseOrderIds = await selectIds(
    `SELECT id FROM purchase_orders WHERE deal_id IN ${dealIn} OR work_order_id IN ${inClause(oldWorkOrderIds)} OR created_at < ${CUTOFF}`
  );
  const purchaseOrderIn = inClause(oldPurchaseOrderIds);

  // Second pass: work orders sourced FROM one of those purchase orders.
  const moreWorkOrderIds = await selectIds(
    `SELECT id FROM work_orders WHERE purchase_order_id IN ${purchaseOrderIn}`
  );
  oldWorkOrderIds = Array.from(new Set([...oldWorkOrderIds, ...moreWorkOrderIds]));
  const workOrderIn = inClause(oldWorkOrderIds);

  const oldProformaInvoiceIds = await selectIds(
    `SELECT id FROM proforma_invoices WHERE quotation_id IN ${quotationIn} OR deal_id IN ${dealIn} OR created_at < ${CUTOFF}`
  );
  const proformaIn = inClause(oldProformaInvoiceIds);

  const oldTaxInvoiceIds = await selectIds(
    `SELECT id FROM tax_invoices WHERE proforma_invoice_id IN ${proformaIn} OR created_at < ${CUTOFF}`
  );
  const taxInvoiceIn = inClause(oldTaxInvoiceIds);

  const oldGrnIds = await selectIds(
    `SELECT id FROM grns WHERE deal_id IN ${dealIn} OR work_order_id IN ${workOrderIn} OR created_at < ${CUTOFF}`
  );
  const grnIn = inClause(oldGrnIds);

  const oldGrnItemIds = await selectIds(`SELECT id FROM grn_items WHERE grn_id IN ${grnIn}`);
  const grnItemIn = inClause(oldGrnItemIds);

  const oldWorkOrderTaskIds = await selectIds(
    `SELECT id FROM work_order_tasks WHERE work_order_id IN ${workOrderIn} OR created_at < ${CUTOFF}`
  );
  const taskIn = inClause(oldWorkOrderTaskIds);

  const oldWoteIds = await selectIds(
    `SELECT id FROM work_order_task_expenses WHERE work_order_task_id IN ${taskIn} OR created_at < ${CUTOFF}`
  );
  const woteIn = inClause(oldWoteIds);

  const oldExpenseIds = await selectIds(
    `SELECT id FROM expenses WHERE work_order_task_expense_id IN ${woteIn}`
  );
  const expenseIn = inClause(oldExpenseIds);

  const oldDealWdsIds = await selectIds(`SELECT id FROM deal_wds WHERE deal_id IN ${dealIn}`);
  const dealWdsIn = inClause(oldDealWdsIds);

  // Ledger entries tied to invoices/POs/expenses we're about to remove (polymorphic source_type/source_id).
  const journalWhere = `
    (source_type IN ('tax_invoice','payment_received') AND source_id IN ${taxInvoiceIn})
    OR (source_type IN ('expense','expense_payment') AND source_id IN ${expenseIn})
    OR (source_type IN ('purchase_order_approved','po_payment') AND source_id IN ${purchaseOrderIn})
  `;
  const oldJournalEntryIds = await selectIds(`SELECT id FROM journal_entries WHERE ${journalWhere}`);
  const journalEntryIn = inClause(oldJournalEntryIds);

  // ---- Delete leaf-to-root ----
  total += await run(`DELETE FROM journal_entry_lines WHERE journal_entry_id IN ${journalEntryIn}`, 'journal_entry_lines');
  total += await run(`DELETE FROM journal_entries WHERE ${journalWhere}`, 'journal_entries');
  total += await run(
    `DELETE FROM payment_transactions WHERE
       (source_type = 'receivable' AND source_id IN ${taxInvoiceIn})
       OR (source_type = 'payable' AND source_id IN ${purchaseOrderIn})
       OR (source_type = 'expense' AND source_id IN ${expenseIn})`,
    'payment_transactions'
  );

  total += await run(`DELETE FROM expenses WHERE work_order_task_expense_id IN ${woteIn}`, 'expenses');
  total += await run(`DELETE FROM work_order_task_expenses WHERE id IN ${woteIn}`, 'work_order_task_expenses');
  total += await run(`DELETE FROM work_order_task_files WHERE task_id IN ${taskIn}`, 'work_order_task_files');
  total += await run(`DELETE FROM work_order_tasks WHERE id IN ${taskIn}`, 'work_order_tasks');

  total += await run(`DELETE FROM grn_images WHERE grn_item_id IN ${grnItemIn}`, 'grn_images');
  total += await run(`DELETE FROM grn_items WHERE id IN ${grnItemIn}`, 'grn_items');
  total += await run(`DELETE FROM grns WHERE id IN ${grnIn}`, 'grns');

  total += await run(`DELETE FROM tax_invoice_items WHERE tax_invoice_id IN ${taxInvoiceIn}`, 'tax_invoice_items');
  total += await run(`DELETE FROM tax_invoices WHERE id IN ${taxInvoiceIn}`, 'tax_invoices');
  total += await run(`DELETE FROM proforma_invoice_items WHERE proforma_invoice_id IN ${proformaIn}`, 'proforma_invoice_items');
  total += await run(`DELETE FROM proforma_invoices WHERE id IN ${proformaIn}`, 'proforma_invoices');

  total += await run(`DELETE FROM purchase_order_items WHERE purchase_order_id IN ${purchaseOrderIn}`, 'purchase_order_items');
  total += await run(`DELETE FROM purchase_order_terms WHERE purchase_order_id IN ${purchaseOrderIn}`, 'purchase_order_terms');
  total += await run(`DELETE FROM purchase_orders WHERE id IN ${purchaseOrderIn}`, 'purchase_orders');

  total += await run(`DELETE FROM work_orders WHERE id IN ${workOrderIn}`, 'work_orders');
  total += await run(`DELETE FROM quotations WHERE id IN ${quotationIn}`, 'quotations');

  total += await run(`DELETE FROM deal_wds_attachments WHERE deal_wds_id IN ${dealWdsIn}`, 'deal_wds_attachments');
  total += await run(`DELETE FROM deal_wds WHERE id IN ${dealWdsIn}`, 'deal_wds');
  total += await run(`DELETE FROM deal_inspection_reports WHERE deal_id IN ${dealIn}`, 'deal_inspection_reports');
  total += await run(`DELETE FROM deal_inspection_requests WHERE deal_id IN ${dealIn}`, 'deal_inspection_requests');
  total += await run(`DELETE FROM deal_images WHERE deal_id IN ${dealIn}`, 'deal_images');
  total += await run(`DELETE FROM deal_terms WHERE deal_id IN ${dealIn}`, 'deal_terms');
  total += await run(`DELETE FROM deal_location_tokens WHERE deal_id IN ${dealIn}`, 'deal_location_tokens');
  total += await run(`DELETE FROM deal_items WHERE deal_id IN ${dealIn}`, 'deal_items');
  total += await run(`DELETE FROM deals WHERE id IN ${dealIn}`, 'deals');

  // Leads: strictly by own age, but never orphan a deal that survived (kept deal with lead_id set).
  total += await run(
    `DELETE FROM leads WHERE created_at < ${CUTOFF}
       AND id NOT IN (SELECT lead_id FROM deals WHERE lead_id IS NOT NULL)`,
    'leads'
  );

  // ---- Independent root entities: filtered by their OWN created_at only ----
  // Join tables first (no cascade), then the parent rows. FK violations (still
  // referenced by a kept/recent record) are caught per-table and reported, not
  // silently swallowed — matching rows just stay in place.
  total += await runCatchable(
    `DELETE cc FROM company_contacts cc
       LEFT JOIN companies c ON c.id = cc.company_id
       LEFT JOIN contacts ct ON ct.id = cc.contact_id
       WHERE (c.created_at < ${CUTOFF} OR ct.created_at < ${CUTOFF})`,
    'company_contacts'
  );
  total += await runCatchable(
    `DELETE sc FROM supplier_contacts sc
       LEFT JOIN suppliers s ON s.id = sc.supplier_id
       LEFT JOIN contacts ct ON ct.id = sc.contact_id
       WHERE (s.created_at < ${CUTOFF} OR ct.created_at < ${CUTOFF})`,
    'supplier_contacts'
  );

  total += await deleteRowByRow('companies', `SELECT id FROM companies WHERE created_at < ${CUTOFF}`);
  total += await deleteRowByRow('suppliers', `SELECT id FROM suppliers WHERE created_at < ${CUTOFF}`);
  total += await deleteRowByRow('contacts', `SELECT id FROM contacts WHERE created_at < ${CUTOFF}`);

  console.log(`\n${DRY_RUN ? 'Would delete' : 'Deleted'} ${total} rows total.`);
  console.log(DRY_RUN ? '\nDry run complete. Re-run with CONFIRM_CLEAR=YES to apply.' : '\nDone.');
  process.exit(0);
}

// Deletes candidate rows one at a time so a single still-referenced row
// (e.g. a company still linked to a kept recent deal) doesn't block the rest.
async function deleteRowByRow(table, selectIdsSql) {
  const ids = await selectIds(selectIdsSql);
  if (ids.length === 0) return 0;

  if (DRY_RUN) {
    console.log(`  would attempt to delete ${ids.length} from ${table} (candidates; some may be kept if still referenced)`);
    return 0;
  }

  let deleted = 0;
  let skipped = 0;
  for (const id of ids) {
    try {
      await sequelize.query(`DELETE FROM \`${table}\` WHERE id = ${Number(id)}`);
      deleted += 1;
    } catch (err) {
      skipped += 1;
    }
  }
  if (deleted > 0) console.log(`  deleted ${deleted} from ${table}`);
  if (skipped > 0) console.log(`  skipped ${skipped} from ${table} (still referenced by kept records)`);
  return deleted;
}

async function runCatchable(sql, label) {
  if (DRY_RUN) {
    const countSql = sql
      .replace(/^DELETE (\w+) FROM/i, 'SELECT COUNT(*) AS c FROM')
      .replace(/^DELETE FROM/i, 'SELECT COUNT(*) AS c FROM');
    const [[{ c }]] = await sequelize.query(countSql);
    if (Number(c) > 0) console.log(`  would delete ${c} from ${label} (candidates; some may be kept if still referenced)`);
    return 0;
  }
  try {
    const [, meta] = await sequelize.query(sql);
    const affected = meta?.affectedRows ?? 0;
    if (affected > 0) console.log(`  deleted ${affected} from ${label}`);
    return affected;
  } catch (err) {
    console.warn(`  skipped ${label}: ${err.message.split('\n')[0]}`);
    return 0;
  }
}

main().catch((err) => {
  console.error('Purge failed:', err.message);
  process.exit(1);
});
