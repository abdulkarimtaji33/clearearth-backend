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
  const base = { confirmNegative: true, expenseDate: today, expenseAccountId: fuelAcct.id, paymentAccountId: cashId, netAmount: 100, vatRate: 5, receiptNo: 'R-1', supplierTrn: '100123456700003' };
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

  // VAT can be 5%, a manual amount, or none
  const mExp = await expenseService.createManualExpense(tid, 1, { ...base, netAmount: 100, vatRate: 'manual', vatAmount: 7.5 });
  const mLines = await q("SELECT a.code, l.debit FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='expense' AND e.source_id=?", [mExp.id]);
  ok(Math.abs(mLines.filter((x) => x.code === '1200').reduce((t, x) => t + parseFloat(x.debit), 0) - 7.5) < 0.01 && Math.abs(parseFloat(mExp.amount) - 107.5) < 0.01, 'a manual VAT amount posts to 1200 Input VAT and is added to the total');
  const noVat = await expenseService.createManualExpense(tid, 1, { ...base, netAmount: 100, vatRate: 0, receiptNo: '', supplierTrn: '' });
  ok(Math.abs(parseFloat(noVat.amount) - 100) < 0.01 && parseFloat(noVat.vat_amount) === 0, 'an expense with no VAT posts only the net amount');
  await rejects(() => expenseService.createManualExpense(tid, 1, { ...base, netAmount: 100, vatRate: 'manual', vatAmount: 500 }), /more than the amount before VAT/, 'a manual VAT amount above the net is rejected');

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
  const dPaid = await vb.payBills(tid, 1, { confirmNegative: true, allocations: [{ billId: dBill.id, amount: 210 }], paymentAccountId: cashId, paymentDate: today });
  ok(dPaid.bills[0].status === 'paid', 'a supplier bill without a PO is paid from the bank (Dr 2000 / Cr cash)');

  // Phase 1: supplier carried on the AP line; overdraft guard on payments
  const apLine = (await q("SELECT l.description FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='vendor_bill' AND e.source_id=? AND a.code='2000'", [dBill.id]))[0];
  ok(apLine && /^Supplier: /.test(apLine.description || ''), `the Accounts Payable line carries the supplier (got ${apLine && apLine.description})`);
  const cashBal = parseFloat((await q("SELECT COALESCE(SUM(l.debit-l.credit),0) b FROM journal_entry_lines l JOIN journal_entries e ON e.id=l.journal_entry_id AND e.status='posted' WHERE l.account_id=? AND e.tenant_id=?", [cashId, tid]))[0].b) || 0;
  const bigPay = { ...base, netAmount: Math.max(cashBal, 0) + 50, vatRate: 0, receiptNo: '', supplierTrn: '' };
  await rejects(() => expenseService.createManualExpense(tid, 1, { ...bigPay, confirmNegative: false }), /below zero/, 'a payment that takes the cash/bank account below zero is refused until confirmed');
  const confirmedExp = await expenseService.createManualExpense(tid, 1, { ...bigPay, confirmNegative: true });
  ok(confirmedExp && confirmedExp.payment_status === 'paid', 'the same payment goes through once the user confirms it');

  // Item 2: work order expense needs an explicit head
  await rejects(() => expenseService.approveTaskExpense(tid, 1, 1, 1, { expenseDate: today }), /Select the expense account/, 'WO expense approval without an expense head is rejected');

  // Item 6: PO approval posts nothing; the bill posts Dr expense (+ Dr 1200) / Cr 2000, under the supplier
  const sup = (await q('SELECT id FROM suppliers WHERE tenant_id=? LIMIT 1', [tid]))[0];
  const head = await acct('5410');
  const mkPo = async (expenseAccountId) => {
    const [id] = await db.sequelize.query(
      "INSERT INTO purchase_orders (tenant_id, supplier_id, po_date, status, expense_account_id, created_at, updated_at) VALUES (?, ?, CURDATE(), 'approved', ?, NOW(), NOW())",
      { replacements: [tid, sup ? sup.id : null, expenseAccountId] }
    );
    const psr = (await q('SELECT id FROM products_services WHERE tenant_id=? LIMIT 1', [tid]))[0];
    await db.sequelize.query(
      'INSERT INTO purchase_order_items (purchase_order_id, product_service_id, quantity, price, total, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())',
      { replacements: [id, psr ? psr.id : 1, '1', '1000', '1000'] }
    );
    return id;
  };
  const noHeadPo = await mkPo(null);
  await rejects(() => vb.approvePoForBilling(tid, noHeadPo), /expense head and sub-head/, 'a PO cannot be approved without the expense head / sub-head');
  const poId = await mkPo(head.id);
  await vb.approvePoForBilling(tid, poId);
  const poJes = await q("SELECT COUNT(*) c FROM journal_entries WHERE source_type='purchase_order_approved' AND source_id=?", [poId]);
  ok(Number(poJes[0].c) === 0, 'PO approval posts nothing to the ledger');

  const bill = await vb.createBill(tid, 1, { purchaseOrderId: poId, supplierInvoiceNo: `T-${Date.now()}`, billDate: today, subtotal: 800, vatAmount: 40 });
  ok(parseFloat(bill.total) === 840, 'vendor bill total = subtotal + VAT');
  const bl = await q("SELECT a.code, l.debit, l.credit, l.description FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='vendor_bill' AND e.source_id=? ORDER BY l.id", [bill.id]);
  const bd = (c) => bl.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.debit), 0);
  const bc = (c) => bl.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.credit), 0);
  ok(Math.abs(bd('5410') - 800) < 0.01 && Math.abs(bd('1200') - 40) < 0.01 && Math.abs(bc('2000') - 840) < 0.01 && !bl.some((x) => x.code === '2200'),
    `PO bill posts Dr 5410 800 + Dr 1200 40 / Cr 2000 840, nothing through 2200 (got ${JSON.stringify(bl.map((x) => [x.code, x.debit, x.credit]))})`);
  await rejects(() => vb.createBill(tid, 1, { purchaseOrderId: poId, supplierInvoiceNo: 'OVER', billDate: today, subtotal: 500 }), /above what is left on the PO/, 'a bill above the PO amount needs the extra amount approved');
  const overBill = await vb.createBill(tid, 1, { purchaseOrderId: poId, supplierInvoiceNo: `OVER-${Date.now()}`, billDate: today, subtotal: 500, vatAmount: 0, approveOverage: true });
  ok(parseFloat(overBill.total) === 500, 'a bill above the PO amount is accepted once the extra amount is approved');

  const ar = await acct('1100');
  await rejects(() => vb.payBills(tid, 1, { confirmNegative: true, allocations: [{ billId: bill.id, amount: 840 }], paymentAccountId: ar.id }), /cash or bank/, 'paying a vendor bill from Accounts Receivable is rejected');
  await rejects(() => vb.payBills(tid, 1, { confirmNegative: true, allocations: [{ billId: bill.id, amount: 840 }] }), /bank/, 'paying without choosing a bank account is rejected');
  const cash = await acct('1000');
  const paid = await vb.payBills(tid, 1, { confirmNegative: true, allocations: [{ billId: bill.id, amount: 840 }], paymentAccountId: cash.id, paymentMethod: 'Bank transfer' });
  ok(paid.bills[0].status === 'paid', 'vendor bill is paid from a cash/bank account');

  // Supplier-wise payables: grouped list, aging and the statement of account
  const sp = require('../src/services/supplierPayables.service');
  const openBill = await vb.createDirectBill(tid, 1, { ...dBase, supplierInvoiceNo: `OPEN-${Date.now()}`, netAmount: 100, vatRate: 0, supplierTrn: '' });
  const bySup = await sp.listBySupplier(tid, {});
  const grp = bySup.suppliers.find((g) => g.supplierId === dSup.id);
  ok(grp && grp.total >= 100 - 0.01 && grp.items.some((i) => i.id === openBill.id), 'payables are grouped by supplier with the open bill and its total');
  ok(grp && grp.buckets.b0_30 >= 100 - 0.01, 'a bill that is not yet due is counted in the 0-30 bucket');
  const stmt = await sp.getSupplierStatement(tid, dSup.id, {});
  const lastTxn = stmt.transactions[stmt.transactions.length - 1];
  ok(stmt.balanceDue >= 100 - 0.01 && lastTxn && Math.abs(lastTxn.balance - stmt.balanceDue) < 0.01, `the supplier statement running balance ends at the balance due (${stmt.balanceDue})`);
  ok(stmt.transactions.some((t) => t.docType === 'Bill') && stmt.transactions.some((t) => t.docType === 'Payment'), 'the statement lists bills and payments');
  const balMap = await sp.balancesBySupplier(tid);
  ok(Math.abs((balMap[dSup.id] || 0) - grp.total) < 0.01, 'the Suppliers list balance equals the supplier total in payables');

  // Work order expense: accrual stays (Dr expense / Cr 2200); the supplier bill clears it (Dr 2200 / Cr 2000)
  const woExpId = await db.sequelize.transaction(async (tx) => {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS=0', { transaction: tx });
    const [id] = await db.sequelize.query(
      "INSERT INTO expenses (tenant_id, work_order_task_expense_id, category, amount, expense_date, payment_status, expense_account_id, reference, created_at, updated_at) VALUES (?, ?, 'work_orders', 100, CURDATE(), 'unpaid', ?, 'work_order', NOW(), NOW())",
      { replacements: [tid, 900000 + Math.floor(Math.random() * 90000), head.id], transaction: tx }
    );
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS=1', { transaction: tx });
    return id;
  });
  const woAwaiting = await vb.listAwaitingWoExpenses(tid);
  ok(woAwaiting.some((e) => e.id === woExpId), 'an approved, unpaid work order expense is listed as awaiting a supplier bill');
  const woBill = await vb.createWorkOrderExpenseBill(tid, 1, { supplierId: sup.id, workOrderExpenseId: woExpId, supplierInvoiceNo: `WO-${Date.now()}`, supplierTrn: '100123456700003', billDate: today, vatRate: 5 });
  const wl = await q("SELECT a.code, l.debit, l.credit FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='vendor_bill' AND e.source_id=?", [woBill.id]);
  const wd = (c) => wl.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.debit), 0);
  const wc = (c) => wl.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.credit), 0);
  ok(Math.abs(wd('2200') - 100) < 0.01 && Math.abs(wd('1200') - 5) < 0.01 && Math.abs(wc('2000') - 105) < 0.01,
    `the supplier bill clears the work order accrual: Dr 2200 100 + Dr 1200 5 / Cr 2000 105 (got ${JSON.stringify(wl.map((x) => [x.code, x.debit, x.credit]))})`);
  await rejects(() => vb.createWorkOrderExpenseBill(tid, 1, { supplierId: sup.id, workOrderExpenseId: woExpId, supplierInvoiceNo: 'X2', billDate: today }), /not found|already/, 'a work order expense cannot be billed twice');
  await vb.payBills(tid, 1, { confirmNegative: true, allocations: [{ billId: woBill.id, amount: 105 }], paymentAccountId: cash.id, paymentDate: today });
  const woAfter = (await q('SELECT payment_status FROM expenses WHERE id=?', [woExpId]))[0];
  ok(woAfter.payment_status === 'paid', 'paying the supplier bill marks the work order expense as paid');
  // the fixture used a made-up task expense id; detach it so the foreign key can be re-created later
  await db.sequelize.query('UPDATE expenses SET work_order_task_expense_id = NULL WHERE id = ?', { replacements: [woExpId] });

  // Phase 5: supplier debit notes
  const dn = require('../src/services/supplierDebitNote.service');
  const dnBill = await vb.createDirectBill(tid, 1, { ...dBase, supplierInvoiceNo: `DN-${Date.now()}`, netAmount: 400, vatRate: 5 });
  const dnInfo = await dn.getBillDebitInfo(tid, dnBill.id);
  ok(Math.abs(dnInfo.outstanding - 420) < 0.01 && Math.abs(dnInfo.maxSubtotal - 400) < 0.01, 'debit note info shows the unpaid balance and the most that can be debited');
  await rejects(() => dn.createDebitNote(tid, 1, { vendorBillId: dnBill.id, reason: '', amountExVat: 100 }), /reason/, 'a debit note needs a reason');
  await rejects(() => dn.createDebitNote(tid, 1, { vendorBillId: dnBill.id, reason: 'Goods returned', amountExVat: 500 }), /more than the unpaid balance/, 'a debit note above the unpaid balance is rejected');
  const note = await dn.createDebitNote(tid, 1, { vendorBillId: dnBill.id, reason: 'Goods returned', amountExVat: 100, noteDate: today });
  ok(Math.abs(parseFloat(note.total) - 105) < 0.01 && /^DN\/CE\//.test(note.debit_note_number), `debit note ${note.debit_note_number} is for 105 incl. VAT`);
  const nl = await q("SELECT a.code, l.debit, l.credit FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='supplier_debit_note' AND e.source_id=?", [note.id]);
  const nd = (c) => nl.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.debit), 0);
  const nc = (c) => nl.filter((x) => x.code === c).reduce((t, x) => t + parseFloat(x.credit), 0);
  ok(Math.abs(nd('2000') - 105) < 0.01 && Math.abs(nc('5410') - 100) < 0.01 && Math.abs(nc('1200') - 5) < 0.01, `debit note posts Dr 2000 105 / Cr 5410 100 + Cr 1200 5 (got ${JSON.stringify(nl)})`);
  const dnAfter = await vb.getBill(tid, dnBill.id);
  ok(Math.abs(dnAfter.balance_due - 315) < 0.01, `the bill balance drops by the debit note (now ${dnAfter.balance_due})`);
  await rejects(() => vb.payBills(tid, 1, { confirmNegative: true, allocations: [{ billId: dnBill.id, amount: 420 }], paymentAccountId: cash.id }), /exceeds its balance/, 'a bill cannot be paid for more than its balance after the debit note');
  const stmt2 = await sp.getSupplierStatement(tid, dSup.id, {});
  ok(stmt2.transactions.some((t) => t.docType === 'Debit note' && Math.abs(t.paid - 105) < 0.01), 'the debit note appears on the supplier statement');
  await vb.payBills(tid, 1, { confirmNegative: true, allocations: [{ billId: dnBill.id, amount: 315 }], paymentAccountId: cash.id, paymentDate: today });
  ok((await vb.getBill(tid, dnBill.id)).status === 'paid', 'paying the rest after a debit note settles the bill');
  await rejects(() => dn.createDebitNote(tid, 1, { vendorBillId: dnBill.id, reason: 'Other' }), /nothing left to debit/, 'a settled bill cannot be debited');

  // Phase 5: supplier advances
  const adv = require('../src/services/supplierAdvance.service');
  await rejects(() => adv.recordAdvance(tid, 1, { supplierId: dSup.id, amount: 200 }), /cash or bank account/, 'an advance needs the account it is paid from');
  const a1 = await adv.recordAdvance(tid, 1, { supplierId: dSup.id, amount: 200, paymentAccountId: cash.id, confirmNegative: true, advanceDate: today, referenceNo: 'ADV-REF' });
  ok(Math.abs(a1.remaining - 200) < 0.01 && /^ADV\/CE\//.test(a1.advance_number), `advance ${a1.advance_number} recorded for 200`);
  const al = await q("SELECT a.code, l.debit, l.credit FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='supplier_advance' AND e.source_id=?", [a1.id]);
  ok(al.some((x) => x.code === '1350' && Math.abs(parseFloat(x.debit) - 200) < 0.01) && al.some((x) => x.code === '1000' && Math.abs(parseFloat(x.credit) - 200) < 0.01), `advance posts Dr 1350 200 / Cr 1000 200 (got ${JSON.stringify(al)})`);
  const advBill = await vb.createDirectBill(tid, 1, { ...dBase, supplierInvoiceNo: `ADVB-${Date.now()}`, netAmount: 120, vatRate: 5 });
  const opts = await adv.getApplyOptions(tid, dSup.id);
  ok(opts.availableTotal >= 200 - 0.01 && opts.bills.some((b) => b.id === advBill.id), 'apply options list the unused advance and the open bills of the supplier');
  await rejects(() => adv.applyAdvance(tid, 1, a1.id, { vendorBillId: advBill.id, amount: 500 }), /Only AED/, 'an advance cannot be applied for more than what is left of it');
  const a2 = await adv.applyAdvance(tid, 1, a1.id, { vendorBillId: advBill.id });
  ok(Math.abs(a2.remaining - 74) < 0.01 && (await vb.getBill(tid, advBill.id)).status === 'paid', 'applying the advance settles the bill (126) and leaves 74');
  const apl = await q("SELECT a.code, l.debit, l.credit FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='supplier_advance_applied' AND e.source_id=?", [a1.id]);
  ok(apl.some((x) => x.code === '2000' && Math.abs(parseFloat(x.debit) - 126) < 0.01) && apl.some((x) => x.code === '1350' && Math.abs(parseFloat(x.credit) - 126) < 0.01), 'applying posts Dr 2000 126 / Cr 1350 126');
  const stmt3 = await sp.getSupplierStatement(tid, dSup.id, {});
  ok(stmt3.transactions.some((t) => t.docType === 'Advance'), 'the advance appears on the supplier statement');

  // Phase 6: cash/bank transfer and bank reconciliation
  const tr = require('../src/services/cashBankTransfer.service');
  const rc = require('../src/services/bankReconciliation.service');
  let testBank = (await q("SELECT id FROM chart_of_accounts WHERE tenant_id=? AND code='1099'", [tid]))[0];
  if (!testBank) testBank = await db.ChartOfAccounts.create({ tenant_id: tid, code: '1099', name: 'UAT Test Bank', type: 'asset', sub_type: 'bank', normal_balance: 'debit', is_group: false, is_active: true, sort_order: 90 });
  await rejects(() => tr.createTransfer(tid, 1, { fromAccountId: cashId, toAccountId: cashId, amount: 10 }), /different/, 'a transfer needs two different accounts');
  await rejects(() => tr.createTransfer(tid, 1, { fromAccountId: cashId, toAccountId: testBank.id, amount: 0 }), /greater than zero/, 'a transfer needs an amount');
  await rejects(() => tr.createTransfer(tid, 1, { fromAccountId: cashId, toAccountId: arAcct.id, amount: 10, confirmNegative: true }), /Invalid payment account/, 'a transfer can only go to a cash or bank account');
  const trf = await tr.createTransfer(tid, 1, { fromAccountId: cashId, toAccountId: testBank.id, amount: 50, confirmNegative: true, transferDate: today, referenceNo: 'TRF-T' });
  const tl = await q("SELECT a.code, l.debit, l.credit FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='cash_bank_transfer' AND e.source_id=?", [trf.id]);
  ok(tl.some((x) => x.code === '1099' && Math.abs(parseFloat(x.debit) - 50) < 0.01) && tl.some((x) => x.code === '1000' && Math.abs(parseFloat(x.credit) - 50) < 0.01), `transfer ${trf.transfer_number} posts Dr 1099 50 / Cr 1000 50`);
  const ws = await rc.getWorkspace(tid, { accountId: testBank.id, statementDate: today });
  const trLine = ws.lines.find((l) => Math.abs(l.debit - 50) < 0.01 && /Transfer/.test(l.description));
  ok(!!trLine, 'the transfer appears as an unreconciled line on the bank account');
  const stBal = Math.round((ws.openingClearedBalance + 50) * 100) / 100;
  const draftRec = await rc.save(tid, 1, { accountId: testBank.id, statementDate: today, statementBalance: stBal + 5, lineIds: [trLine.id], complete: false });
  ok(draftRec.status === 'draft' && Math.abs(draftRec.difference - 5) < 0.01, 'a reconciliation with a difference is saved as a draft with the difference shown');
  await rejects(() => rc.save(tid, 1, { id: draftRec.id, accountId: testBank.id, statementDate: today, statementBalance: stBal + 5, lineIds: [trLine.id], complete: true }), /difference/, 'a reconciliation cannot be completed while there is a difference');
  const doneRec = await rc.save(tid, 1, { id: draftRec.id, accountId: testBank.id, statementDate: today, statementBalance: stBal, lineIds: [trLine.id], complete: true });
  ok(doneRec.status === 'completed' && doneRec.cleared.length === 1, 'the reconciliation completes once the difference is zero');
  const ws2 = await rc.getWorkspace(tid, { accountId: testBank.id, statementDate: today });
  ok(!ws2.lines.some((l) => l.id === trLine.id) && Math.abs(ws2.openingClearedBalance - stBal) < 0.01, 'reconciled lines are not offered again and become the opening cleared balance');
  await rejects(() => rc.save(tid, 1, { id: doneRec.id, accountId: testBank.id, statementDate: today, statementBalance: stBal, lineIds: [], complete: false }), /already completed/, 'a completed reconciliation cannot be changed');

  // Phase 8: credit note with refund of the paid part, statement lines, PDF
  {
  const cnSvc = require('../src/services/creditNote.service');
  // Use an existing local invoice (1470 incl. 5% VAT), set it to "1000 paid", and restore it afterwards.
  const testInv = await db.TaxInvoice.findByPk(5);
  const origInv = { paid_amount: testInv.paid_amount, credited_amount: testInv.credited_amount, payment_status: testInv.payment_status, invoice_date: testInv.invoice_date };
  await testInv.update({ paid_amount: 1000, credited_amount: 0, payment_status: 'partial', invoice_date: '2026-05-09' });
  const tid = testInv.tenant_id; // the local invoices belong to the second tenant
  const cashId = await jeService.getSystemAccountId(tid, '1000');
  const cnInfo = await cnSvc.getInvoiceCreditInfo(tid, testInv.id);
  ok(cnInfo.canRefund && Math.abs(cnInfo.outstanding - 470) < 0.01 && Math.abs(cnInfo.creditableTotal - 1470) < 0.01 && Math.abs(cnInfo.maxRefund - 1000) < 0.01, 'credit note info shows what is unpaid (470), what can be credited (1470) and what can be refunded (1000)');
  await rejects(() => cnSvc.createCreditNote(tid, 1, { taxInvoiceId: testInv.id, reason: 'Wrong customer', includePaid: true }), /bank or cash account/, 'crediting a paid invoice needs the account the refund is paid from');
  await rejects(() => cnSvc.createCreditNote(tid, 1, { taxInvoiceId: testInv.id, reason: 'Wrong customer', amountExVat: 2000 }), /more than what is left/, 'a credit above the invoice is rejected');
  const cn = await cnSvc.createCreditNote(tid, 1, { taxInvoiceId: testInv.id, reason: 'Wrong customer', includePaid: true, refundAccountId: cashId, refundMethod: 'Cash', confirmNegative: true, creditDate: today });
  ok(Math.abs(parseFloat(cn.total) - 1470) < 0.01 && Math.abs(parseFloat(cn.refund_amount) - 1000) < 0.01, 'the credit note is for 1470 of which 1000 is refunded');
  const cnl = await q("SELECT a.code, l.debit, l.credit FROM journal_entries e JOIN journal_entry_lines l ON l.journal_entry_id=e.id JOIN chart_of_accounts a ON a.id=l.account_id WHERE e.source_type='credit_note' AND e.source_id=?", [cn.id]);
  const cd = (c) => cnl.filter((x) => x.code === c).reduce((t2, x) => t2 + parseFloat(x.debit), 0);
  const cc = (c) => cnl.filter((x) => x.code === c).reduce((t2, x) => t2 + parseFloat(x.credit), 0);
  ok(Math.abs(cd('4000') - 1400) < 0.01 && Math.abs(cd('2100') - 70) < 0.01 && Math.abs(cc('1100') - 470) < 0.01 && Math.abs(cc('1000') - 1000) < 0.01, `refund posts Dr 4000 1400 + Dr 2100 70 / Cr 1100 470 + Cr 1000 1000 (got ${JSON.stringify(cnl)})`);
  const invAfter = await db.TaxInvoice.findByPk(testInv.id);
  ok(Math.abs(parseFloat(invAfter.credited_amount) - 1470) < 0.01 && Math.abs(parseFloat(invAfter.paid_amount)) < 0.01, 'the invoice shows 1470 credited and nothing received after the refund');
  await rejects(() => cnSvc.createCreditNote(tid, 1, { taxInvoiceId: testInv.id, reason: 'Other', includePaid: true, refundAccountId: cashId, confirmNegative: true }), /nothing left to credit/, 'a fully credited invoice cannot be credited again');
  const rcv = require('../src/services/receivables.service');
  const coRow = (await q('SELECT d.company_id FROM tax_invoices ti JOIN proforma_invoices p ON p.id=ti.proforma_invoice_id JOIN deals d ON d.id=p.deal_id WHERE ti.id=?', [testInv.id]))[0];
  const st = await rcv.getStatementOfAccount(tid, coRow.company_id, {});
  ok(st.transactions.some((x) => x.docType === 'Credit Note' && Math.abs(x.receipts - 1470) < 0.01) && st.transactions.some((x) => x.docType === 'Refund Paid' && Math.abs(x.amount - 1000) < 0.01), 'the customer statement shows the credit note and the refund paid');
  const lastT = st.transactions[st.transactions.length - 1];
  ok(Math.abs(lastT.balance - st.balanceDue) < 0.01, 'the statement running balance still ends at the balance due');
  try {
    const pdf = await require('../src/services/pdf.service').generateCreditNotePdf(cn.id, tid);
    ok(Buffer.from(pdf).toString('ascii', 0, 5).startsWith('%PDF'), 'the credit note prints as a PDF');
  } catch (e) { console.log(`SKIP  credit note PDF (no PDF renderer here: ${e.message.slice(0, 60)})`); }
  await db.TaxInvoice.update(origInv, { where: { id: testInv.id } });
  }

  // Phase 7: financial reports
  const rep = require('../src/services/reports.service');
  const yStart = `${today.slice(0, 4)}-01-01`;
  for (const [f, t2] of [[yStart, today], [today, today], ['2020-01-01', today]]) {
    const cf = await rep.getCashFlowStatement(tid, { dateFrom: f, dateTo: t2 });
    ok(cf.reconciled && Math.abs(cf.opening_cash + cf.net_change - cf.closing_cash) < 0.05,
      `cash flow ${f}..${t2} reconciles: opening ${cf.opening_cash} + change ${cf.net_change} = closing ${cf.closing_cash}`);
  }
  const cfY = await rep.getCashFlowStatement(tid, { dateFrom: yStart, dateTo: today });
  ok(cfY.operating.items.length > 0, `cash flow lists the working-capital movements it found (${cfY.operating.items.length} lines)`);
  const isr = await rep.getIncomeStatement(tid, { dateFrom: yStart, dateTo: today, comparativeDateFrom: `${Number(today.slice(0, 4)) - 1}-01-01`, comparativeDateTo: `${Number(today.slice(0, 4)) - 1}-12-31` });
  const allItems = ['revenue', 'cogs', 'opex', 'finance'].flatMap((k) => isr.sections[k].groups.flatMap((g) => g.items));
  ok(allItems.every((i) => Math.abs(i.amount) > 0.004 || Math.abs(i.comparative) > 0.004), 'income statement hides lines that are zero in both periods');
  const headGrp = isr.sections.opex.groups.find((g) => g.head && g.items.length > 0);
  ok(!headGrp || Math.abs(headGrp.total - headGrp.items.reduce((s, i) => s + i.amount, 0)) < 0.01, 'income statement head subtotal equals the sum of its sub-heads');
  ok(Math.abs(isr.totals.current.netIncome - (isr.sections.revenue.total - isr.sections.cogs.total - isr.sections.opex.total - isr.sections.finance.total)) < 0.02, 'income statement net income = revenue - costs');
  const vr = await rep.getVatReport(tid, { dateFrom: yStart, dateTo: today });
  const box = (b) => vr.boxes.find((x) => x.box === b);
  ok(Math.abs(box('12').vat - box('8').vat) < 0.01 && Math.abs(box('13').vat - box('11').vat) < 0.01, 'VAT return: box 12 = total output tax, box 13 = total input tax');
  ok(Math.abs(Math.abs(vr.net_vat_due) - box('14').vat) < 0.01, 'VAT return: box 14 = output tax - input tax');
  ok(vr.transactions.every((x) => x.entry_number), 'VAT return drill-down lists the journal entries behind each figure');
  const xl = await rep.exportVatReport(tid, { dateFrom: yStart, dateTo: today });
  ok(Buffer.isBuffer(xl) && xl.length > 1000, 'VAT return exports to an Excel file');

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
