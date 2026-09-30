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

const CERTIFICATE_TYPE_PREFIX = {
  green_certificate: 'GC',
  certificate_of_destruction: 'CD',
  certificate_of_data_destruction: 'CDD',
  carbon_footprint: 'CF',
  destruction_report_evidence: 'DR',
};

/**
 * Certificate numbering: CER/{PREFIX}/{YYYY}/{seq}, sequence scoped per
 * tenant + type + year (resets each year). Locks on the certificates table
 * row-range via the transaction so concurrent generations never collide.
 */
async function nextCertificateNumber(db, tenantId, type, transaction) {
  const prefix = CERTIFICATE_TYPE_PREFIX[type];
  if (!prefix) throw new Error(`Unknown certificate type: ${type}`);
  const year = new Date().getFullYear();
  const likePattern = `CER/${prefix}/${year}/%`;

  const [rows] = await db.sequelize.query(
    `SELECT certificate_number FROM certificates
     WHERE tenant_id = ? AND certificate_number LIKE ?
     ORDER BY id DESC LIMIT 1 FOR UPDATE`,
    { replacements: [tenantId, likePattern], transaction }
  );

  let seq = 1;
  if (rows?.[0]?.certificate_number) {
    const parts = String(rows[0].certificate_number).split('/');
    const last = parseInt(parts[parts.length - 1], 10);
    if (Number.isFinite(last)) seq = last + 1;
  }

  return `CER/${prefix}/${year}/${seq}`;
}

module.exports = { nextReferenceNumber, nextCertificateNumber, CERTIFICATE_TYPE_PREFIX };
