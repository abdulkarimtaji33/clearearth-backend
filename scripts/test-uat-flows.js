/**
 * Local end-to-end checks for the UAT accounting fixes (run against a LOCAL database only):
 *   node scripts/test-uat-flows.js
 * Creates its own rows and removes the fiscal year it adds; journal entries are append-only ledger
 * rows, so test entries stay behind in the local database.
 */
require('dotenv').config();
const db = require('../src/models');
const vb = require('../src/services/vendorBill.service');
const jeService = require('../src/services/journalEntry.service');
const expenseService = require('../src/services/expense.service');
const { resolveExpenseAccount } = require('../src/utils/paymentAccount');
const coaService = require('../src/services/chartOfAccounts.service');

let failed = 0;
const ok = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failed += 1; };
const rejects = async (fn, re, label) => {
  try { await fn(); ok(false, `${label} (expected rejection)`); } catch (e) { ok(re.test(e.message), `${label} -> "${e.message.slice(0, 80)}"`); }
};

(async () => {
  const q = async (s, r) => (await db.sequelize.query(s, { replacements: r }))[0];
  const tid = (await q('SELECT id FROM tenants ORDER BY id LIMIT 1'))[0].id;
  const acct = async (code) => (await q('SELECT id FROM chart_of_accounts WHERE tenant_id=? AND code=?', [tid, code]))[0];
  const today = new Date().toISOString().slice(0, 10);

  // Item 1: category default accounts
  const fuel = await resolveExpenseAccount(tid, { category: 'fuel' });
  ok(fuel.accountCode === '5410', `fuel category defaults to 5410 (got ${fuel.accountCode})`);
  const group = await acct('5400');
  await rejects(() => resolveExpenseAccount(tid, { expenseAccountId: group.id }), /Invalid expense account/, 'group account 5400 is rejected as an expense account');

  // Category -> account group: Fuel may use fuel-group accounts only; "Other" stays free
  const salaries = await acct('5700');
  const vehicle = await acct('5420');
  await rejects(() => resolveExpenseAccount(tid, { category: 'fuel', expenseAccountId: salaries.id, restrictToCategory: true }), /can only be posted to/, 'Fuel category cannot use Salaries & Wages');
  const fuelOk = await resolveExpenseAccount(tid, { category: 'fuel', expenseAccountId: vehicle.id, restrictToCategory: true });
  ok(fuelOk.accountCode === '5420', 'Fuel category may use another account in the Fuel & Transport group (5420)');
  const otherAny = await resolveExpenseAccount(tid, { category: 'other', expenseAccountId: salaries.id, restrictToCategory: true });
  ok(otherAny.accountCode === '5700', 'Other category can still use any expense account');

  // Chart of accounts: suggested code, duplicate code, system account guard, list extras
  const next = await coaService.suggestNextCode(tid, { parentId: group.id });
  ok(/^544\d$/.test(next.code) || /^54[5-9]\d$/.test(next.code), `next code under 5400 follows its siblings (got ${next.code})`);
  const topNext = await coaService.suggestNextCode(tid, { type: 'expense' });
  ok(/^5\d00$/.test(topNext.code) && parseInt(topNext.code, 10) > 5720, `next top-level expense code is a free hundred (got ${topNext.code})`);
  await rejects(() => coaService.createAccount(tid, 1, { code: '5410', name: 'Dup', type: 'expense', normalBalance: 'debit' }), /already exists/, 'duplicate account code is rejected');
  const cashAcct = await acct('1000');
  await rejects(() => coaService.updateAccount(tid, cashAcct.id, { isActive: false }), /System accounts cannot be disabled/, 'a system account cannot be disabled');
  await db.sequelize.query('UPDATE chart_of_accounts SET is_active = 1 WHERE id = ?', { replacements: [cashAcct.id] }); // never leave the local cash account disabled
  const listed = await coaService.listAccounts(tid, { withBalance: true });
  const g = listed.find((a) => a.code === '5400');
  ok(g && g.child_count >= 3 && typeof g.line_count === 'number', `chart list carries child_count (${g && g.child_count}) and line_count`);

  // Add Expense = paid-only: Dr expense sub-head (+ Dr 1200 VAT) / Cr bank, nothing through 2200
  const cashId = (await acct('1000')).id;
  const fuelAcct = await acct('5410');
  const base = { expenseDate: today, expenseAccountId: fuelAcct.id, paymentAccountId: cashId, netAmount: 100, vatRate: 5, receiptNo: 'R-1', supplierTrn: '100123456700003' };
  await rejects(() => expenseService.createManualExpense(tid, 1, { ...base, paymentAccountId: undefined }), /bank \/ cash account/, 'a paid expense needs the Paid from account');
  await rejects(() => expenseService.createManualExpense(tid, 1, { ...base, expenseAccountId: group.id }), /Invalid expense account/, 'a group account cannot be debited from Add Expense');
  await rejects(() => expenseService.createManualExpense(tid, 1, { ...base, receiptNo: '' }), /receipt \/ invoice number/, 'recoverable VAT needs the receipt number and TRN');
  const arAcct = await acct('1100');
  await rejects(() => expenseService.createManualExpense(tid, 1, { ...base, paymentAccountId: arAcct.id }), /Invalid payment account/, 'Paid from must be a cash or bank account');
  const exp = await expenseService.createManualExpense(tid, 1, base);
  const je = (await q("SELECT l.debit, l.credit, a.code FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='expense' AND e.source_id=? ORDER BY l.id", [exp.id]));
  const dr = (c) => je.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.debit), 0);
  const cr = (c) => je.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.credit), 0);
  ok(Math.abs(dr('5410') - 100) < 0.01 && Math.abs(dr('1200') - 5) < 0.01 && Math.abs(cr('1000') - 105) < 0.01, `paid expense posts Dr 5410 100 + Dr 1200 5 / Cr 1000 105 (got ${JSON.stringify(je)})`);
  ok(!je.some((x) => x.code === '2200'), 'a paid expense posts nothing through 2200 Accrued Expenses');
  ok(exp.payment_status === 'paid' && Math.abs(parseFloat(exp.amount) - 105) < 0.01, 'expense is saved as paid for the total incl. VAT');

  // Supplier bill without a PO (unpaid expense): Dr expense (+ Dr 1200) / Cr 2000, then paid from the bank
  const dSup = (await q('SELECT id FROM suppliers WHERE tenant_id=? LIMIT 1', [tid]))[0]
    || (await db.Supplier.create({ tenant_id: tid, company_name: 'UAT Test Supplier' }));
  const dBase = { supplierId: dSup.id, expenseAccountId: fuelAcct.id, netAmount: 200, vatRate: 5, supplierInvoiceNo: `DIRECT-${Date.now()}`, supplierTrn: '100123456700003', billDate: today };
  await rejects(() => vb.createDirectBill(tid, 1, { ...dBase, supplierId: undefined }), /Select the supplier/, 'a supplier bill needs the supplier');
  await rejects(() => vb.createDirectBill(tid, 1, { ...dBase, expenseAccountId: group.id }), /Invalid expense account/, 'a supplier bill cannot debit a group account');
  await rejects(() => vb.createDirectBill(tid, 1, { ...dBase, supplierTrn: '' }), /TRN/, 'recoverable VAT on a supplier bill needs the TRN');
  const dBill = await vb.createDirectBill(tid, 1, dBase);
  ok(dBill.purchase_order_id == null && Math.abs(parseFloat(dBill.total) - 210) < 0.01, 'supplier bill without a PO is created for the total incl. VAT');
  const dLines = await q("SELECT l.debit, l.credit, a.code FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='vendor_bill' AND e.source_id=? ORDER BY l.id", [dBill.id]);
  const dd = (c) => dLines.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.debit), 0);
  const dc = (c) => dLines.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.credit), 0);
  ok(Math.abs(dd('5410') - 200) < 0.01 && Math.abs(dd('1200') - 10) < 0.01 && Math.abs(dc('2000') - 210) < 0.01 && !dLines.some((x) => x.code === '2200'),
    `supplier bill posts Dr 5410 200 + Dr 1200 10 / Cr 2000 210, nothing through 2200 (got ${JSON.stringify(dLines)})`);
  await rejects(() => vb.createDirectBill(tid, 1, dBase), /already recorded/, 'the same supplier invoice cannot be recorded twice');
  const dPaid = await vb.payBills(tid, 1, { allocations: [{ billId: dBill.id, amount: 210 }], paymentAccountId: cashId, paymentDate: today });
  ok(dPaid.bills[0].status === 'paid', 'a supplier bill without a PO is paid from the bank (Dr 2000 / Cr cash)');

  // Item 2: work order expense needs an explicit head
  await rejects(() => expenseService.approveTaskExpense(tid, 1, 1, 1, { expenseDate: today }), /Select the expense account/, 'WO expense approval without an expense head is rejected');

  // Item 3: PO accrual with chosen head -> bill -> payment
  const sup = (await q('SELECT id FROM suppliers WHERE tenant_id=? LIMIT 1', [tid]))[0];
  const head = await acct('5410');
  const [poId] = await db.sequelize.query(
    "INSERT INTO purchase_orders (tenant_id, supplier_id, po_date, status, expense_account_id, created_at, updated_at) VALUES (?, ?, CURDATE(), 'approved', ?, NOW(), NOW())",
    { replacements: [tid, sup ? sup.id : null, head.id] }
  );
  const ps = (await q('SELECT id FROM products_services WHERE tenant_id=? LIMIT 1', [tid]))[0];
  await db.sequelize.query(
    'INSERT INTO purchase_order_items (purchase_order_id, product_service_id, quantity, price, total, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())',
    { replacements: [poId, ps ? ps.id : 1, '1', '1000', '1000'] }
  );
  await vb.postPoAccrual(tid, poId, 1000, today);
  const accrual = await q(
    `SELECT a.code, l.debit, l.credit FROM journal_entries je JOIN journal_entry_lines l ON l.journal_entry_id=je.id JOIN chart_of_accounts a ON a.id=l.account_id
     WHERE je.source_type='purchase_order_approved' AND je.source_id=? ORDER BY l.id`, [poId]);
  ok(accrual[0].code === '5410' && parseFloat(accrual[0].debit) === 1000 && accrual[1].code === '2200' && parseFloat(accrual[1].credit) === 1000,
    `PO approval posts Dr 5410 1000 / Cr 2200 (got ${accrual.map((r) => r.code).join('/')})`);

  const bill = await vb.createBill(tid, 1, { purchaseOrderId: poId, supplierInvoiceNo: `T-${Date.now()}`, billDate: today, subtotal: 800, vatAmount: 40 });
  ok(parseFloat(bill.total) === 840, 'vendor bill total = subtotal + VAT');
  await rejects(() => vb.createBill(tid, 1, { purchaseOrderId: poId, supplierInvoiceNo: 'OVER', billDate: today, subtotal: 500 }), /exceeds the unbilled accrual/, 'bill above the unbilled accrual is rejected');

  const ar = await acct('1100');
  await rejects(() => vb.payBills(tid, 1, { allocations: [{ billId: bill.id, amount: 840 }], paymentAccountId: ar.id }), /cash or bank/, 'paying a vendor bill from Accounts Receivable is rejected');
  await rejects(() => vb.payBills(tid, 1, { allocations: [{ billId: bill.id, amount: 840 }] }), /bank/, 'paying without choosing a bank account is rejected');
  const cash = await acct('1000');
  const paid = await vb.payBills(tid, 1, { allocations: [{ billId: bill.id, amount: 840 }], paymentAccountId: cash.id, paymentMethod: 'Bank transfer' });
  ok(paid.bills[0].status === 'paid', 'vendor bill is paid from a cash/bank account');

  // A7: period lock (restores state afterwards)
  const hadYear = (await q('SELECT COUNT(*) c FROM fiscal_years WHERE tenant_id=? AND deleted_at IS NULL', [tid]))[0].c > 0;
  const lockDate = '2025-03-15';
  if (!hadYear) {
    const fy = await require('../src/services/fiscalYear.service').createFiscalYear(tid, 1, { name: 'TEST FY 2025', startDate: '2025-01-01', endDate: '2025-12-31' });
    const periods = await q("SELECT id FROM accounting_periods WHERE tenant_id=? AND start_date<=? AND end_date>=?", [tid, lockDate, lockDate]);
    await db.sequelize.query("UPDATE accounting_periods SET status='closed' WHERE id=?", { replacements: [periods[0].id] });
    await rejects(() => jeService.assertPostingDateOpen(tid, lockDate), /closed/, 'posting into a closed period is rejected');
    await jeService.assertPostingDateOpen(tid, '2025-04-15');
    ok(true, 'posting into an open period is allowed');
    await db.sequelize.query('DELETE FROM accounting_periods WHERE fiscal_year_id=?', { replacements: [fy.id || fy.data?.id] });
    await db.sequelize.query('DELETE FROM fiscal_years WHERE id=?', { replacements: [fy.id || fy.data?.id] });
  } else {
    // Tenant already has fiscal years: temporarily close the period containing today, then restore it.
    const [period] = await q("SELECT id, status, start_date FROM accounting_periods WHERE tenant_id=? AND status='open' AND deleted_at IS NULL ORDER BY start_date DESC LIMIT 1", [tid]);
    if (period) {
      const day = String(period.start_date instanceof Date ? period.start_date.toISOString() : period.start_date).slice(0, 10);
      await db.sequelize.query("UPDATE accounting_periods SET status='closed' WHERE id=?", { replacements: [period.id] });
      try {
        await rejects(() => jeService.assertPostingDateOpen(tid, day), /closed/, 'posting into a closed period is rejected');
        await rejects(() => vb.createBill(tid, 1, { purchaseOrderId: poId, supplierInvoiceNo: `P-${Date.now()}`, billDate: day, subtotal: 100 }), /closed/, 'vendor bill dated in a closed period is rejected');
      } finally {
        await db.sequelize.query('UPDATE accounting_periods SET status=? WHERE id=?', { replacements: [period.status, period.id] });
      }
      await jeService.assertPostingDateOpen(tid, day);
      ok(true, 'posting is allowed again once the period is restored');
    } else {
      console.log('SKIP  period lock test (no open period found)');
    }
  }

  console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('ERROR', e); process.exit(1); });
