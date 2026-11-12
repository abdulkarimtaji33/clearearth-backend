/**
 * VAT on an amount before VAT: 5%, a manual amount, or none.
 *   vatRate 5 / '5'      -> 5% of the net
 *   vatRate 'manual'     -> vatAmount (0 .. net)
 *   vatRate 0 / '' / null -> no VAT
 */
const ApiError = require('./apiError');

const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

function resolveVat(net, vatRate, vatAmount) {
  const mode = vatRate == null || vatRate === '' ? '0' : String(vatRate).toLowerCase();
  if (mode === 'manual') {
    const vat = round2(vatAmount);
    if (!(vat >= 0)) throw ApiError.badRequest('VAT cannot be negative');
    if (vat > round2(net) + 0.005) throw ApiError.badRequest('VAT cannot be more than the amount before VAT');
    return { vat, rate: null };
  }
  const rate = parseFloat(mode);
  if (![0, 5].includes(rate)) throw ApiError.badRequest('VAT must be 5%, a manual amount, or none');
  return { vat: round2((net * rate) / 100), rate };
}

module.exports = { resolveVat };
