const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyCreatedAtFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;
const { LEAD_STATUS } = require('../constants');
const { isManagerRole, verifyLeadApprovalPin } = require('../utils/leadApproval');
const { assertManagerCanChangeStatus } = require('../utils/statusChangeGuard');
const notificationService = require('./notification.service');

const leadIncludes = [
  { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
  { model: db.User, as: 'approvedByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
  { model: db.Company, as: 'company', attributes: ['id', 'company_name', 'email', 'phone'], required: false },
  { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'], required: false },
  { model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'category', 'price', 'unit_of_measure', 'currency'], required: false },
];

const APPROVABLE_STATUSES = [LEAD_STATUS.NEW, LEAD_STATUS.CONTACTED, LEAD_STATUS.PENDING_APPROVAL];
const EDITABLE_STATUSES = [LEAD_STATUS.NEW, LEAD_STATUS.CONTACTED, LEAD_STATUS.PENDING_APPROVAL, LEAD_STATUS.DISQUALIFIED];

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, assignedTo, source, companyId, contactId, productServiceId, scopeUserId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  // Sales: leads assigned to OR created by the user
  if (scopeUserId) {
    where[Op.or] = [{ assigned_to: scopeUserId }, { created_by: scopeUserId }];
  }
  if (search) {
    const s = String(search).trim();
    const or = [
      { email: { [Op.like]: `%${s}%` } },
      { phone: { [Op.like]: `%${s}%` } },
      { lead_number: { [Op.like]: `%${s}%` } },
    ];
    const n = parseInt(s, 10);
    if (String(n) === s && n > 0) or.push({ id: n });
    where[Op.or] = or;
  }
  if (status) where.status = status;
  if (assignedTo && !scopeUserId) where.assigned_to = assignedTo;
  if (source) where.source = source;
  if (companyId) where.company_id = companyId;
  if (contactId) where.contact_id = contactId;
  if (productServiceId) where.product_service_id = productServiceId;
  applyCreatedAtFilter(where, dateFrom, dateTo);

  const { count, rows } = await db.Lead.findAndCountAll({
    where,
    include: leadIncludes,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { leads: rows, total: count };
};

const getById = async (tenantId, leadId, scope = {}) => {
  const where = { id: leadId, tenant_id: tenantId };
  if (scope.scopeUserId) {
    where[Op.or] = [{ assigned_to: scope.scopeUserId }, { created_by: scope.scopeUserId }];
  }
  const lead = await db.Lead.findOne({
    where,
    include: leadIncludes,
  });
  if (!lead) throw ApiError.notFound('Lead not found');
  return lead;
};

const create = async (tenantId, data, scope = {}) => {
  const assignedTo = scope.scopeUserId || data.assignedTo;

  if (data.companyId) {
    const company = await db.Company.findOne({ where: { id: data.companyId, tenant_id: tenantId } });
    if (!company) throw ApiError.notFound('Company not found');
  }

  if (data.contactId) {
    const contact = await db.Contact.findOne({ where: { id: data.contactId, tenant_id: tenantId } });
    if (!contact) throw ApiError.notFound('Contact not found');
  }

  const lead = await db.Lead.create({
    tenant_id: tenantId,
    company_id: data.companyId || null,
    contact_id: data.contactId || null,
    email: data.email,
    phone: data.phone,
    source: data.source,
    service_interest: data.serviceInterest || [],
    product_service_id: data.productServiceId || null,
    estimated_value: data.estimatedValue,
    notes: data.notes,
    assigned_to: assignedTo,
    created_by: scope.scopeUserId || null,
    status: LEAD_STATUS.NEW,
  });

  await lead.update({ lead_number: String(lead.id) });

  return await getById(tenantId, lead.id);
};

const update = async (tenantId, leadId, data, scope = {}, actor = null) => {
  const where = { id: leadId, tenant_id: tenantId };
  if (scope.scopeUserId) {
    where[Op.or] = [{ assigned_to: scope.scopeUserId }, { created_by: scope.scopeUserId }];
  }
  const lead = await db.Lead.findOne({ where });
  if (!lead) throw ApiError.notFound('Lead not found');

  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Cannot update converted lead');
  }

  if (data.companyId !== undefined && data.companyId !== null) {
    const company = await db.Company.findOne({ where: { id: data.companyId, tenant_id: tenantId } });
    if (!company) throw ApiError.notFound('Company not found');
  }

  if (data.contactId !== undefined && data.contactId !== null) {
    const contact = await db.Contact.findOne({ where: { id: data.contactId, tenant_id: tenantId } });
    if (!contact) throw ApiError.notFound('Contact not found');
  }

  let nextStatus = lead.status;
  if (data.status !== undefined) {
    assertManagerCanChangeStatus(actor, lead.status, data.status);
    if (!EDITABLE_STATUSES.includes(data.status)) {
      throw ApiError.badRequest('Lead status cannot be set directly. Use the approval workflow.');
    }
    if (data.status === LEAD_STATUS.QUALIFIED || data.status === LEAD_STATUS.CONVERTED) {
      throw ApiError.badRequest('Lead approval is required before marking as qualified');
    }
    nextStatus = data.status;
  }

  await lead.update({
    company_id: data.companyId !== undefined ? data.companyId : lead.company_id,
    contact_id: data.contactId !== undefined ? data.contactId : lead.contact_id,
    email: data.email !== undefined ? data.email : lead.email,
    phone: data.phone !== undefined ? data.phone : lead.phone,
    source: data.source !== undefined ? data.source : lead.source,
    status: nextStatus,
    service_interest: data.serviceInterest !== undefined ? data.serviceInterest : lead.service_interest,
    product_service_id: data.productServiceId !== undefined ? data.productServiceId : lead.product_service_id,
    estimated_value: data.estimatedValue !== undefined ? data.estimatedValue : lead.estimated_value,
    notes: data.notes !== undefined ? data.notes : lead.notes,
    assigned_to: scope.scopeUserId ? scope.scopeUserId : (data.assignedTo !== undefined ? data.assignedTo : lead.assigned_to),
  });

  return await getById(tenantId, leadId);
};

const _approveLead = async (lead, { notes, approvedByUserId }) => {
  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Lead already converted');
  }
  if (lead.status === LEAD_STATUS.QUALIFIED) {
    throw ApiError.badRequest('Lead is already approved');
  }
  if (!APPROVABLE_STATUSES.includes(lead.status)) {
    throw ApiError.badRequest('Lead cannot be approved in its current status');
  }

  await lead.update({
    status: LEAD_STATUS.QUALIFIED,
    qualification_notes: notes || lead.qualification_notes,
    approved_by: approvedByUserId || null,
    approved_at: new Date(),
    approval_requested_at: null,
  });
};

const qualify = async (tenantId, leadId, notes, scope = {}, actor = {}) => {
  if (!isManagerRole(actor.roleName)) {
    throw ApiError.forbidden('Only a manager can approve leads. Use the approval PIN or request manager approval.');
  }

  const lead = await db.Lead.findOne({ where: { id: leadId, tenant_id: tenantId } });
  if (!lead) throw ApiError.notFound('Lead not found');

  await _approveLead(lead, { notes, approvedByUserId: actor.userId });

  return await getById(tenantId, leadId);
};

const requestApproval = async (tenantId, leadId, scope = {}, requestedByUser = null) => {
  const where = { id: leadId, tenant_id: tenantId };
  if (scope.scopeUserId) {
    where[Op.or] = [{ assigned_to: scope.scopeUserId }, { created_by: scope.scopeUserId }];
  }
  const lead = await db.Lead.findOne({
    where,
    include: [
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
      { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
  });
  if (!lead) throw ApiError.notFound('Lead not found');

  if (lead.status === LEAD_STATUS.QUALIFIED || lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Lead is already approved');
  }
  if (lead.status === LEAD_STATUS.PENDING_APPROVAL) {
    throw ApiError.badRequest('Approval has already been requested');
  }
  if (![LEAD_STATUS.NEW, LEAD_STATUS.CONTACTED].includes(lead.status)) {
    throw ApiError.badRequest('Lead cannot be submitted for approval in its current status');
  }

  await lead.update({
    status: LEAD_STATUS.PENDING_APPROVAL,
    approval_requested_at: new Date(),
  });

  await notificationService.notifyLeadApprovalRequested(tenantId, lead, requestedByUser);

  return await getById(tenantId, leadId);
};

const approveWithPin = async (tenantId, leadId, pin, scope = {}, actor = {}) => {
  const where = { id: leadId, tenant_id: tenantId };
  if (scope.scopeUserId) {
    where[Op.or] = [{ assigned_to: scope.scopeUserId }, { created_by: scope.scopeUserId }];
  }
  const lead = await db.Lead.findOne({ where });
  if (!lead) throw ApiError.notFound('Lead not found');

  const pinValid = await verifyLeadApprovalPin(tenantId, pin);
  if (!pinValid) {
    throw ApiError.forbidden('Invalid approval PIN');
  }

  await _approveLead(lead, { approvedByUserId: actor.userId });

  return await getById(tenantId, leadId);
};

const disqualify = async (tenantId, leadId, reason, scope = {}) => {
  const where = { id: leadId, tenant_id: tenantId };
  if (scope.scopeUserId) {
    where[Op.or] = [{ assigned_to: scope.scopeUserId }, { created_by: scope.scopeUserId }];
  }
  const lead = await db.Lead.findOne({ where });
  if (!lead) throw ApiError.notFound('Lead not found');

  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Cannot disqualify converted lead');
  }

  await lead.update({
    status: LEAD_STATUS.DISQUALIFIED,
    disqualification_reason: reason,
    approval_requested_at: null,
  });

  return await getById(tenantId, leadId);
};

const convertToDeal = async (tenantId, leadId, dealData, scope = {}) => {
  const where = { id: leadId, tenant_id: tenantId };
  if (scope.scopeUserId) {
    where[Op.or] = [{ assigned_to: scope.scopeUserId }, { created_by: scope.scopeUserId }];
  }
  const lead = await db.Lead.findOne({ where });

  if (!lead) throw ApiError.notFound('Lead not found');
  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Lead already converted');
  }

  await lead.update({
    status: LEAD_STATUS.CONVERTED,
    converted_at: new Date(),
  });

  return await getById(tenantId, leadId);
};

const remove = async (tenantId, leadId, scope = {}) => {
  const where = { id: leadId, tenant_id: tenantId };
  if (scope.scopeUserId) {
    where[Op.or] = [{ assigned_to: scope.scopeUserId }, { created_by: scope.scopeUserId }];
  }
  const lead = await db.Lead.findOne({ where });
  if (!lead) throw ApiError.notFound('Lead not found');

  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Cannot delete converted lead');
  }

  await lead.destroy();
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  qualify,
  requestApproval,
  approveWithPin,
  disqualify,
  convertToDeal,
  remove,
};
