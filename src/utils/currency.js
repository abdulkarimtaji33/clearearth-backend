/** Normalise a currency code ("aed" -> "AED"); falls back when empty or malformed. */
function cleanCurrency(value, fallback = 'AED') {
  const v = String(value == null ? '' : value).trim().toUpperCase();
  return /^[A-Z]{3,10}$/.test(v) ? v : (fallback || 'AED');
}
module.exports = { cleanCurrency };
