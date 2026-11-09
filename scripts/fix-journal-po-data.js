/**
 * One-off, idempotent data tidy-up for the accounts module. DRY RUN by default.
 *
 *   node scripts/fix-journal-po-data.js                 # report only
 *   CONFIRM=YES node scripts/fix-journal-po-data.js     # apply
 *
 * What it does (never edits, deletes or re-dates a journal entry or journal line):
 *   1. Zero-value purchase orders that still read "unpaid"/"partial" are marked payment_status = 'paid'
 *      (nothing is owed on them). They no longer appear in Payables either way.
 *   2. For every tenant that has posted journal entries but no fiscal year, creates calendar fiscal
 *      years (12 open monthly periods each) covering the first to the last entry date, so period
 *      locking can be used. All periods are created OPEN, so posting behaviour does not change until
 *      someone closes a period.
 */
require('dotenv').config();
const db = require('../src/models');
const fiscalYearService = require('../src/services/fiscalYear.service');

const APPLY = process.env.CONFIRM === 'YES';

async function fixZeroValuePos() {
  const [rows] = await db.sequelize.query(`
    SELECT po.id, po.tenant_id, po.payment_status
    FROM purchase_orders po
    WHERE po.status = 'approved'
      AND (po.payment_status IS NULL OR po.payment_status IN ('unpaid', 'partial'))
      AND (SELECT COALESCE(SUM(CAST(poi.total AS DECIMAL(15,2))), 0) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) <= 0.005
      AND NOT EXISTS (
        SELECT 1 FROM journal_entries je
        WHERE je.tenant_id = po.tenant_id AND je.source_id = po.id AND je.source_type IN ('purchase_order_approved', 'po_payment')
      )
  `);
  console.log(`Zero-value approved POs still unpaid, with no ledger postings: ${rows.length}`);
  rows.forEach((r) => console.log(`  PO #${r.id} (tenant ${r.tenant_id}, payment_status=${r.payment_status || 'null'}) -> paid`));
  if (APPLY && rows.length) {
    await db.sequelize.query(
      `UPDATE purchase_orders SET payment_status = 'paid' WHERE id IN (${rows.map((r) => Number(r.id)).join(',')})`
    );
    console.log('  applied');
  }
}

async function ensureFiscalYears() {
  const [tenants] = await db.sequelize.query(`
    SELECT je.tenant_id, MIN(je.entry_date) AS first_date, MAX(je.entry_date) AS last_date, MIN(je.created_by) AS user_id
    FROM journal_entries je
    GROUP BY je.tenant_id
  `);
  for (const t of tenants) {
    const existing = await db.FiscalYear.count({ where: { tenant_id: t.tenant_id } });
    if (existing) {
      console.log(`Tenant ${t.tenant_id}: already has ${existing} fiscal year(s) — skipped`);
      continue;
    }
    const firstYear = new Date(t.first_date).getFullYear();
    const lastYear = Math.max(new Date(t.last_date).getFullYear(), new Date().getFullYear());
    const years = [];
    for (let y = firstYear; y <= lastYear; y += 1) years.push(y);
    console.log(`Tenant ${t.tenant_id}: no fiscal years; entries span ${t.first_date} .. ${t.last_date} -> create ${years.map((y) => `FY ${y}`).join(', ')}`);
    if (APPLY) {
      for (const y of years) {
        await fiscalYearService.createFiscalYear(t.tenant_id, t.user_id || 1, {
          name: `FY ${y}`, startDate: `${y}-01-01`, endDate: `${y}-12-31`,
        });
      }
      console.log('  applied');
    }
  }
}

(async () => {
  console.log(APPLY ? '*** APPLY MODE ***' : 'DRY RUN (set CONFIRM=YES to apply)');
  await fixZeroValuePos();
  await ensureFiscalYears();
  await db.sequelize.close();
})().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
