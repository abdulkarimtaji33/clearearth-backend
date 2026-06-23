/**
 * Notification Service
 */
const db = require('../models');
const { Op } = db.Sequelize;
const { emitToUsers, emitToTenant } = require('../socket');

const MANAGER_ADMIN_ROLES = ['sales_manager', 'admin', 'tenant_admin', 'super_admin'];

const getForUser = async (tenantId, userId, { limit = 20, unreadOnly = false } = {}) => {
  const where = { tenant_id: tenantId, user_id: userId };
  if (unreadOnly) where.is_read = false;

  const rows = await db.Notification.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
  });

  const unreadCount = await db.Notification.count({
    where: { tenant_id: tenantId, user_id: userId, is_read: false },
  });

  return { notifications: rows, unreadCount };
};

const markRead = async (tenantId, userId, notificationId) => {
  const row = await db.Notification.findOne({
    where: { id: notificationId, tenant_id: tenantId, user_id: userId },
  });
  if (!row) return null;
  await row.update({ is_read: true });
  return row;
};

const markAllRead = async (tenantId, userId) => {
  await db.Notification.update(
    { is_read: true },
    { where: { tenant_id: tenantId, user_id: userId, is_read: false } }
  );
};

const createForUsers = async (tenantId, userIds, payload) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const rows = uniqueIds.map(userId => ({
    tenant_id: tenantId,
    user_id: userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    entity_type: payload.entityType || null,
    entity_id: payload.entityId || null,
    is_read: false,
  }));

  const created = await db.Notification.bulkCreate(rows);
  // Push real-time event to connected users
  try { emitToUsers(uniqueIds, 'notification', { type: payload.type, title: payload.title, message: payload.message }); } catch {}
  return created;
};

const getSalesManagerUserIds = async (tenantId) => {
  const roles = await db.Role.findAll({
    where: {
      name: 'sales_manager',
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
    },
    attributes: ['id'],
  });
  const roleIds = roles.map(r => r.id);
  if (roleIds.length === 0) return [];

  const users = await db.User.findAll({
    where: { tenant_id: tenantId, role_id: { [Op.in]: roleIds }, status: 'active' },
    attributes: ['id'],
  });
  return users.map(u => u.id);
};

const getManagerAndAdminUserIds = async (tenantId) => {
  const roles = await db.Role.findAll({
    where: {
      name: { [Op.in]: MANAGER_ADMIN_ROLES },
      [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }],
    },
    attributes: ['id'],
  });
  const roleIds = roles.map(r => r.id);
  if (roleIds.length === 0) return [];

  const users = await db.User.findAll({
    where: { tenant_id: tenantId, role_id: { [Op.in]: roleIds }, status: 'active' },
    attributes: ['id'],
  });
  return users.map(u => u.id);
};

const formatDealStatusDate = (date = new Date()) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} at ${hours}:${minutes} ${ampm}`;
};

const notifyDealStatusChange = async (tenantId, deal, previousStatus, newStatus, changedByUser) => {
  if (!['won', 'lost'].includes(newStatus) || previousStatus === newStatus) return;

  const recipientIds = await getManagerAndAdminUserIds(tenantId);
  if (recipientIds.length === 0) return;

  const companyName = deal.company?.company_name || deal.supplier?.company_name || 'Unknown company';
  const userName = changedByUser
    ? [changedByUser.first_name, changedByUser.last_name].filter(Boolean).join(' ')
    : 'A user';
  const statusLabel = newStatus === 'won' ? 'won' : 'lost';
  const when = formatDealStatusDate();

  const message = `The Deal (${deal.title}) for ${companyName} has been marked as ${statusLabel} by ${userName} on ${when}`;

  await createForUsers(tenantId, recipientIds, {
    type: 'deal_status_change',
    title: `Deal marked as ${statusLabel}`,
    message,
    entityType: 'deal',
    entityId: deal.id,
  });
};

const notifyInspectionRejected = async (tenantId, request, reason, rejectedByUser) => {
  if (!request.requested_by) return;

  const deal = request.deal;
  const companyName = deal?.company?.company_name || deal?.supplier?.company_name || 'Unknown company';
  const userName = rejectedByUser
    ? [rejectedByUser.first_name, rejectedByUser.last_name].filter(Boolean).join(' ')
    : 'Inspection team';

  await createForUsers(tenantId, [request.requested_by], {
    type: 'inspection_rejected',
    title: 'Inspection request rejected',
    message: `Your inspection request for deal "${deal?.title || ''}" (${companyName}) was rejected by ${userName}. Reason: ${reason}`,
    entityType: 'inspection_request',
    entityId: request.id,
  });
};

const notifyDealApprovalRequested = async (tenantId, deal, requestedByUser) => {
  const recipientIds = await getSalesManagerUserIds(tenantId);
  if (recipientIds.length === 0) return;

  const companyName = deal.company?.company_name || 'Unknown company';
  const userName = requestedByUser
    ? [requestedByUser.first_name, requestedByUser.last_name].filter(Boolean).join(' ')
    : 'A user';
  const dealLabel = deal.deal_number ? `Deal ${deal.deal_number}` : `Deal #${deal.id}`;

  await createForUsers(tenantId, recipientIds, {
    type: 'deal_approval_requested',
    title: 'Deal approval requested',
    message: `${userName} requested approval for ${dealLabel} (${companyName} — ${deal.title || ''}).`,
    entityType: 'deal',
    entityId: deal.id,
  });
};

const notifyPurchaseOrderApprovalRequested = async (tenantId, po, requestedByUser) => {
  const recipientIds = await getSalesManagerUserIds(tenantId);
  if (recipientIds.length === 0) return;

  const companyName = po.company?.company_name || 'Unknown client';
  const dealTitle = po.deal?.title || po.deal?.deal_number || (po.deal_id ? `Deal #${po.deal_id}` : '');
  const userName = requestedByUser
    ? [requestedByUser.first_name, requestedByUser.last_name].filter(Boolean).join(' ')
    : 'A user';

  await createForUsers(tenantId, recipientIds, {
    type: 'purchase_order_approval_requested',
    title: 'Client purchase quotation approval requested',
    message: `${userName} requested approval for client purchase quotation #${po.id} (${companyName}${dealTitle ? ` — ${dealTitle}` : ''}).`,
    entityType: 'purchase_order',
    entityId: po.id,
  });
};

const notifyQuotationApprovalRequested = async (tenantId, quotation, requestedByUser) => {
  const recipientIds = await getSalesManagerUserIds(tenantId);
  if (recipientIds.length === 0) return;

  const dealTitle = quotation.deal?.title || quotation.deal?.deal_number || `Deal #${quotation.deal_id}`;
  const userName = requestedByUser
    ? [requestedByUser.first_name, requestedByUser.last_name].filter(Boolean).join(' ')
    : 'A user';

  await createForUsers(tenantId, recipientIds, {
    type: 'quotation_approval_requested',
    title: 'Quotation approval requested',
    message: `${userName} requested approval for service quotation #${quotation.id} (${dealTitle}).`,
    entityType: 'quotation',
    entityId: quotation.id,
  });
};

const notifyLeadCreated = async (tenantId, lead, createdByUser) => {
  const recipientIds = await getSalesManagerUserIds(tenantId);
  if (recipientIds.length === 0) return;

  const companyName = lead.company?.company_name || '';
  const userName = createdByUser
    ? [createdByUser.first_name, createdByUser.last_name].filter(Boolean).join(' ')
    : 'A user';
  const leadLabel = lead.lead_number ? `Lead ${lead.lead_number}` : `Lead #${lead.id}`;

  await createForUsers(tenantId, recipientIds, {
    type: 'lead_created',
    title: 'New lead created',
    message: `${userName} created ${leadLabel}${companyName ? ` for ${companyName}` : ''}.`,
    entityType: 'lead',
    entityId: lead.id,
  });
};

const notifyLeadApprovalRequested = async (tenantId, lead, requestedByUser) => {
  const recipientIds = await getSalesManagerUserIds(tenantId);
  if (recipientIds.length === 0) return;

  const companyName = lead.company?.company_name || 'Unknown company';
  const contactName = lead.contact
    ? [lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ')
    : '';
  const userName = requestedByUser
    ? [requestedByUser.first_name, requestedByUser.last_name].filter(Boolean).join(' ')
    : 'A user';
  const leadLabel = lead.lead_number ? `Lead ${lead.lead_number}` : `Lead #${lead.id}`;

  await createForUsers(tenantId, recipientIds, {
    type: 'lead_approval_requested',
    title: 'Lead approval requested',
    message: `${userName} requested approval for ${leadLabel} (${companyName}${contactName ? ` — ${contactName}` : ''}).`,
    entityType: 'lead',
    entityId: lead.id,
  });
};

const getAccountsUserIds = async (tenantId) => {
  const roles = await db.Role.findAll({
    where: { name: 'accounts', [Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }] },
    attributes: ['id'],
  });
  const roleIds = roles.map(r => r.id);
  if (roleIds.length === 0) return [];
  const users = await db.User.findAll({
    where: { tenant_id: tenantId, role_id: { [Op.in]: roleIds }, status: 'active' },
    attributes: ['id'],
  });
  return users.map(u => u.id);
};

const notifyExpenseSubmitted = async (tenantId, workOrderId, taskName, submittedByUser) => {
  const recipientIds = await getAccountsUserIds(tenantId);
  if (recipientIds.length === 0) return;
  const userName = submittedByUser
    ? [submittedByUser.first_name, submittedByUser.last_name].filter(Boolean).join(' ')
    : 'Operations team';
  await createForUsers(tenantId, recipientIds, {
    type: 'expense_submitted',
    title: 'Expense submitted for approval',
    message: `${userName} submitted expenses for Work Order #${workOrderId}${taskName ? ` — ${taskName}` : ''}.`,
    entityType: 'work_order',
    entityId: workOrderId,
  });
};

module.exports = {
  getForUser,
  markRead,
  markAllRead,
  createForUsers,
  notifyDealStatusChange,
  notifyInspectionRejected,
  notifyLeadCreated,
  notifyLeadApprovalRequested,
  notifyDealApprovalRequested,
  notifyQuotationApprovalRequested,
  notifyPurchaseOrderApprovalRequested,
  notifyExpenseSubmitted,
};
