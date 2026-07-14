/**
 * Continuing document reference numbers (e.g. quotation/PO numbers carried over
 * from the old ERP). Locks the table row-range via the transaction so concurrent
 * creates never get the same number.
 */
const db = require('../models');

async function nextReferenceNumber(model, seed, transaction) {
  const row = await model.findOne({
    attributes: [[db.sequelize.fn('MAX', db.sequelize.col('reference_number')), 'maxNum']],
    transaction,
    lock: transaction.LOCK.UPDATE,
    raw: true,
  });
  const max = row?.maxNum;
  return (max != null ? Number(max) : seed) + 1;
}

module.exports = { nextReferenceNumber };
