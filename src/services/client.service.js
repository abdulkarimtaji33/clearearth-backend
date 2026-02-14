/**
 * Client Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { RECORD_STATUS } = require('../constants');

/**
 * Get all clients with filters
 */
const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, clientType } = filters;

  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { company_name: { [Op.like]: `%${search}%` } },
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { client_code: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;
  if (clientType) where.client_type = clientType;

  const { count, rows } = await db.Client.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { clients: rows, total: count };
};

/**
 * Get client by ID
 */
const getById = async (tenantId, clientId) => {
  const client = await db.Client.findOne({
    where: { id: clientId, tenant_id: tenantId },
    include: [
      {
        model: db.Deal,
        as: 'deals',
        limit: 10,
        order: [['created_at', 'DESC']],
      },
      {
        model: db.Invoice,
        as: 'invoices',
        limit: 10,
        order: [['created_at', 'DESC']],
      },
    ],
  });

  if (!client) throw ApiError.notFound('Client not found');
  return client;
};

/**
 * Create new client
 */
const create = async (tenantId, userId, data) => {
  const {
    clientType,
    companyName,
    firstName,
    lastName,
    email,
    phone,
    mobile,
    address,
    city,
    state,
    country,
    postalCode,
    trnNumber,
    licenseNumber,
    contactPersonName,
    contactPersonPhone,
    contactPersonEmail,
    serviceCategories,
    creditLimit,
    paymentTermsDays,
    notes,
  } = data;

  // Check duplicate email
  if (email) {
    const existingClient = await db.Client.findOne({
      where: { tenant_id: tenantId, email },
    });
    if (existingClient) throw ApiError.conflict('Email already exists');
  }

  // Generate client code
  const clientCode = generateReferenceNumber('CLT');

  const client = await db.Client.create({
    tenant_id: tenantId,
    client_code: clientCode,
    client_type: clientType || 'company',
    company_name: companyName,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    mobile,
    address,
    city,
    state,
    country: country || 'UAE',
    postal_code: postalCode,
    trn_number: trnNumber,
    license_number: licenseNumber,
    contact_person_name: contactPersonName,
    contact_person_phone: contactPersonPhone,
    contact_person_email: contactPersonEmail,
    service_categories: serviceCategories || [],
    credit_limit: creditLimit || 0,
    payment_terms_days: paymentTermsDays || 30,
    notes,
    status: RECORD_STATUS.PENDING,
  });

  return await getById(tenantId, client.id);
};

/**
 * Update client
 */
const update = async (tenantId, clientId, data) => {
  const client = await db.Client.findOne({
    where: { id: clientId, tenant_id: tenantId },
  });

  if (!client) throw ApiError.notFound('Client not found');

  // Check if trying to update email to existing one
  if (data.email && data.email !== client.email) {
    const existingClient = await db.Client.findOne({
      where: { tenant_id: tenantId, email: data.email },
    });
    if (existingClient) throw ApiError.conflict('Email already exists');
  }

  await client.update({
    client_type: data.clientType !== undefined ? data.clientType : client.client_type,
    company_name: data.companyName !== undefined ? data.companyName : client.company_name,
    first_name: data.firstName !== undefined ? data.firstName : client.first_name,
    last_name: data.lastName !== undefined ? data.lastName : client.last_name,
    email: data.email !== undefined ? data.email : client.email,
    phone: data.phone !== undefined ? data.phone : client.phone,
    mobile: data.mobile !== undefined ? data.mobile : client.mobile,
    address: data.address !== undefined ? data.address : client.address,
    city: data.city !== undefined ? data.city : client.city,
    state: data.state !== undefined ? data.state : client.state,
    country: data.country !== undefined ? data.country : client.country,
    postal_code: data.postalCode !== undefined ? data.postalCode : client.postal_code,
    trn_number: data.trnNumber !== undefined ? data.trnNumber : client.trn_number,
    license_number: data.licenseNumber !== undefined ? data.licenseNumber : client.license_number,
    contact_person_name: data.contactPersonName !== undefined ? data.contactPersonName : client.contact_person_name,
    contact_person_phone: data.contactPersonPhone !== undefined ? data.contactPersonPhone : client.contact_person_phone,
    contact_person_email: data.contactPersonEmail !== undefined ? data.contactPersonEmail : client.contact_person_email,
    service_categories: data.serviceCategories !== undefined ? data.serviceCategories : client.service_categories,
    credit_limit: data.creditLimit !== undefined ? data.creditLimit : client.credit_limit,
    payment_terms_days: data.paymentTermsDays !== undefined ? data.paymentTermsDays : client.payment_terms_days,
    notes: data.notes !== undefined ? data.notes : client.notes,
  });

  return await getById(tenantId, clientId);
};

/**
 * Approve client
 */
const approve = async (tenantId, clientId, userId) => {
  const client = await db.Client.findOne({
    where: { id: clientId, tenant_id: tenantId },
  });

  if (!client) throw ApiError.notFound('Client not found');
  if (client.status !== RECORD_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending clients can be approved');
  }

  await client.update({
    status: RECORD_STATUS.ACTIVE,
    approved_by: userId,
    approved_at: new Date(),
  });

  return await getById(tenantId, clientId);
};

/**
 * Deactivate client
 */
const deactivate = async (tenantId, clientId) => {
  const client = await db.Client.findOne({
    where: { id: clientId, tenant_id: tenantId },
  });

  if (!client) throw ApiError.notFound('Client not found');

  await client.update({ status: RECORD_STATUS.INACTIVE });
  return await getById(tenantId, clientId);
};

/**
 * Activate client
 */
const activate = async (tenantId, clientId) => {
  const client = await db.Client.findOne({
    where: { id: clientId, tenant_id: tenantId },
  });

  if (!client) throw ApiError.notFound('Client not found');

  await client.update({ status: RECORD_STATUS.ACTIVE });
  return await getById(tenantId, clientId);
};

/**
 * Delete client (soft delete)
 */
const remove = async (tenantId, clientId) => {
  const client = await db.Client.findOne({
    where: { id: clientId, tenant_id: tenantId },
  });

  if (!client) throw ApiError.notFound('Client not found');

  // Check if client has associated deals or invoices
  const dealsCount = await db.Deal.count({
    where: { tenant_id: tenantId, client_id: clientId },
  });

  if (dealsCount > 0) {
    throw ApiError.badRequest('Cannot delete client with associated deals');
  }

  await client.destroy();
};

/**
 * Get client statistics
 */
const getStatistics = async (tenantId, clientId) => {
  const [totalDeals, totalInvoices, totalRevenue, outstandingAmount] = await Promise.all([
    db.Deal.count({
      where: { tenant_id: tenantId, client_id: clientId },
    }),
    db.Invoice.count({
      where: { tenant_id: tenantId, client_id: clientId },
    }),
    db.Invoice.sum('total_amount', {
      where: {
        tenant_id: tenantId,
        client_id: clientId,
        status: { [Op.in]: ['paid', 'partially_paid'] },
      },
    }),
    db.Invoice.sum('balance_amount', {
      where: {
        tenant_id: tenantId,
        client_id: clientId,
        status: { [Op.notIn]: ['paid', 'cancelled', 'void'] },
      },
    }),
  ]);

  return {
    totalDeals: totalDeals || 0,
    totalInvoices: totalInvoices || 0,
    totalRevenue: totalRevenue || 0,
    outstandingAmount: outstandingAmount || 0,
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  approve,
  deactivate,
  activate,
  remove,
  getStatistics,
};
