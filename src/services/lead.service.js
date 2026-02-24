const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { LEAD_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, assignedTo, source, companyId, contactId, productServiceId } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { lead_number: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (assignedTo) where.assigned_to = assignedTo;
  if (source) where.source = source;
  if (companyId) where.company_id = companyId;
  if (contactId) where.contact_id = contactId;
  if (productServiceId) where.product_service_id = productServiceId;

  const { count, rows } = await db.Lead.findAndCountAll({
    where,
    include: [
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name', 'email', 'phone'], required: false },
      { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'], required: false },
      { model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'category'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { leads: rows, total: count };
};

const getById = async (tenantId, leadId) => {
  const lead = await db.Lead.findOne({
    where: { id: leadId, tenant_id: tenantId },
    include: [
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name', 'email', 'phone'], required: false },
      { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name', 'email', 'phone'], required: false },
      { model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'category'], required: false },
    ],
  });
  if (!lead) throw ApiError.notFound('Lead not found');
  return lead;
};

const create = async (tenantId, data) => {
  const leadNumber = generateReferenceNumber('LEAD');

  // Validate company and contact if provided
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
    lead_number: leadNumber,
    company_id: data.companyId || null,
    contact_id: data.contactId || null,
    email: data.email,
    phone: data.phone,
    source: data.source,
    service_interest: data.serviceInterest || [],
    product_service_id: data.productServiceId || null,
    estimated_value: data.estimatedValue,
    notes: data.notes,
    assigned_to: data.assignedTo,
    status: LEAD_STATUS.NEW,
  });

  return await getById(tenantId, lead.id);
};

const update = async (tenantId, leadId, data) => {
  const lead = await db.Lead.findOne({
    where: { id: leadId, tenant_id: tenantId },
  });
  if (!lead) throw ApiError.notFound('Lead not found');

  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Cannot update converted lead');
  }

  // Validate company and contact if provided
  if (data.companyId !== undefined && data.companyId !== null) {
    const company = await db.Company.findOne({ where: { id: data.companyId, tenant_id: tenantId } });
    if (!company) throw ApiError.notFound('Company not found');
  }

  if (data.contactId !== undefined && data.contactId !== null) {
    const contact = await db.Contact.findOne({ where: { id: data.contactId, tenant_id: tenantId } });
    if (!contact) throw ApiError.notFound('Contact not found');
  }

  await lead.update({
    company_id: data.companyId !== undefined ? data.companyId : lead.company_id,
    contact_id: data.contactId !== undefined ? data.contactId : lead.contact_id,
    email: data.email !== undefined ? data.email : lead.email,
    phone: data.phone !== undefined ? data.phone : lead.phone,
    source: data.source !== undefined ? data.source : lead.source,
    service_interest: data.serviceInterest !== undefined ? data.serviceInterest : lead.service_interest,
    product_service_id: data.productServiceId !== undefined ? data.productServiceId : lead.product_service_id,
    estimated_value: data.estimatedValue !== undefined ? data.estimatedValue : lead.estimated_value,
    notes: data.notes !== undefined ? data.notes : lead.notes,
    assigned_to: data.assignedTo !== undefined ? data.assignedTo : lead.assigned_to,
  });

  return await getById(tenantId, leadId);
};

const qualify = async (tenantId, leadId, notes) => {
  const lead = await db.Lead.findOne({
    where: { id: leadId, tenant_id: tenantId },
  });
  if (!lead) throw ApiError.notFound('Lead not found');

  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Lead already converted');
  }

  await lead.update({
    status: LEAD_STATUS.QUALIFIED,
    qualification_notes: notes,
  });

  return await getById(tenantId, leadId);
};

const disqualify = async (tenantId, leadId, reason) => {
  const lead = await db.Lead.findOne({
    where: { id: leadId, tenant_id: tenantId },
  });
  if (!lead) throw ApiError.notFound('Lead not found');

  if (lead.status === LEAD_STATUS.CONVERTED) {
    throw ApiError.badRequest('Cannot disqualify converted lead');
  }

  await lead.update({
    status: LEAD_STATUS.DISQUALIFIED,
    disqualification_reason: reason,
  });

  return await getById(tenantId, leadId);
};

const convertToDeal = async (tenantId, leadId, dealData) => {
  // Deals module has been removed
  // This function now simply marks the lead as converted
  const lead = await db.Lead.findOne({
    where: { id: leadId, tenant_id: tenantId },
  });

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

const remove = async (tenantId, leadId) => {
  const lead = await db.Lead.findOne({
    where: { id: leadId, tenant_id: tenantId },
  });
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
  disqualify,
  convertToDeal,
  remove,
};
