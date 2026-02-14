const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { LEAD_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, assignedTo } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { company_name: { [Op.like]: `%${search}%` } },
      { contact_person: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { lead_number: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (assignedTo) where.assigned_to = assignedTo;

  const { count, rows } = await db.Lead.findAndCountAll({
    where,
    include: [
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
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
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: db.Deal, as: 'deal' },
    ],
  });
  if (!lead) throw ApiError.notFound('Lead not found');
  return lead;
};

const create = async (tenantId, data) => {
  const leadNumber = generateReferenceNumber('LEAD');

  const lead = await db.Lead.create({
    tenant_id: tenantId,
    lead_number: leadNumber,
    company_name: data.companyName,
    contact_person: data.contactPerson,
    email: data.email,
    phone: data.phone,
    source: data.source,
    service_interest: data.serviceInterest || [],
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

  await lead.update({
    company_name: data.companyName || lead.company_name,
    contact_person: data.contactPerson || lead.contact_person,
    email: data.email || lead.email,
    phone: data.phone || lead.phone,
    source: data.source || lead.source,
    service_interest: data.serviceInterest || lead.service_interest,
    estimated_value: data.estimatedValue ?? lead.estimated_value,
    notes: data.notes || lead.notes,
    assigned_to: data.assignedTo ?? lead.assigned_to,
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
  const transaction = await db.sequelize.transaction();

  try {
    const lead = await db.Lead.findOne({
      where: { id: leadId, tenant_id: tenantId },
      transaction,
    });

    if (!lead) throw ApiError.notFound('Lead not found');
    if (lead.status === LEAD_STATUS.CONVERTED) {
      throw ApiError.badRequest('Lead already converted');
    }

    // Create or get client
    let clientId = dealData.clientId;
    if (!clientId) {
      const client = await db.Client.create(
        {
          tenant_id: tenantId,
          client_code: generateReferenceNumber('CLT'),
          client_type: 'company',
          company_name: lead.company_name,
          email: lead.email,
          phone: lead.phone,
          contact_person_name: lead.contact_person,
          status: 'pending',
        },
        { transaction }
      );
      clientId = client.id;
    }

    // Create deal
    const dealNumber = generateReferenceNumber('DEAL');
    const deal = await db.Deal.create(
      {
        tenant_id: tenantId,
        deal_number: dealNumber,
        lead_id: leadId,
        client_id: clientId,
        deal_type: dealData.dealType,
        title: dealData.title || `Deal from ${lead.company_name}`,
        description: dealData.description || lead.notes,
        service_type: lead.service_interest,
        expected_value: dealData.expectedValue || lead.estimated_value,
        currency: dealData.currency || 'AED',
        expected_closure_date: dealData.expectedClosureDate,
        probability: dealData.probability || 50,
        assigned_to: dealData.assignedTo || lead.assigned_to,
        current_stage: 'sales',
        current_department: 'sales',
        handler_user_id: dealData.assignedTo || lead.assigned_to,
        status: 'draft',
      },
      { transaction }
    );

    // Create initial deal stage
    await db.DealStage.create(
      {
        tenant_id: tenantId,
        deal_id: deal.id,
        stage_name: 'sales',
        department: 'sales',
        handler_user_id: deal.handler_user_id,
        started_at: new Date(),
        is_completed: false,
      },
      { transaction }
    );

    // Update lead
    await lead.update(
      {
        status: LEAD_STATUS.CONVERTED,
        converted_to_deal_id: deal.id,
        converted_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

    return await db.Deal.findByPk(deal.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.Lead, as: 'lead' },
        { model: db.User, as: 'assignedUser' },
      ],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
