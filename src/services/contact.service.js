/**
 * Contact Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, designation, department, companyId } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { contact_code: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;
  if (designation) where.designation = designation;
  if (department) where.department = { [Op.like]: `%${department}%` };
  if (companyId) where.company_id = companyId;

  const { count, rows } = await db.Contact.findAndCountAll({
    where,
    include: [
      {
        model: db.Company,
        as: 'company',
        attributes: ['id', 'company_name'],
        required: false,
      },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { contacts: rows, total: count };
};

const getById = async (tenantId, contactId) => {
  const contact = await db.Contact.findOne({
    where: { id: contactId, tenant_id: tenantId },
    include: [
      {
        model: db.Company,
        as: 'company',
        attributes: ['id', 'company_name'],
        required: false,
      },
    ],
  });
  if (!contact) throw ApiError.notFound('Contact not found');
  return contact;
};

const create = async (tenantId, data) => {
  const { firstName, lastName, email, phone, mobile, designation, jobTitle, department, companyId, notes, setAsPrimaryContact } = data;

  if (email) {
    const existing = await db.Contact.findOne({ where: { tenant_id: tenantId, email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  let company = null;
  if (companyId) {
    company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
    if (!company) throw ApiError.notFound('Company not found');
  }

  const contactCode = generateReferenceNumber('CON');

  const contact = await db.Contact.create({
    tenant_id: tenantId,
    contact_code: contactCode,
    first_name: firstName,
    last_name: lastName,
    email: email || null,
    phone: phone || null,
    mobile: mobile || null,
    designation: designation || null,
    job_title: jobTitle || null,
    department: department || null,
    company_id: companyId || null,
    notes: notes || null,
    status: 'active',
  });

  if (company && (setAsPrimaryContact || !company.primary_contact_id)) {
    await company.update({ primary_contact_id: contact.id });
    
    const [link, created] = await db.CompanyContact.findOrCreate({
      where: { company_id: company.id, contact_id: contact.id },
      defaults: { role: null, is_primary: true },
    });
    if (!created) {
      await link.update({ is_primary: true });
    }
  }

  return getById(tenantId, contact.id);
};

const update = async (tenantId, contactId, data) => {
  const contact = await db.Contact.findOne({ where: { id: contactId, tenant_id: tenantId } });
  if (!contact) throw ApiError.notFound('Contact not found');

  if (data.email && data.email !== contact.email) {
    const existing = await db.Contact.findOne({ where: { tenant_id: tenantId, email: data.email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  // Validate company if provided
  if (data.companyId !== undefined && data.companyId !== null) {
    const company = await db.Company.findOne({ where: { id: data.companyId, tenant_id: tenantId } });
    if (!company) throw ApiError.notFound('Company not found');
  }

  await contact.update({
    first_name: data.firstName !== undefined ? data.firstName : contact.first_name,
    last_name: data.lastName !== undefined ? data.lastName : contact.last_name,
    email: data.email !== undefined ? data.email : contact.email,
    phone: data.phone !== undefined ? data.phone : contact.phone,
    mobile: data.mobile !== undefined ? data.mobile : contact.mobile,
    designation: data.designation !== undefined ? data.designation : contact.designation,
    job_title: data.jobTitle !== undefined ? data.jobTitle : contact.job_title,
    department: data.department !== undefined ? data.department : contact.department,
    company_id: data.companyId !== undefined ? data.companyId : contact.company_id,
    notes: data.notes !== undefined ? data.notes : contact.notes,
    status: data.status !== undefined ? data.status : contact.status,
  });

  return getById(tenantId, contact.id);
};

const remove = async (tenantId, contactId) => {
  const contact = await db.Contact.findOne({ where: { id: contactId, tenant_id: tenantId } });
  if (!contact) throw ApiError.notFound('Contact not found');

  const companyLinks = await db.CompanyContact.count({ where: { contact_id: contactId } });
  if (companyLinks > 0) {
    throw ApiError.badRequest('Cannot delete contact linked to companies. Remove from companies first.');
  }

  const supplierLinks = await db.SupplierContact.count({ where: { contact_id: contactId } });
  if (supplierLinks > 0) {
    throw ApiError.badRequest('Cannot delete contact linked to suppliers. Remove from suppliers first.');
  }

  await contact.destroy();
};

module.exports = { getAll, getById, create, update, remove };
