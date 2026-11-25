/** Normalise a currency code ("aed" -> "AED"); falls back when empty or malformed. */
function cleanCurrency(value, fallback = 'AED') {
  const v = String(value == null ? '' : value).trim().toUpperCase();
  return /^[A-Z]{3,10}$/.test(v) ? v : (fallback || 'AED');
}
/** The company's base (functional) currency: the ledger, financial reports, bank, expenses and payroll are kept in it. */
function baseCurrency() {
  return cleanCurrency(process.env.BASE_CURRENCY, 'AED');
}

module.exports = { cleanCurrency, baseCurrency };
