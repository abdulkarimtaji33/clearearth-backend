/**
 * One-off clean-up of purchase-order approval journals posted before the vendor-bill flow:
 *
 *   - "PO approved" journals whose PO is NOT approved (stale/erroneous): reversed.
 *   - Approved POs with no payments whose journal credited AP (Dr 5000 or 2200 / Cr 2000): reversed and
 *     reposted as Dr expense head (PO.expense_account_id, else 5000) / Cr 2200 Accrued Expenses, and the PO
 *     is switched to the vendor-bill flow (bill_flow = 1) so the supplier invoice is recorded as a vendor bill.
 *   - Approved POs that already have payments are reported and left alone.
 *
 * Ledger lines are never edited: corrections are reversal entries (reverseJournalEntry) plus new postings.
 * Dry run by default; apply with CONFIRM=YES. Idempotent (reversed entries and bill_flow POs are skipped).
 *
 *   node scripts/fix-legacy-po-accruals.js
 *   CONFIRM=YES node scripts/fix-legacy-po-accruals.js
 */
require('dotenv').config();
const db = require('../src/models');
const jeService = require('../src/services/journalEntry.service');
const vendorBillService = require('../src/services/vendorBill.service');

const APPLY = process.env.CONFIRM === 'YES';
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

(async () => {
  console.log(APPLY ? 'APPLYING changes' : 'DRY RUN (set CONFIRM=YES to apply)');
  let reversed = 0;
  let reposted = 0;
  let skipped = 0;

  const entries = await db.JournalEntry.findAll({
    where: { source_type: 'purchase_order_approved', status: 'posted', reversed_by_id: null },
    order: [['id', 'ASC']],
  });
  if (!entries.length) console.log('No un-reversed "PO approved" journal entries found.');

  for (const entry of entries) {
    const tenantId = entry.tenant_id;
    const po = await db.PurchaseOrder.findOne({
      where: { id: entry.source_id, tenant_id: tenantId },
      include: [{ model: db.PurchaseOrderItem, as: 'items', required: false }],
    });
    const label = `${entry.entry_number} (PO #${entry.source_id})`;

    if (!po) {
      console.log(`  ${label}: PO no longer exists -> reverse`);
      if (APPLY) await jeService.reverseJournalEntry(tenantId, 1, entry.id, { reason: 'Purchase order no longer exists', reversalDate: entry.entry_date });
      reversed += 1;
      continue;
    }

    if (po.bill_flow) {
      // Already on the new flow: this entry is the new Dr expense / Cr 2200 accrual.
      continue;
    }

    const total = round2((po.items || []).reduce((s, it) => s + (parseFloat(it.total) || 0), 0));

    if (po.status !== 'approved') {
      console.log(`  ${label}: PO status is "${po.status}" (not approved) -> reverse stale approval journal`);
      if (APPLY) {
        await jeService.reverseJournalEntry(tenantId, 1, entry.id, {
          reason: `PO #${po.id} is not approved (status ${po.status}); approval journal was posted in error`,
          reversalDate: entry.entry_date,
        });
      }
      reversed += 1;
      continue;
    }

    const payments = await db.PaymentTransaction.count({
      where: { tenant_id: tenantId, source_type: ['payable', 'vendor_bill'], source_id: po.id },
    });
    const poPayJe = await db.JournalEntry.count({ where: { tenant_id: tenantId, source_type: 'po_payment', source_id: po.id } });
    if (payments > 0 || poPayJe > 0 || parseFloat(po.paid_amount || 0) > 0) {
      console.log(`  ${label}: approved PO already has payments -> left unchanged (review manually)`);
      skipped += 1;
      continue;
    }

    if (total <= 0.005) {
      console.log(`  ${label}: zero-value PO -> reverse only`);
      if (APPLY) await jeService.reverseJournalEntry(tenantId, 1, entry.id, { reason: `PO #${po.id} has no value`, reversalDate: entry.entry_date });
      reversed += 1;
      continue;
    }

    console.log(`  ${label}: approved, unpaid, total ${total.toFixed(2)} -> reverse AP posting, repost Dr expense / Cr 2200, move to vendor-bill flow`);
    if (APPLY) {
      await jeService.reverseJournalEntry(tenantId, 1, entry.id, {
        reason: `Legacy PO approval credited Accounts Payable; reposted as accrual (Cr 2200) for the vendor bill flow`,
        reversalDate: entry.entry_date,
      });
      await vendorBillService.postPoAccrual(tenantId, po.id, total, entry.entry_date);
      reposted += 1;
    } else {
      reposted += 1;
    }
    reversed += 1;
  }

  console.log(`\n${APPLY ? 'Done' : 'Would do'}: ${reversed} reversal(s), ${reposted} accrual repost(s), ${skipped} skipped for manual review.`);
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
