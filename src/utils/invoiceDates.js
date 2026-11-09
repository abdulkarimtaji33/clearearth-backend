const ApiError = require('./apiError');

const toDay = (d) => (d ? String(d).slice(0, 10) : null);

/** A due date can never be earlier than the invoice date. */
function assertDueNotBeforeInvoice(invoiceDate, dueDate) {
  const inv = toDay(invoiceDate);
  const due = toDay(dueDate);
  if (inv && due && due < inv) {
    throw ApiError.badRequest(`Due date (${due}) cannot be before the invoice date (${inv})`);
  }
}

/**
 * Due date for a new invoice derived from another document's payment terms (e.g. the proforma):
 * keep the same number of days between that document's invoice date and due date, counted from
 * the new invoice date, so it never lands before the invoice date.
 */
function dueDateFromTerms(newInvoiceDate, sourceInvoiceDate, sourceDueDate) {
  const src = toDay(sourceDueDate);
  if (!src) return null;
  const newInv = toDay(newInvoiceDate);
  if (!newInv || src >= newInv) return src;
  const srcInv = toDay(sourceInvoiceDate);
  const termDays = srcInv ? Math.max(0, Math.round((new Date(src) - new Date(srcInv)) / 86400000)) : 0;
  const due = new Date(`${newInv}T00:00:00Z`);
  due.setUTCDate(due.getUTCDate() + termDays);
  return due.toISOString().slice(0, 10);
}

module.exports = { assertDueNotBeforeInvoice, dueDateFromTerms };
