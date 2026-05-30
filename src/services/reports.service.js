/**
 * Financial Reports Service
 * All reports query journal_entry_lines (status='posted') for accuracy.
 */
const db = require('../models');

function n(v) { return parseFloat(v) || 0; }

/** Sequelize SELECT queries return row arrays directly (not [rows, metadata]). */
function querySelect(sql, options = {}) {
  return db.sequelize.query(sql, {
    ...options,
    type: db.sequelize.QueryTypes.SELECT,
  });
}

// ─── Trial Balance ────────────────────────────────────────────────────────────

const getTrialBalance = async (tenantId, { asOfDate }) => {
  const date = asOfDate || new Date().toISOString().slice(0, 10);

  const rows = await querySelect(`
    SELECT
      a.id              AS account_id,
      a.code,
      a.name,
      a.type,
      a.sub_type,
      a.normal_balance,
      a.sort_order,
      COALESCE(SUM(l.debit),  0) AS total_debit,
      COALESCE(SUM(l.credit), 0) AS total_credit
    FROM chart_of_accounts a
    LEFT JOIN journal_entry_lines l ON l.account_id = a.id
    LEFT JOIN journal_entries e ON e.id = l.journal_entry_id
      AND e.tenant_id = :tenantId
      AND e.status = 'posted'
      AND e.entry_date <= :date
    WHERE a.tenant_id = :tenantId AND a.is_group = 0 AND a.is_active = 1
    GROUP BY a.id
    HAVING COALESCE(SUM(l.debit), 0) + COALESCE(SUM(l.credit), 0) > 0
    ORDER BY a.sort_order, a.code
  `, { replacements: { tenantId, date } });

  let grandDebit = 0;
  let grandCredit = 0;
  const accounts = rows.map((r) => {
    const debit  = n(r.total_debit);
    const credit = n(r.total_credit);
    const balance = r.normal_balance === 'debit' ? debit - credit : credit - debit;
    grandDebit  += debit;
    grandCredit += credit;
    return { ...r, total_debit: debit, total_credit: credit, balance };
  });

  return {
    as_of_date: date,
    accounts,
    grand_total_debit:  grandDebit,
    grand_total_credit: grandCredit,
    is_balanced: Math.abs(grandDebit - grandCredit) < 0.02,
  };
};

// ─── General Ledger ───────────────────────────────────────────────────────────

function buildGlLineFilters(tenantId, { accountId, dateFrom, dateTo, paidTo, receivedFrom, search }) {
  const conditions = ['e.tenant_id = ?', "e.status = 'posted'"];
  const replacements = [tenantId];

  const viewAll = !accountId || String(accountId).toLowerCase() === 'all';
  if (!viewAll) {
    conditions.push('l.account_id = ?');
    replacements.push(accountId);
  }

  if (dateFrom) {
    conditions.push('e.entry_date >= ?');
    replacements.push(dateFrom);
  }
  if (dateTo) {
    conditions.push('e.entry_date <= ?');
    replacements.push(dateTo);
  }
  if (paidTo && String(paidTo).trim()) {
    conditions.push('e.paid_to LIKE ?');
    replacements.push(`%${String(paidTo).trim()}%`);
  }
  if (receivedFrom && String(receivedFrom).trim()) {
    conditions.push('e.received_from LIKE ?');
    replacements.push(`%${String(receivedFrom).trim()}%`);
  }
  if (search && String(search).trim()) {
    const s = `%${String(search).trim()}%`;
    conditions.push(`(
      e.description LIKE ? OR e.entry_number LIKE ? OR l.description LIKE ?
      OR e.paid_to LIKE ? OR e.received_from LIKE ? OR a.name LIKE ? OR a.code LIKE ?
    )`);
    replacements.push(s, s, s, s, s, s, s);
  }

  return { conditions, replacements, viewAll };
}

const getGeneralLedger = async (tenantId, {
  accountId,
  dateFrom,
  dateTo,
  page = 1,
  pageSize = 50,
  paidTo,
  receivedFrom,
  search,
}) => {
  const { conditions, replacements, viewAll } = buildGlLineFilters(tenantId, {
    accountId,
    dateFrom,
    dateTo,
    paidTo,
    receivedFrom,
    search,
  });

  if (viewAll) {
    const countSql = `
      SELECT COUNT(*) AS cnt
      FROM journal_entry_lines l
      JOIN journal_entries e ON e.id = l.journal_entry_id
      JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = e.tenant_id
      WHERE ${conditions.join(' AND ')}
    `;
    const countRows = await querySelect(countSql, { replacements });
    const total = n(countRows[0].cnt);
    const offset = (page - 1) * pageSize;

    const lines = await querySelect(`
      SELECT
        l.id AS line_id,
        e.id AS journal_entry_id,
        e.entry_date, e.entry_number, e.description AS entry_desc,
        e.source_type, e.source_id,
        e.paid_to, e.received_from,
        a.id AS account_id, a.code AS account_code, a.name AS account_name,
        l.debit, l.credit, l.description AS line_desc
      FROM journal_entry_lines l
      JOIN journal_entries e ON e.id = l.journal_entry_id
      JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = e.tenant_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.entry_date DESC, e.id DESC, l.sort_order ASC, l.id ASC
      LIMIT ? OFFSET ?
    `, { replacements: [...replacements, pageSize, offset] });

    return {
      view_all: true,
      account: null,
      date_from: dateFrom || null,
      date_to: dateTo || null,
      opening_balance: null,
      closing_balance: null,
      entries: lines.map((l) => ({ ...l, debit: n(l.debit), credit: n(l.credit), running_balance: null })),
      total,
      page,
      page_size: pageSize,
    };
  }

  if (!accountId) throw new Error('accountId is required for General Ledger');

  const accountRows = await querySelect(
    `SELECT id, code, name, type, sub_type, normal_balance FROM chart_of_accounts WHERE id = ? AND tenant_id = ?`,
    { replacements: [accountId, tenantId] }
  );
  const account = accountRows[0];
  if (!account) throw new Error('Account not found');

  // Opening balance (all entries before dateFrom)
  let openingBalance = 0;
  if (dateFrom) {
    const obRows = await querySelect(`
      SELECT COALESCE(SUM(l.debit),0) AS td, COALESCE(SUM(l.credit),0) AS tc
      FROM journal_entry_lines l
      JOIN journal_entries e ON e.id = l.journal_entry_id
        AND e.tenant_id = ? AND e.status = 'posted' AND e.entry_date < ?
      WHERE l.account_id = ?
    `, { replacements: [tenantId, dateFrom, accountId] });
    const ob = obRows[0];
    openingBalance = account.normal_balance === 'debit'
      ? n(ob.td) - n(ob.tc)
      : n(ob.tc) - n(ob.td);
  }

  const countSql = `
    SELECT COUNT(*) AS cnt
    FROM journal_entry_lines l
    JOIN journal_entries e ON e.id = l.journal_entry_id
    JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = e.tenant_id
    WHERE ${conditions.join(' AND ')}
  `;
  const countRows = await querySelect(countSql, { replacements });
  const total = n(countRows[0].cnt);

  const offset = (page - 1) * pageSize;
  const lines = await querySelect(`
    SELECT
      l.id AS line_id,
      e.id AS journal_entry_id,
      e.entry_date, e.entry_number, e.description AS entry_desc,
      e.source_type, e.source_id,
      e.paid_to, e.received_from,
      a.id AS account_id, a.code AS account_code, a.name AS account_name,
      l.debit, l.credit, l.description AS line_desc
    FROM journal_entry_lines l
    JOIN journal_entries e ON e.id = l.journal_entry_id
    JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = e.tenant_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY e.entry_date ASC, e.id ASC, l.sort_order ASC, l.id ASC
    LIMIT ? OFFSET ?
  `, { replacements: [...replacements, pageSize, offset] });

  // Running balance
  let runBalance = openingBalance;
  const entries = lines.map((l) => {
    const debit = n(l.debit);
    const credit = n(l.credit);
    runBalance += account.normal_balance === 'debit' ? debit - credit : credit - debit;
    return { ...l, debit, credit, running_balance: runBalance };
  });

  return {
    view_all: false,
    account,
    date_from: dateFrom || null,
    date_to: dateTo || null,
    opening_balance: openingBalance,
    entries,
    closing_balance: runBalance,
    total,
    page,
    page_size: pageSize,
  };
};

// ─── Income Statement (P&L) ───────────────────────────────────────────────────

async function _getIncomeStatementData(tenantId, dateFrom, dateTo) {
  const rows = await querySelect(`
    SELECT
      a.id, a.code, a.name, a.type, a.sub_type, a.sort_order,
      COALESCE(SUM(l.debit),  0) AS total_debit,
      COALESCE(SUM(l.credit), 0) AS total_credit
    FROM chart_of_accounts a
    JOIN journal_entry_lines l ON l.account_id = a.id
    JOIN journal_entries e ON e.id = l.journal_entry_id
      AND e.tenant_id = :tenantId AND e.status = 'posted'
      AND e.entry_date >= :dateFrom AND e.entry_date <= :dateTo
    WHERE a.tenant_id = :tenantId AND a.type IN ('revenue', 'expense') AND a.is_group = 0
    GROUP BY a.id
    ORDER BY a.sort_order, a.code
  `, { replacements: { tenantId, dateFrom, dateTo } });

  const revenue = { items: [], total: 0 };
  const cogs = { items: [], total: 0 };
  const opex = { items: [], total: 0 };
  const finance = { items: [], total: 0 };

  for (const r of rows) {
    const amount = r.type === 'revenue'
      ? n(r.total_credit) - n(r.total_debit)   // credit-normal
      : n(r.total_debit)  - n(r.total_credit);  // debit-normal

    const item = { id: r.id, code: r.code, name: r.name, sub_type: r.sub_type, amount };
    if (r.type === 'revenue') { revenue.items.push(item); revenue.total += amount; }
    else if (r.sub_type === 'cost_of_revenue')  { cogs.items.push(item);    cogs.total    += amount; }
    else if (r.sub_type === 'finance_cost')     { finance.items.push(item); finance.total += amount; }
    else                                         { opex.items.push(item);    opex.total    += amount; }
  }

  const grossProfit         = revenue.total - cogs.total;
  const operatingIncome     = grossProfit   - opex.total;
  const netIncome           = operatingIncome - finance.total;

  return { revenue, cogs, opex, finance, grossProfit, operatingIncome, netIncome };
}

const getIncomeStatement = async (tenantId, { dateFrom, dateTo, comparativeDateFrom, comparativeDateTo }) => {
  const current = await _getIncomeStatementData(tenantId, dateFrom, dateTo);
  let comparative = null;
  if (comparativeDateFrom && comparativeDateTo) {
    comparative = await _getIncomeStatementData(tenantId, comparativeDateFrom, comparativeDateTo);
  }
  return { date_from: dateFrom, date_to: dateTo, current, comparative };
};

// ─── Balance Sheet ────────────────────────────────────────────────────────────

async function _accountBalance(tenantId, asOfDate, accountType) {
  const rows = await querySelect(`
    SELECT
      a.id, a.code, a.name, a.sub_type, a.normal_balance, a.sort_order,
      COALESCE(SUM(l.debit),  0) AS total_debit,
      COALESCE(SUM(l.credit), 0) AS total_credit
    FROM chart_of_accounts a
    JOIN journal_entry_lines l ON l.account_id = a.id
    JOIN journal_entries e ON e.id = l.journal_entry_id
      AND e.tenant_id = :tenantId AND e.status = 'posted' AND e.entry_date <= :asOfDate
    WHERE a.tenant_id = :tenantId AND a.type = :accountType AND a.is_group = 0
    GROUP BY a.id
    ORDER BY a.sort_order, a.code
  `, { replacements: { tenantId, asOfDate, accountType } });

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    sub_type: r.sub_type,
    balance: r.normal_balance === 'debit'
      ? n(r.total_debit) - n(r.total_credit)
      : n(r.total_credit) - n(r.total_debit),
  })).filter((r) => Math.abs(r.balance) > 0.005);
}

const getBalanceSheet = async (tenantId, { asOfDate, comparativeAsOfDate }) => {
  const date = asOfDate || new Date().toISOString().slice(0, 10);

  const assets      = await _accountBalance(tenantId, date, 'asset');
  const liabilities = await _accountBalance(tenantId, date, 'liability');
  const equity      = await _accountBalance(tenantId, date, 'equity');

  // Net income flows into Retained Earnings on balance sheet (cumulative P&L)
  const firstDate = '1900-01-01';
  const isData = await _getIncomeStatementData(tenantId, firstDate, date);
  const cumulativeNetIncome = isData.netIncome;

  const totalAssets      = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquityBase  = equity.reduce((s, a) => s + a.balance, 0);
  const totalEquity      = totalEquityBase + cumulativeNetIncome;
  const totalLiabEquity  = totalLiabilities + totalEquity;
  const isBalanced       = Math.abs(totalAssets - totalLiabEquity) < 0.05;

  let comp = null;
  if (comparativeAsOfDate) {
    const ca = await _accountBalance(tenantId, comparativeAsOfDate, 'asset');
    const cl = await _accountBalance(tenantId, comparativeAsOfDate, 'liability');
    const ce = await _accountBalance(tenantId, comparativeAsOfDate, 'equity');
    const ciData = await _getIncomeStatementData(tenantId, firstDate, comparativeAsOfDate);
    comp = {
      as_of_date: comparativeAsOfDate,
      assets: ca, total_assets: ca.reduce((s,a) => s + a.balance, 0),
      liabilities: cl, total_liabilities: cl.reduce((s,a) => s + a.balance, 0),
      equity: ce, cumulative_net_income: ciData.netIncome,
      total_equity: ce.reduce((s,a) => s + a.balance, 0) + ciData.netIncome,
    };
  }

  return {
    as_of_date: date,
    assets,
    total_assets: totalAssets,
    liabilities,
    total_liabilities: totalLiabilities,
    equity,
    cumulative_net_income: cumulativeNetIncome,
    total_equity: totalEquity,
    total_liabilities_and_equity: totalLiabEquity,
    is_balanced: isBalanced,
    comparative: comp,
  };
};

// ─── Cash Flow Statement (Indirect Method) ───────────────────────────────────

const getCashFlowStatement = async (tenantId, { dateFrom, dateTo }) => {
  // Net income for the period
  const isData = await _getIncomeStatementData(tenantId, dateFrom, dateTo);
  const netIncome = isData.netIncome;

  // Working capital changes (balance at end minus balance at start)
  async function balAt(code, date) {
    const rows = await querySelect(`
      SELECT
        COALESCE(SUM(l.debit),0) AS td, COALESCE(SUM(l.credit),0) AS tc,
        a.normal_balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines l ON l.account_id = a.id
      LEFT JOIN journal_entries e ON e.id = l.journal_entry_id
        AND e.tenant_id = ? AND e.status = 'posted' AND e.entry_date <= ?
      WHERE a.tenant_id = ? AND a.code = ? AND a.is_group = 0
      GROUP BY a.id
    `, { replacements: [tenantId, date, tenantId, code] });
    if (!rows.length) return 0;
    const r = rows[0];
    return r.normal_balance === 'debit' ? n(r.td) - n(r.tc) : n(r.tc) - n(r.td);
  }

  const dayBefore = (d) => {
    const dt = new Date(`${d}T12:00:00`);
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().slice(0, 10);
  };

  const startDate = dateFrom;
  const endDate   = dateTo;
  const prevDate  = dayBefore(startDate);

  const [arEnd, arStart]     = await Promise.all([balAt('1100', endDate), balAt('1100', prevDate)]);
  const [apEnd, apStart]     = await Promise.all([balAt('2000', endDate), balAt('2000', prevDate)]);
  const [acEnd, acStart]     = await Promise.all([balAt('2200', endDate), balAt('2200', prevDate)]);
  const [vatEnd, vatStart]   = await Promise.all([balAt('2100', endDate), balAt('2100', prevDate)]);
  const [cashEnd, cashStart] = await Promise.all([balAt('1000', endDate), balAt('1000', prevDate)]);

  const changeAR  = arEnd  - arStart;   // increase = use of cash (negative)
  const changeAP  = apEnd  - apStart;   // increase = source of cash (positive)
  const changeAcc = acEnd  - acStart;   // increase = source of cash (positive)
  const changeVAT = vatEnd - vatStart;  // increase = source of cash (positive)

  // Investing: movements on fixed asset accounts
  const faRows = await querySelect(`
    SELECT COALESCE(SUM(l.debit),0) - COALESCE(SUM(l.credit),0) AS net
    FROM journal_entry_lines l
    JOIN journal_entries e ON e.id = l.journal_entry_id
      AND e.tenant_id = ? AND e.status = 'posted'
      AND e.entry_date >= ? AND e.entry_date <= ?
    JOIN chart_of_accounts a ON a.id = l.account_id AND a.sub_type = 'fixed_asset' AND a.normal_balance = 'debit'
  `, { replacements: [tenantId, startDate, endDate] });
  const investingNet = -(n(faRows[0].net)); // cash used = negative

  // Financing: capital contributions and drawings
  const finRows = await querySelect(`
    SELECT
      COALESCE(SUM(CASE WHEN a.code = '3000' THEN l.credit ELSE 0 END), 0) AS contributions,
      COALESCE(SUM(CASE WHEN a.code = '3200' THEN l.debit ELSE 0 END), 0)  AS drawings,
      COALESCE(SUM(CASE WHEN a.code = '2500' THEN l.credit - l.debit ELSE 0 END), 0) AS loan_net
    FROM journal_entry_lines l
    JOIN journal_entries e ON e.id = l.journal_entry_id
      AND e.tenant_id = ? AND e.status = 'posted'
      AND e.entry_date >= ? AND e.entry_date <= ?
    JOIN chart_of_accounts a ON a.id = l.account_id
    WHERE a.tenant_id = ?
  `, { replacements: [tenantId, startDate, endDate, tenantId] });

  const contrib  = n(finRows[0].contributions);
  const drawings = n(finRows[0].drawings);
  const loanNet  = n(finRows[0].loan_net);
  const financingNet = contrib - drawings + loanNet;

  const operatingNet = netIncome - changeAR + changeAP + changeAcc + changeVAT;
  const netCashChange = operatingNet + investingNet + financingNet;

  return {
    date_from: startDate,
    date_to: endDate,
    operating: {
      net_income: netIncome,
      working_capital_changes: {
        change_in_ar:      -changeAR,
        change_in_ap:       changeAP,
        change_in_accrued:  changeAcc,
        change_in_vat:      changeVAT,
      },
      net: operatingNet,
    },
    investing: {
      fixed_asset_purchases: investingNet,
      net: investingNet,
    },
    financing: {
      capital_contributions: contrib,
      drawings:             -drawings,
      loan_net:              loanNet,
      net: financingNet,
    },
    opening_cash: cashStart,
    net_change:   netCashChange,
    closing_cash: cashEnd,
    reconciled: Math.abs(cashEnd - (cashStart + netCashChange)) < 0.05,
  };
};

// ─── Statement of Changes in Equity ──────────────────────────────────────────

const getChangesInEquity = async (tenantId, { dateFrom, dateTo }) => {
  const prevDate = (() => {
    const dt = new Date(`${dateFrom}T12:00:00`);
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().slice(0, 10);
  })();

  async function cumBalance(code, date) {
    const rows = await querySelect(`
      SELECT COALESCE(SUM(l.debit),0) AS td, COALESCE(SUM(l.credit),0) AS tc, a.normal_balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines l ON l.account_id = a.id
      LEFT JOIN journal_entries e ON e.id = l.journal_entry_id
        AND e.tenant_id = ? AND e.status = 'posted' AND e.entry_date <= ?
      WHERE a.tenant_id = ? AND a.code = ? AND a.is_group = 0
      GROUP BY a.id
    `, { replacements: [tenantId, date, tenantId, code] });
    if (!rows.length) return 0;
    const r = rows[0];
    return r.normal_balance === 'debit' ? n(r.td) - n(r.tc) : n(r.tc) - n(r.td);
  }

  async function periodMovement(code, dateFrom, dateTo, side) {
    const rows = await querySelect(`
      SELECT COALESCE(SUM(l.${side}), 0) AS amt
      FROM journal_entry_lines l
      JOIN journal_entries e ON e.id = l.journal_entry_id
        AND e.tenant_id = ? AND e.status = 'posted'
        AND e.entry_date >= ? AND e.entry_date <= ?
      JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = ? AND a.code = ?
    `, { replacements: [tenantId, dateFrom, dateTo, tenantId, code] });
    return n(rows[0].amt);
  }

  const isData = await _getIncomeStatementData(tenantId, dateFrom, dateTo);
  const netIncome = isData.netIncome;

  const openShareCapital = await cumBalance('3000', prevDate);
  const openRetained     = await cumBalance('3100', prevDate);
  const openDrawings     = await cumBalance('3200', prevDate);

  const contributions = await periodMovement('3000', dateFrom, dateTo, 'credit');
  const drawings      = await periodMovement('3200', dateFrom, dateTo, 'debit');

  const closingShareCapital = openShareCapital + contributions;
  const closingRetained     = openRetained     + netIncome;
  const closingDrawings     = openDrawings     + drawings;
  const closingTotal        = closingShareCapital + closingRetained - closingDrawings;

  return {
    date_from: dateFrom,
    date_to: dateTo,
    share_capital: {
      opening: openShareCapital,
      contributions,
      closing: closingShareCapital,
    },
    retained_earnings: {
      opening: openRetained,
      net_income: netIncome,
      closing: closingRetained,
    },
    drawings: {
      opening: openDrawings,
      period_drawings: drawings,
      closing: closingDrawings,
    },
    total_equity: {
      opening: openShareCapital + openRetained - openDrawings,
      closing: closingTotal,
    },
  };
};

// ─── VAT Report (UAE) ─────────────────────────────────────────────────────────

const getVatReport = async (tenantId, { dateFrom, dateTo }) => {
  const rows = await querySelect(`
    SELECT
      e.source_type,
      COALESCE(SUM(CASE WHEN a.code = '2100' THEN l.credit ELSE 0 END), 0) AS output_vat_collected,
      COALESCE(SUM(CASE WHEN a.code = '2100' THEN l.debit  ELSE 0 END), 0) AS output_vat_paid,
      COALESCE(SUM(CASE WHEN a.code = '1200' THEN l.debit  ELSE 0 END), 0) AS input_vat_collected,
      COALESCE(SUM(CASE WHEN a.code = '4000' THEN l.credit ELSE 0 END), 0) AS revenue_amount,
      COALESCE(SUM(CASE WHEN a.code = '5000' THEN l.debit  ELSE 0 END), 0) AS purchase_amount
    FROM journal_entry_lines l
    JOIN journal_entries e ON e.id = l.journal_entry_id
      AND e.tenant_id = :tenantId AND e.status = 'posted'
      AND e.entry_date >= :dateFrom AND e.entry_date <= :dateTo
    JOIN chart_of_accounts a ON a.id = l.account_id AND a.tenant_id = :tenantId
    GROUP BY e.source_type
  `, { replacements: { tenantId, dateFrom, dateTo } });

  let outputVatCollected = 0;
  let outputVatPaid = 0;
  let inputVat = 0;
  let standardRatedSales = 0;
  let standardRatedPurchases = 0;

  for (const r of rows) {
    outputVatCollected   += n(r.output_vat_collected);
    outputVatPaid        += n(r.output_vat_paid);
    inputVat             += n(r.input_vat_collected);
    standardRatedSales   += n(r.revenue_amount);
    standardRatedPurchases += n(r.purchase_amount);
  }

  const netOutputVat = outputVatCollected - outputVatPaid;
  const netVatDue    = netOutputVat - inputVat;

  return {
    date_from: dateFrom,
    date_to: dateTo,
    output_vat: {
      standard_rated_sales: standardRatedSales,
      vat_collected: outputVatCollected,
      vat_paid_to_fta: outputVatPaid,
      net: netOutputVat,
    },
    input_vat: {
      standard_rated_purchases: standardRatedPurchases,
      vat_reclaimable: inputVat,
    },
    net_vat_due: netVatDue,
    is_refundable: netVatDue < 0,
  };
};

module.exports = {
  getTrialBalance,
  getGeneralLedger,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getChangesInEquity,
  getVatReport,
};
