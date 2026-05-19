/**
 * One-time script: seed COA + create journal entries for all existing
 * tax invoices, expenses, and purchase orders.
 * Safe to re-run — skips records that already have journal entries.
 *
 * Usage: node src/scripts/migrate-historical-journal-entries.js
 */
const db = require('../../src/models');
const { seedDefaultAccounts } = require('../services/chartOfAccounts.service');
const { createJournalEntry, getSystemAccountId } = require('../services/journalEntry.service');

async function run() {
  console.log('Historical GL migration starting...');

  const [tenants] = await db.sequelize.query(`SELECT id FROM tenants`);
  const systemUserId = 1; // fallback user for auto-created entries

  for (const tenant of tenants) {
    const tenantId = tenant.id;
    console.log(`\n── Tenant ${tenantId} ──────────────────────────────`);

    // 1. Seed COA
    const seedResult = await seedDefaultAccounts(tenantId, systemUserId);
    console.log(seedResult.seeded ? `  Seeded ${seedResult.count} accounts` : '  COA already exists');

    // 2. Tax Invoices → AR / Revenue / VAT
    const [invoices] = await db.sequelize.query(
      `SELECT id, tax_invoice_number, invoice_date, subtotal, vat_amount, total, paid_amount, created_by
       FROM tax_invoices WHERE tenant_id = ? ORDER BY invoice_date ASC`,
      { replacements: [tenantId] }
    );
    console.log(`  Processing ${invoices.length} tax invoices...`);

    for (const inv of invoices) {
      const exists = await db.JournalEntry.findOne({ where: { tenant_id: tenantId, source_type: 'tax_invoice', source_id: inv.id } });
      if (exists) continue;

      try {
        const arId  = await getSystemAccountId(tenantId, '1100');
        const revId = await getSystemAccountId(tenantId, '4000');
        const vatId = await getSystemAccountId(tenantId, '2100');
        const total    = parseFloat(inv.total) || 0;
        const subtotal = parseFloat(inv.subtotal) || 0;
        const vatAmt   = parseFloat(inv.vat_amount) || 0;
        const jeLines  = [
          { accountId: arId,  debit: total, credit: 0 },
          { accountId: revId, debit: 0, credit: subtotal },
        ];
        if (vatAmt > 0.005) jeLines.push({ accountId: vatId, debit: 0, credit: vatAmt });

        await createJournalEntry(tenantId, inv.created_by || systemUserId, {
          entryDate: inv.invoice_date,
          description: `Tax Invoice ${inv.tax_invoice_number}`,
          sourceType: 'tax_invoice',
          sourceId: inv.id,
          lines: jeLines,
        });

        // Payment entry if already paid
        const paid = parseFloat(inv.paid_amount) || 0;
        if (paid > 0.005) {
          const cashId = await getSystemAccountId(tenantId, '1000');
          await createJournalEntry(tenantId, inv.created_by || systemUserId, {
            entryDate: inv.invoice_date,
            description: `Payment Received — Invoice ${inv.tax_invoice_number}`,
            sourceType: 'payment_received',
            sourceId: inv.id,
            lines: [
              { accountId: cashId, debit: paid, credit: 0 },
              { accountId: arId,   debit: 0, credit: paid },
            ],
          });
        }
      } catch (e) {
        console.warn(`    Invoice ${inv.id} skipped: ${e.message}`);
      }
    }

    // 3. Expenses → Expense Account / Accrued
    const [expenses] = await db.sequelize.query(
      `SELECT id, category, amount, expense_date, paid_amount, created_by
       FROM expenses WHERE tenant_id = ? ORDER BY expense_date ASC`,
      { replacements: [tenantId] }
    );
    console.log(`  Processing ${expenses.length} expenses...`);

    const CATEGORY_TO_CODE = {
      work_orders: '5000', materials: '5200', equipment: '5200',
      professional: '5300', travel: '5400', fuel: '5400', utility: '5500', other: '5100',
    };

    for (const exp of expenses) {
      const exists = await db.JournalEntry.findOne({ where: { tenant_id: tenantId, source_type: 'expense', source_id: exp.id } });
      if (exists) continue;

      try {
        const expCode  = CATEGORY_TO_CODE[exp.category] || '5100';
        const expAccId = await getSystemAccountId(tenantId, expCode);
        const accruId  = await getSystemAccountId(tenantId, '2200');
        const amt      = parseFloat(exp.amount) || 0;
        if (amt <= 0.005) continue;

        await createJournalEntry(tenantId, exp.created_by || systemUserId, {
          entryDate: exp.expense_date,
          description: `Expense — ${exp.category}`,
          sourceType: 'expense',
          sourceId: exp.id,
          lines: [
            { accountId: expAccId, debit: amt, credit: 0 },
            { accountId: accruId,  debit: 0,   credit: amt },
          ],
        });

        const paid = parseFloat(exp.paid_amount) || 0;
        if (paid > 0.005) {
          const cashId = await getSystemAccountId(tenantId, '1000');
          await createJournalEntry(tenantId, exp.created_by || systemUserId, {
            entryDate: exp.expense_date,
            description: `Expense Payment — ${exp.category}`,
            sourceType: 'expense_payment',
            sourceId: exp.id,
            lines: [
              { accountId: accruId, debit: paid, credit: 0 },
              { accountId: cashId,  debit: 0,    credit: paid },
            ],
          });
        }
      } catch (e) {
        console.warn(`    Expense ${exp.id} skipped: ${e.message}`);
      }
    }

    // 4. Approved Purchase Orders → CoS / AP
    const [pos] = await db.sequelize.query(
      `SELECT po.id, po.po_date, po.paid_amount,
              COALESCE(SUM(CAST(poi.total AS DECIMAL(15,2))), 0) AS po_total
       FROM purchase_orders po
       LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       WHERE po.tenant_id = ? AND po.status = 'approved'
       GROUP BY po.id ORDER BY po.po_date ASC`,
      { replacements: [tenantId] }
    );
    console.log(`  Processing ${pos.length} approved POs...`);

    for (const po of pos) {
      const exists = await db.JournalEntry.findOne({ where: { tenant_id: tenantId, source_type: 'purchase_order_approved', source_id: po.id } });
      if (exists) continue;

      try {
        const poTotal = parseFloat(po.po_total) || 0;
        if (poTotal <= 0.005) continue;

        const cosId = await getSystemAccountId(tenantId, '5000');
        const apId  = await getSystemAccountId(tenantId, '2000');

        await createJournalEntry(tenantId, systemUserId, {
          entryDate: po.po_date || new Date().toISOString().slice(0, 10),
          description: `PO Approved — PO #${po.id}`,
          sourceType: 'purchase_order_approved',
          sourceId: po.id,
          lines: [
            { accountId: cosId, debit: poTotal, credit: 0 },
            { accountId: apId,  debit: 0,       credit: poTotal },
          ],
        });

        const paid = parseFloat(po.paid_amount) || 0;
        if (paid > 0.005) {
          const cashId = await getSystemAccountId(tenantId, '1000');
          await createJournalEntry(tenantId, systemUserId, {
            entryDate: po.po_date || new Date().toISOString().slice(0, 10),
            description: `PO Payment — PO #${po.id}`,
            sourceType: 'po_payment',
            sourceId: po.id,
            lines: [
              { accountId: apId,   debit: paid, credit: 0 },
              { accountId: cashId, debit: 0,    credit: paid },
            ],
          });
        }
      } catch (e) {
        console.warn(`    PO ${po.id} skipped: ${e.message}`);
      }
    }

    console.log(`  Tenant ${tenantId} done.`);
  }

  console.log('\n✅ Historical GL migration completed.');
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
});
