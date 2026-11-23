/**
 * Per-item VAT: a line is charged VAT unless it is explicitly marked "VAT not applicable".
 * Accepts camelCase (API payloads) and snake_case (database rows). Missing means applicable, so every
 * document created before this flag existed keeps charging VAT on all lines.
 */
const isVatApplicable = (item) => {
  const v = item ? (item.vatApplicable !== undefined ? item.vatApplicable : item.vat_applicable) : undefined;
  return !(v === false || v === 0 || v === '0' || v === 'false');
};

module.exports = { isVatApplicable };
