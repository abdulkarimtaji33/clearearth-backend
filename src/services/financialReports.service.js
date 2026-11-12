/**
 * Financial reports rebuilt in Phase 7:
 *   - Cash flow statement that always reconciles (all cash + bank accounts, every balance sheet movement)
 *   - VAT report in the FTA VAT 201 layout with credit/debit note adjustments and drill-down
 *   - Income statement grouped by expense/revenue head, with zero lines hidden and an optional comparison period
 */
const XLSX = require('xlsx');
const db = require('../models');
const { isCashOrBank } = require('../utils/paymentAccount');

const n = (v) => parseFloat(v) || 0;
const r2 = (v) => Math.round((parseFloat(v) || 0) * 100) / 100;
const q = async (sql, replacements) => (await db.sequelize.query(sql, { replacements }))[0];

const dayBefore = (d) => {
  const dt = new Date(`${d}T12:00:00`);
  dt.setDate(dt.getDate() - 1);
  const p = (x) => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
};

// ─── Income statement ─────────────────────────────────────────────────────────

async function accountPeriodTotals(tenantId, dateFrom, dateTo) {
  return q(`
    SELECT a.id, a.code, a.name, a.type, a.sub_type, a.sort_order, a.parent_id,
           COALESCE(SUM(l.debit), 0) AS total_debit, COALESCE(SUM(l.credit), 0) AS total_credit
      FROM chart_of_accounts a
      JOIN journal_entry_lines l ON l.account_id = a.id
      JOIN journal_entries e ON e.id = l.journal_entry_id AND e.tenant_id = ? AND e.status = 'posted'
       AND e.entry_date >= ? AND e.entry_date <= ?
     WHERE a.tenant_id = ? AND a.type IN ('revenue', 'expense') AND a.is_group = 0
     GROUP BY a.id
     ORDER BY a.sort_order, a.code`, [tenantId, dateFrom, dateTo, tenantId]);
}

async function accountTree(tenantId) {
  const rows = await q('SELECT id, code, name, parent_id, sort_order FROM chart_of_accounts WHERE tenant_id = ?', [tenantId]);
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

const SECTIONS = [
  { key: 'revenue', title: 'Revenue' },
  { key: 'cogs', title: 'Cost of revenue' },
  { key: 'opex', title: 'Operating expenses' },
  { key: 'finance', title: 'Finance costs' },
];

function sectionOf(r) {
  if (r.type === 'revenue') return 'revenue';
  if (r.sub_type === 'cost_of_revenue') return 'cogs';
  if (r.sub_type === 'finance_cost') return 'finance';
  return 'opex';
}

const amountOf = (r) => (r.type === 'revenue' ? n(r.total_credit) - n(r.total_debit) : n(r.total_debit) - n(r.total_credit));

const getIncomeStatement = async (tenantId, { dateFrom, dateTo, comparativeDateFrom, comparativeDateTo }) => {
  const tree = await accountTree(tenantId);
  const cur = await accountPeriodTotals(tenantId, dateFrom, dateTo);
  const cmp = comparativeDateFrom && comparativeDateTo ? await accountPeriodTotals(tenantId, comparativeDateFrom, comparativeDateTo) : null;

  const accounts = new Map(); // id -> { meta, current, comparative }
  cur.forEach((r) => accounts.set(r.id, { r, current: amountOf(r), comparative: 0 }));
  if (cmp) {
    cmp.forEach((r) => {
      const e = accounts.get(r.id);
      if (e) e.comparative = amountOf(r); else accounts.set(r.id, { r, current: 0, comparative: amountOf(r) });
    });
  }

  const sections = {};
  SECTIONS.forEach((s) => { sections[s.key] = { key: s.key, title: s.title, groups: new Map(), total: 0, comparativeTotal: 0 }; });

  [...accounts.values()]
    .filter((a) => Math.abs(a.current) > 0.004 || Math.abs(a.comparative) > 0.004) // hide zero lines
    .sort((a, b) => (a.r.sort_order - b.r.sort_order) || String(a.r.code).localeCompare(String(b.r.code)))
    .forEach((a) => {
      const sec = sections[sectionOf(a.r)];
      const parent = a.r.parent_id ? tree[a.r.parent_id] : null;
      const gKey = parent ? `g${parent.id}` : `a${a.r.id}`;
      if (!sec.groups.has(gKey)) {
        sec.groups.set(gKey, { key: gKey, head: parent ? { id: parent.id, code: parent.code, name: parent.name } : null, items: [], total: 0, comparativeTotal: 0 });
      }
      const g = sec.groups.get(gKey);
      g.items.push({ id: a.r.id, code: a.r.code, name: a.r.name, amount: r2(a.current), comparative: r2(a.comparative) });
      g.total = r2(g.total + a.current);
      g.comparativeTotal = r2(g.comparativeTotal + a.comparative);
      sec.total = r2(sec.total + a.current);
      sec.comparativeTotal = r2(sec.comparativeTotal + a.comparative);
    });

  const out = {};
  SECTIONS.forEach((s) => { out[s.key] = { ...sections[s.key], groups: [...sections[s.key].groups.values()] }; });
  const t = (k, c) => (c ? out[k].comparativeTotal : out[k].total);
  const totals = (c) => {
    const gross = r2(t('revenue', c) - t('cogs', c));
    const op = r2(gross - t('opex', c));
    return { grossProfit: gross, operatingIncome: op, netIncome: r2(op - t('finance', c)) };
  };

  const current = totals(false);
  const comparative = cmp ? totals(true) : null;
  return {
    date_from: dateFrom,
    date_to: dateTo,
    comparative_from: cmp ? comparativeDateFrom : null,
    comparative_to: cmp ? comparativeDateTo : null,
    sections: out,
    totals: { current, comparative },
    // legacy shape kept for older callers
    current: { ...current, revenue: { items: [], total: out.revenue.total }, cogs: { items: [], total: out.cogs.total }, opex: { items: [], total: out.opex.total }, finance: { items: [], total: out.finance.total } },
  };
};

// ─── Cash flow ────────────────────────────────────────────────────────────────

async function cashAccountIds(tenantId) {
  const assets = await db.ChartOfAccounts.findAll({ where: { tenant_id: tenantId, type: 'asset', is_group: false }, attributes: ['id', 'code', 'name', 'sub_type', 'parent_id', 'type', 'is_group', 'tenant_id'] });
  const ids = [];
  for (const a of assets) {
    // eslint-disable-next-line no-await-in-loop
    if (await isCashOrBank(tenantId, a)) ids.push(a.id);
  }
  // A parent such as "Bank Accounts" that holds bank accounts is bank money too.
  const parentIds = new Set(assets.filter((a) => ids.includes(a.id) && a.parent_id).map((a) => a.parent_id));
  const parents = await db.ChartOfAccounts.findAll({ where: { tenant_id: tenantId, id: [...parentIds], type: 'asset' }, attributes: ['id'] });
  parents.forEach((p) => { if (!ids.includes(p.id)) ids.push(p.id); });
  return ids;
}

async function cashBalanceAt(tenantId, ids, date, inclusive) {
  if (!ids.length) return 0;
  const rows = await q(
    `SELECT COALESCE(SUM(l.debit - l.credit), 0) AS bal FROM journal_entry_lines l
       JOIN journal_entries e ON e.id = l.journal_entry_id AND e.tenant_id = ? AND e.status = 'posted' AND e.entry_date ${inclusive ? '<=' : '<'} ?
      WHERE l.account_id IN (?)`, [tenantId, date, ids]);
  return r2(rows[0].bal);
}

const getCashFlowStatement = async (tenantId, { dateFrom, dateTo }) => {
  const ids = await cashAccountIds(tenantId);
  const opening = await cashBalanceAt(tenantId, ids, dateFrom, false); // balance at the start of the first day
  const closing = await cashBalanceAt(tenantId, ids, dateTo, true);

  const netIncomeRows = await q(`
    SELECT COALESCE(SUM(CASE WHEN a.type = 'revenue' THEN l.credit - l.debit ELSE 0 END), 0)
         - COALESCE(SUM(CASE WHEN a.type = 'expense' THEN l.debit - l.credit ELSE 0 END), 0) AS ni
      FROM journal_entry_lines l
      JOIN journal_entries e ON e.id = l.journal_entry_id AND e.tenant_id = ? AND e.status = 'posted' AND e.entry_date >= ? AND e.entry_date <= ?
      JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = ?`, [tenantId, dateFrom, dateTo, tenantId]);
  const netIncome = r2(netIncomeRows[0].ni);

  // Every non-cash balance sheet movement in the period: net debit = debit - credit
  const moves = await q(`
    SELECT a.id, a.code, a.name, a.type, a.sub_type, COALESCE(SUM(l.debit - l.credit), 0) AS net
      FROM journal_entry_lines l
      JOIN journal_entries e ON e.id = l.journal_entry_id AND e.tenant_id = ? AND e.status = 'posted' AND e.entry_date >= ? AND e.entry_date <= ?
      JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = ? AND a.type IN ('asset', 'liability', 'equity')
     GROUP BY a.id ORDER BY a.code`, [tenantId, dateFrom, dateTo, tenantId]);

  const cashSet = new Set(ids);
  const operatingItems = []; const investingItems = []; const financingItems = [];
  moves.filter((m) => !cashSet.has(m.id) && Math.abs(n(m.net)) > 0.004).forEach((m) => {
    const effect = r2(-n(m.net)); // an asset going up uses cash; a liability or equity going up brings cash in
    const item = { id: m.id, code: m.code, name: m.name, amount: effect };
    if (m.type === 'asset' && m.sub_type === 'fixed_asset') investingItems.push(item);
    else if (m.type === 'equity' || (m.type === 'liability' && m.sub_type === 'long_term_liability')) financingItems.push(item);
    else operatingItems.push(item);
  });

  const sum = (xs) => r2(xs.reduce((s, x) => s + x.amount, 0));
  const byCode = (c) => sum(operatingItems.filter((x) => x.code === c));
  const wcTotal = sum(operatingItems);
  const operatingNet = r2(netIncome + wcTotal);
  const investingNet = sum(investingItems);
  const financingNet = sum(financingItems);
  const netChange = r2(operatingNet + investingNet + financingNet);

  const legacy = { '1100': 'change_in_ar', '2000': 'change_in_ap', '2200': 'change_in_accrued', '2100': 'change_in_vat' };
  const wc = { change_in_ar: 0, change_in_ap: 0, change_in_accrued: 0, change_in_vat: 0 };
  Object.entries(legacy).forEach(([code, key]) => { wc[key] = byCode(code); });

  return {
    date_from: dateFrom,
    date_to: dateTo,
    operating: { net_income: netIncome, working_capital_changes: wc, items: operatingItems, net: operatingNet },
    investing: { fixed_asset_purchases: investingNet, items: investingItems, net: investingNet },
    financing: { items: financingItems, net: financingNet, capital_contributions: 0, drawings: 0, loan_net: 0 },
    opening_cash: opening,
    net_change: netChange,
    closing_cash: closing,
    cash_account_count: ids.length,
    reconciled: Math.abs(closing - (opening + netChange)) < 0.05,
    difference: r2(closing - (opening + netChange)),
  };
};

// ─── VAT report (FTA VAT 201 layout) ──────────────────────────────────────────

async function vatEntries(tenantId, dateFrom, dateTo) {
  return q(`
    SELECT e.id, e.entry_number, DATE_FORMAT(e.entry_date, '%Y-%m-%d') AS entry_date, e.source_type, e.description, e.paid_to, e.received_from,
           COALESCE(SUM(l.debit), 0) AS td, COALESCE(SUM(l.credit), 0) AS tc,
           COALESCE(SUM(CASE WHEN a.code = '2100' THEN l.debit ELSE 0 END), 0) AS out_d,
           COALESCE(SUM(CASE WHEN a.code = '2100' THEN l.credit ELSE 0 END), 0) AS out_c,
           COALESCE(SUM(CASE WHEN a.code = '1200' THEN l.debit ELSE 0 END), 0) AS in_d,
           COALESCE(SUM(CASE WHEN a.code = '1200' THEN l.credit ELSE 0 END), 0) AS in_c
      FROM journal_entries e
      JOIN journal_entry_lines l ON l.journal_entry_id = e.id
      JOIN chart_of_accounts a ON a.id = l.account_id
     WHERE e.tenant_id = ? AND e.status = 'posted' AND e.entry_date >= ? AND e.entry_date <= ?
     GROUP BY e.id
    HAVING out_d + out_c + in_d + in_c > 0
     ORDER BY e.entry_date, e.id`, [tenantId, dateFrom, dateTo]);
}

const getVatReport = async (tenantId, { dateFrom, dateTo }) => {
  const rows = await vatEntries(tenantId, dateFrom, dateTo);
  const tx = [];
  rows.forEach((e) => {
    const party = e.paid_to || e.received_from || '';
    const base = { entry_id: e.id, entry_number: e.entry_number, date: e.entry_date, source_type: e.source_type, description: e.description, party };
    const outVat = r2(n(e.out_c) - n(e.out_d));
    if (Math.abs(n(e.out_c) - n(e.out_d)) > 0.004 || n(e.out_c) + n(e.out_d) > 0) {
      const net = outVat >= 0 ? r2(n(e.tc) - n(e.out_c)) : -r2(n(e.td) - n(e.out_d));
      if (Math.abs(net) > 0.004) tx.push({ ...base, side: 'sales', adjustment: outVat < 0, net, vat: outVat });
    }
    const inVat = r2(n(e.in_d) - n(e.in_c));
    if (n(e.in_d) + n(e.in_c) > 0) {
      const net = inVat >= 0 ? r2(n(e.td) - n(e.in_d)) : -r2(n(e.tc) - n(e.in_c));
      if (Math.abs(net) > 0.004) tx.push({ ...base, side: 'purchases', adjustment: inVat < 0, net, vat: inVat });
    }
  });

  const total = (side, adj, f) => r2(tx.filter((x) => x.side === side && x.adjustment === adj).reduce((s, x) => s + x[f], 0));
  const salesNet = total('sales', false, 'net'); const salesVat = total('sales', false, 'vat');
  const salesAdjNet = total('sales', true, 'net'); const salesAdjVat = total('sales', true, 'vat');
  const purNet = total('purchases', false, 'net'); const purVat = total('purchases', false, 'vat');
  const purAdjNet = total('purchases', true, 'net'); const purAdjVat = total('purchases', true, 'vat');

  const outputTax = r2(salesVat + salesAdjVat); // credit notes already negative
  const inputTax = r2(purVat + purAdjVat); // debit notes already negative
  const net = r2(outputTax - inputTax);

  const boxes = [
    { box: '1', label: 'Standard rated supplies in the UAE', amount: salesNet, vat: salesVat, adjustment: 0, side: 'sales', drill: 'sales' },
    { box: '1a', label: 'Credit notes issued (adjustments to supplies)', amount: salesAdjNet, vat: salesAdjVat, adjustment: salesAdjVat, side: 'sales', drill: 'sales_adj' },
    { box: '3', label: 'Zero rated supplies', amount: 0, vat: 0, adjustment: 0, side: 'sales', note: 'Not tracked separately' },
    { box: '4', label: 'Exempt supplies', amount: 0, vat: 0, adjustment: 0, side: 'sales', note: 'Not tracked separately' },
    { box: '8', label: 'Total output tax', amount: r2(salesNet + salesAdjNet), vat: outputTax, adjustment: salesAdjVat, side: 'sales', total: true },
    { box: '9', label: 'Standard rated expenses', amount: purNet, vat: purVat, adjustment: 0, side: 'purchases', drill: 'purchases' },
    { box: '9a', label: 'Debit notes received (adjustments to expenses)', amount: purAdjNet, vat: purAdjVat, adjustment: purAdjVat, side: 'purchases', drill: 'purchases_adj' },
    { box: '11', label: 'Total input tax', amount: r2(purNet + purAdjNet), vat: inputTax, adjustment: purAdjVat, side: 'purchases', total: true },
    { box: '12', label: 'Total due tax', vat: outputTax, side: 'summary' },
    { box: '13', label: 'Recoverable tax', vat: inputTax, side: 'summary' },
    { box: '14', label: net >= 0 ? 'Payable tax' : 'Refundable tax', vat: Math.abs(net), side: 'summary', total: true },
  ];

  return {
    date_from: dateFrom,
    date_to: dateTo,
    boxes,
    transactions: tx,
    output_vat: { standard_rated_sales: salesNet, vat_collected: salesVat, credit_notes_vat: salesAdjVat, net: outputTax },
    input_vat: { standard_rated_purchases: purNet, vat_reclaimable: purVat, debit_notes_vat: purAdjVat, net: inputTax },
    net_vat_due: net,
    is_refundable: net < 0,
  };
};

/** The VAT report as an Excel workbook (summary sheet + one sheet of the transactions behind it). */
const exportVatReport = async (tenantId, { dateFrom, dateTo }) => {
  const rep = await getVatReport(tenantId, { dateFrom, dateTo });
  const wb = XLSX.utils.book_new();
  const summary = [
    ['VAT return (FTA VAT 201 layout)'],
    [`Period: ${dateFrom} to ${dateTo}`],
    [],
    ['Box', 'Description', 'Amount (AED)', 'VAT (AED)', 'Adjustment (AED)'],
    ...rep.boxes.map((b) => [b.box, b.label, b.amount ?? '', b.vat ?? '', b.adjustment || '']),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'VAT return');
  const detail = [
    ['Date', 'Entry', 'Type', 'Party', 'Description', 'Section', 'Amount (AED)', 'VAT (AED)'],
    ...rep.transactions.map((t) => [t.date, t.entry_number, t.source_type, t.party, t.description,
      `${t.side === 'sales' ? 'Output' : 'Input'}${t.adjustment ? ' adjustment' : ''}`, t.net, t.vat]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detail), 'Transactions');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = { getIncomeStatement, getCashFlowStatement, getVatReport, exportVatReport };
