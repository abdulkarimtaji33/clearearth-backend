/**
 * Accounts can ask sales to correct details of an approved quotation before any document is generated from it.
 * Sales is notified of what to correct; when sales marks it corrected, accounts is notified back.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const notificationService = require('./notification.service');

const fullName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || 'A user';

const include = [
  { model: db.User, as: 'requestedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
  { model: db.User, as: 'respondedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
];

const loadQuotation = async (tenantId, quotationId) => {
  const q = await db.Quotation.findOne({
    where: { id: quotationId, tenant_id: tenantId },
    include: [{ model: db.ProformaInvoice, as: 'proformaInvoice', attributes: ['id'], required: false }],
  });
  if (!q) throw ApiError.notFound('Quotation not found');
  return q;
};

const list = async (tenantId, quotationId) => {
  await loadQuotation(tenantId, quotationId);
  const rows = await db.QuotationCorrectionRequest.findAll({
    where: { tenant_id: tenantId, quotation_id: quotationId },
    include,
    order: [['id', 'DESC']],
  });
  return rows.map((r) => r.get({ plain: true }));
};

/** True when accounts has an unanswered correction request: no document may be generated until sales answers. */
const hasOpen = async (tenantId, quotationId) => {
  const n = await db.QuotationCorrectionRequest.count({ where: { tenant_id: tenantId, quotation_id: quotationId, status: 'open' } });
  return n > 0;
};

const create = async (tenantId, quotationId, user, message) => {
  const text = String(message || '').trim();
  if (!text) throw ApiError.badRequest('Describe what sales should correct');
  if (text.length > 5000) throw ApiError.badRequest('The message is too long (limit 5000 characters)');
  const q = await loadQuotation(tenantId, quotationId);
  if (q.status !== 'approved') throw ApiError.badRequest('Corrections can only be requested on an approved quotation');
  if (q.proformaInvoice?.id) {
    throw ApiError.badRequest('A proforma invoice has already been generated from this quotation, so it can no longer be corrected');
  }
  if (await hasOpen(tenantId, quotationId)) throw ApiError.badRequest('A correction request is already open for this quotation');

  const row = await db.QuotationCorrectionRequest.create({
    tenant_id: tenantId, quotation_id: quotationId, requested_by: user.id, message: text, status: 'open',
  });
  const requester = await db.User.findByPk(user.id, { attributes: ['first_name', 'last_name'] });
  await notificationService.createForUsers(tenantId, [q.prepared_by], {
    type: 'quotation_correction_requested',
    title: 'Correction requested by accounts',
    message: `${fullName(requester)} asked you to correct service quotation #${q.id}: ${text.slice(0, 200)}`,
    entityType: 'quotation',
    entityId: q.id,
  });
  return (await list(tenantId, quotationId))[0];
};

/** Sales (the preparer, or a manager) answers: the details were corrected. Accounts is notified. */
const resolve = async (tenantId, quotationId, requestId, user, note, scope = {}) => {
  const q = await loadQuotation(tenantId, quotationId);
  if (scope.scopeUserId && String(q.prepared_by) !== String(scope.scopeUserId)) throw ApiError.forbidden('Only the salesperson of this quotation can answer');
  const row = await db.QuotationCorrectionRequest.findOne({ where: { id: requestId, quotation_id: quotationId, tenant_id: tenantId } });
  if (!row) throw ApiError.notFound('Correction request not found');
  if (row.status !== 'open') throw ApiError.badRequest('This correction request is already answered');
  await row.update({ status: 'corrected', response_note: String(note || '').trim() || null, responded_by: user.id, responded_at: new Date() });

  const responder = await db.User.findByPk(user.id, { attributes: ['first_name', 'last_name'] });
  await notificationService.createForUsers(tenantId, [row.requested_by], {
    type: 'quotation_correction_done',
    title: 'Quotation corrected by sales',
    message: `${fullName(responder)} corrected service quotation #${q.id}${row.response_note ? `: ${row.response_note.slice(0, 200)}` : '.'} You can now generate documents from it.`,
    entityType: 'quotation',
    entityId: q.id,
  });
  return (await list(tenantId, quotationId)).find((r) => r.id === row.id);
};

module.exports = { list, create, resolve, hasOpen };
