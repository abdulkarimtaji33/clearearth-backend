/**
 * Dev data clean-up after the UAT accounting audit. Ledger lines are never edited: wrong entries are
 * corrected by a reversal entry (with a reason) plus a new posting.
 *
 *   1. Expense journals posted to a GROUP account (never postable) or to the old 5000 default for a fuel
 *      expense -> reversed and reposted to 5410 Fuel; expenses.expense_account_id is kept in step.
 *   2. Stray manual "test" journal entries -> reversed; the junk "test" account is deactivated once empty.
 *   3. Duplicate company rows (same name ignoring case/spaces) -> merged into the oldest row: every
 *      reference is repointed, then the duplicates are soft-deleted.
 *
 * Dry run by default; apply with CONFIRM=YES. Idempotent.
 *
 *   node scripts/fix-dev-audit-data.js
 *   CONFIRM=YES node scripts/fix-dev-audit-data.js
 */
require('dotenv').config();
const db = require('../src/models');
const jeService = require('../src/services/journalEntry.service');

const APPLY = process.env.CONFIRM === 'YES';
const q = async (sql, replacements) => (await db.sequelize.query(sql, { replacements }))[0];

async function accountByCode(tenantId, code) {
  const rows = await q('SELECT id, code, name, is_group, is_active FROM chart_of_accounts WHERE tenant_id = ? AND code = ?', [tenantId, code]);
  return rows[0] || null;
}

async function entryLines(entryId) {
  return q('SELECT account_id, debit, credit, description FROM journal_entry_lines WHERE journal_entry_id = ? ORDER BY id', [entryId]);
}

/** Reverse a posted entry, then repost it with some accounts swapped. */
async function reverseAndRepost(entry, swapMap, reason) {
  const lines = await entryLines(entry.id);
  const newLines = lines.map((l) => ({
    accountId: swapMap[l.account_id] || l.account_id,
    debit: parseFloat(l.debit) || 0,
    credit: parseFloat(l.credit) || 0,
    description: l.description || undefined,
  }));
  if (!APPLY) return;
  await jeService.reverseJournalEntry(entry.tenant_id, entry.created_by || 1, entry.id, { reason, reversalDate: entry.entry_date });
  await jeService.createJournalEntry(entry.tenant_id, entry.created_by || 1, {
    entryDate: entry.entry_date,
    description: entry.description,
    sourceType: entry.source_type,
    sourceId: entry.source_id,
    lines: newLines,
  });
}

async function fixExpenseJournals() {
  console.log('\n== 1. Expense journals on group accounts / wrong default head');
  const entries = await q(
    `SELECT je.id, je.tenant_id, je.entry_number, je.entry_date, je.description, je.source_type, je.source_id, je.created_by
       FROM journal_entries je
      WHERE je.source_type = 'expense' AND je.status = 'posted' AND je.reversed_by_id IS NULL AND je.reverses_entry_id IS NULL
      ORDER BY je.id`
  );
  for (const je of entries) {
    const lines = await q(
      `SELECT l.account_id, l.debit, a.code, a.is_group FROM journal_entry_lines l JOIN chart_of_accounts a ON a.id = l.account_id WHERE l.journal_entry_id = ? AND l.debit > 0`,
      [je.id]
    );
    const expense = (await q('SELECT id, category, notes, expense_account_id FROM expenses WHERE id = ?', [je.source_id]))[0];
    const taskExp = je.description && /Work Order Expense/i.test(je.description);
    const text = `${expense?.category || ''} ${expense?.notes || ''} ${je.description || ''}`;
    for (const dl of lines) {
      const onGroup = dl.is_group === 1;
      const oldDefault = dl.code === '5000' && /fuel/i.test(text);
      if (!onGroup && !oldDefault) continue;
      const fuel = await accountByCode(je.tenant_id, '5410');
      if (!fuel) { console.log(`  ${je.entry_number}: no 5410 account for tenant ${je.tenant_id}, skipped`); continue; }
      console.log(`  ${je.entry_number} (${taskExp ? 'work order expense' : 'expense'} #${je.source_id}, ${expense ? expense.category : '?'}): Dr ${dl.code}${onGroup ? ' (group account)' : ' (old default)'} -> reverse and repost to 5410 Fuel`);
      await reverseAndRepost(je, { [dl.account_id]: fuel.id }, onGroup
        ? 'Posted to a group account, which cannot be posted to; reposted to 5410 Fuel'
        : 'Fuel expense posted to the old 5000 default; reposted to 5410 Fuel');
      if (APPLY && expense) await q('UPDATE expenses SET expense_account_id = ? WHERE id = ?', [fuel.id, expense.id]);
    }
  }
}

async function fixTestEntries() {
  console.log('\n== 2. Stray test manual journal entries and the junk "test" account');
  const accts = await q("SELECT id, tenant_id, code, name FROM chart_of_accounts WHERE code = 'test'");
  for (const a of accts) {
    const entries = await q(
      `SELECT DISTINCT je.id, je.tenant_id, je.entry_number, je.entry_date, je.description, je.created_by
         FROM journal_entries je JOIN journal_entry_lines l ON l.journal_entry_id = je.id
        WHERE l.account_id = ? AND je.status = 'posted' AND je.reversed_by_id IS NULL AND je.reverses_entry_id IS NULL`,
      [a.id]
    );
    for (const je of entries) {
      console.log(`  ${je.entry_number} ("${je.description}") posts to the junk account "${a.code}" -> reverse`);
      if (APPLY) await jeService.reverseJournalEntry(je.tenant_id, je.created_by || 1, je.id, { reason: 'Test entry posted to a placeholder account', reversalDate: je.entry_date });
    }
    console.log(`  account ${a.code} "${a.name}" (tenant ${a.tenant_id}) -> deactivate once its balance is zero`);
    if (APPLY) await q('UPDATE chart_of_accounts SET is_active = 0 WHERE id = ?', [a.id]);
  }
  if (!accts.length) console.log('  none');
}

const COMPANY_REF_TABLES = ['leads', 'company_contacts', 'contacts', 'purchase_orders', 'vendor_bills', 'deals'];

async function mergeDuplicateCompanies() {
  console.log('\n== 3. Duplicate customers / suppliers (same name)');
  const rows = await q('SELECT id, tenant_id, company_name FROM companies WHERE deleted_at IS NULL ORDER BY tenant_id, id');
  const groups = {};
  for (const r of rows) {
    const key = `${r.tenant_id}|${String(r.company_name || '').trim().replace(/\s+/g, ' ').toLowerCase()}`;
    (groups[key] = groups[key] || []).push(r);
  }
  let merged = 0;
  for (const list of Object.values(groups)) {
    if (list.length < 2) continue;
    const keep = list[0];
    const dups = list.slice(1);
    console.log(`  "${keep.company_name.trim()}": keep #${keep.id}, merge ${dups.map((d) => '#' + d.id).join(', ')}`);
    for (const d of dups) {
      for (const t of COMPANY_REF_TABLES) {
        const n = (await q(`SELECT COUNT(*) n FROM \`${t}\` WHERE company_id = ?`, [d.id]))[0].n;
        if (n) console.log(`    ${t}: ${n} row(s) #${d.id} -> #${keep.id}`);
        if (APPLY && n) await q(`UPDATE \`${t}\` SET company_id = ? WHERE company_id = ?`, [keep.id, d.id]);
      }
      if (APPLY) await q('UPDATE companies SET deleted_at = NOW() WHERE id = ?', [d.id]);
    }
    if (APPLY) await q('UPDATE companies SET company_name = ? WHERE id = ?', [keep.company_name.trim().replace(/\s+/g, ' '), keep.id]);
    merged += dups.length;
  }
  if (!merged) console.log('  none');
}

(async () => {
  console.log(APPLY ? 'APPLYING changes' : 'DRY RUN (set CONFIRM=YES to apply)');
  await fixExpenseJournals();
  await fixTestEntries();
  await mergeDuplicateCompanies();
  console.log('\nDone.');
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
