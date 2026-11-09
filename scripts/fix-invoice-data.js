#!/usr/bin/env node
/**
 * Correct invoice data damaged by the old proforma / tax-invoice bugs.
 *
 *  1. Proformas whose VAT / total do not equal (sum of lines) x VAT %  -> proforma row is recalculated.
 *  2. Tax invoices whose posted ledger entry differs from the tax invoice itself (AR = total,
 *     revenue = subtotal, VAT payable = VAT) -> the wrong posting is REVERSED and the correct one
 *     reposted. Posted journal lines are never edited or deleted; the original entry is only
 *     flagged as reversed. Both new entries use sourceType 'tax_invoice_correction'.
 *
 * Safe by default: prints what it would change and writes nothing unless CONFIRM=YES.
 * Idempotent: once corrected, the net posting equals the invoice and a re-run finds nothing to do.
 *
 * Usage:
 *   node scripts/fix-invoice-data.js              # dry run
 *   CONFIRM=YES node scripts/fix-invoice-data.js  # apply
 */
'use strict';

require('dotenv').config();
const db = require('../src/models');
const jeService = require('../src/services/journalEntry.service');

const APPLY = process.env.CONFIRM === 'YES';
const SOURCE_TYPES = ['tax_invoice', 'tax_invoice_correction'];
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;
const same = (a, b) => Math.abs(round2(a) - round2(b)) < 0.005;
const fmt = (n) => round2(n).toFixed(2);

/** Net posting per account code for one invoice, across original + correction entries. */
async function netPosting(tenantId, invoiceId) {
  const [rows] = await db.sequelize.query(
    `SELECT a.code, l.account_id, SUM(l.debit) AS dr, SUM(l.credit) AS cr
       FROM journal_entries je
       JOIN journal_entry_lines l ON l.journal_entry_id = je.id
       JOIN chart_of_accounts a ON a.id = l.account_id
      WHERE je.tenant_id = ? AND je.source_type IN (?) AND je.source_id = ? AND je.status = 'posted'
      GROUP BY a.code, l.account_id`,
    { replacements: [tenantId, SOURCE_TYPES, invoiceId] }
  );
  const by = {};
  rows.forEach((r) => { by[r.code] = { accountId: r.account_id, net: (parseFloat(r.dr) || 0) - (parseFloat(r.cr) || 0) }; });
  return by;
}

async function fixProformas() {
  console.log('\n== Proforma invoices (VAT / total vs lines) ==');
  const proformas = await db.ProformaInvoice.findAll({
    include: [{ model: db.ProformaInvoiceItem, as: 'items', required: false }],
  });
  let changes = 0;
  for (const p of proformas) {
    const lines = p.items || [];
    if (!lines.length) continue;
    const subtotal = round2(lines.reduce((s, it) => s + (parseFloat(it.line_total) || 0), 0));
    const vatPct = parseFloat(p.vat_percentage) || 0;
    const vat = round2((subtotal * vatPct) / 100);
    const total = round2(subtotal + vat);
    if (same(p.subtotal, subtotal) && same(p.vat_amount, vat) && same(p.total, total)) continue;
    changes += 1;
    console.log(`  ${p.proforma_number}: subtotal ${fmt(p.subtotal)} -> ${fmt(subtotal)}, VAT ${fmt(p.vat_amount)} -> ${fmt(vat)} (${vatPct}%), total ${fmt(p.total)} -> ${fmt(total)}`);
    if (APPLY) await p.update({ subtotal, vat_amount: vat, total });
  }
  if (!changes) console.log('  nothing to correct');
  return changes;
}

async function fixTaxInvoicePostings() {
  console.log('\n== Tax invoices (ledger posting vs invoice) ==');
  const invoices = await db.TaxInvoice.findAll({ order: [['id', 'ASC']] });
  let changes = 0;
  for (const inv of invoices) {
    const tenantId = inv.tenant_id;
    const want = { total: round2(inv.total), subtotal: round2(inv.subtotal), vat: round2(inv.vat_amount) };
    const net = await netPosting(tenantId, inv.id);
    const has = Object.keys(net).length > 0;
    if (!has) {
      console.log(`  ${inv.tax_invoice_number}: no ledger posting found - skipped (nothing to reverse)`);
      continue;
    }
    const got = {
      total: round2(net['1100']?.net || 0),
      subtotal: round2(-(net['4000']?.net || 0)),
      vat: round2(-(net['2100']?.net || 0)),
    };
    if (same(got.total, want.total) && same(got.subtotal, want.subtotal) && same(got.vat, want.vat)) continue;

    changes += 1;
    console.log(`  ${inv.tax_invoice_number}: posted AR ${fmt(got.total)} / revenue ${fmt(got.subtotal)} / VAT ${fmt(got.vat)}  ->  should be AR ${fmt(want.total)} / revenue ${fmt(want.subtotal)} / VAT ${fmt(want.vat)}`);
    if (!APPLY) continue;

    const arId = await jeService.getSystemAccountId(tenantId, '1100');
    const revId = await jeService.getSystemAccountId(tenantId, '4000');
    const vatId = await jeService.getSystemAccountId(tenantId, '2100');
    const date = String(inv.invoice_date).slice(0, 10);
    const t = await db.sequelize.transaction();
    try {
      // 1) reverse whatever is currently posted for this invoice (exact opposite of the net)
      const reverseLines = Object.values(net)
        .filter((r) => Math.abs(r.net) > 0.004)
        .map((r) => ({ accountId: r.accountId, debit: r.net < 0 ? -r.net : 0, credit: r.net > 0 ? r.net : 0, description: 'Reversal of incorrect posting' }));
      const reversalId = reverseLines.length >= 2
        ? await jeService.createJournalEntry(tenantId, 1, {
          entryDate: date,
          description: `Correction: reverse incorrect posting of ${inv.tax_invoice_number}`,
          sourceType: 'tax_invoice_correction',
          sourceId: inv.id,
          lines: reverseLines,
        }, t)
        : null;

      // 2) repost the correct amounts from the tax invoice
      const lines = [
        { accountId: arId, debit: want.total, credit: 0, description: `AR: ${inv.tax_invoice_number}` },
        { accountId: revId, debit: 0, credit: want.subtotal, description: `Revenue: ${inv.tax_invoice_number}` },
      ];
      if (want.vat > 0.005) lines.push({ accountId: vatId, debit: 0, credit: want.vat, description: `VAT: ${inv.tax_invoice_number}` });
      await jeService.createJournalEntry(tenantId, 1, {
        entryDate: date,
        description: `Correction: repost ${inv.tax_invoice_number} from tax invoice`,
        sourceType: 'tax_invoice_correction',
        sourceId: inv.id,
        lines,
      }, t);

      // flag the original entry as reversed (metadata only; its lines are untouched)
      if (reversalId) {
        await db.sequelize.query(
          `UPDATE journal_entries SET reversed_by_id = ? WHERE tenant_id = ? AND source_type = 'tax_invoice' AND source_id = ? AND reversed_by_id IS NULL`,
          { replacements: [reversalId, tenantId, inv.id], transaction: t }
        );
      }
      await t.commit();
      console.log(`    corrected ${inv.tax_invoice_number}`);
    } catch (e) {
      await t.rollback();
      console.log(`    FAILED ${inv.tax_invoice_number}: ${e.message}`);
    }
  }
  if (!changes) console.log('  nothing to correct');
  return changes;
}

(async () => {
  console.log(APPLY ? 'APPLY MODE (CONFIRM=YES)' : 'DRY RUN - no changes will be written (set CONFIRM=YES to apply)');
  try {
    // Proformas first so the report shows them; tax invoice postings are checked against the tax invoice itself.
    const a = await fixProformas();
    const b = await fixTaxInvoicePostings();
    console.log(`\n${APPLY ? 'Applied' : 'Would apply'}: ${a} proforma fix(es), ${b} ledger correction(s).`);
  } catch (e) {
    console.error('Failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
})();
