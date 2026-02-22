/**
 * Company Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;

const contactInclude = {
  model: db.Contact,
  as: 'contacts',
  through: { attributes: ['id', 'role', 'is_primary'] },
  attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'job_title', 'department'],
};

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { company_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { company_code: { [Op.like]: `%${search}%` } },
      { industry_type: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;

  const { count, rows } = await db.Company.findAndCountAll({
    where,
    include: [
      {
        model: db.Contact,
        as: 'primaryContact',
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        required: false,
      },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { companies: rows, total: count };
};

const getById = async (tenantId, companyId) => {
  const company = await db.Company.findOne({
    where: { id: companyId, tenant_id: tenantId },
    include: [
      {
        model: db.Contact,
        as: 'primaryContact',
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone'],
        required: false,
      },
      {
        ...contactInclude,
        required: false,
      },
    ],
  });
  if (!company) throw ApiError.notFound('Company not found');
  return company;
};

const create = async (tenantId, data) => {
  const {
    companyName, primaryContactId, industryType, website,
    email, phone, country, city, address, notes, contacts,
  } = data;

  if (email) {
    const existing = await db.Company.findOne({ where: { tenant_id: tenantId, email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  const companyCode = generateReferenceNumber('COM');

  const company = await db.Company.create({
    tenant_id: tenantId,
    company_code: companyCode,
    company_name: companyName,
    primary_contact_id: primaryContactId || null,
    industry_type: industryType || null,
    website: website || null,
    email: email || null,
    phone: phone || null,
    country: country || 'UAE',
    city: city || null,
    address: address || null,
    notes: notes || null,
    status: 'active',
  });

  if (contacts && contacts.length > 0) {
    await _upsertContactLinks(company.id, contacts);
  }

  return getById(tenantId, company.id);
};

const update = async (tenantId, companyId, data) => {
  const company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
  if (!company) throw ApiError.notFound('Company not found');

  if (data.email && data.email !== company.email) {
    const existing = await db.Company.findOne({ where: { tenant_id: tenantId, email: data.email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  await company.update({
    company_name: data.companyName !== undefined ? data.companyName : company.company_name,
    primary_contact_id: data.primaryContactId !== undefined ? data.primaryContactId : company.primary_contact_id,
    industry_type: data.industryType !== undefined ? data.industryType : company.industry_type,
    website: data.website !== undefined ? data.website : company.website,
    email: data.email !== undefined ? data.email : company.email,
    phone: data.phone !== undefined ? data.phone : company.phone,
    country: data.country !== undefined ? data.country : company.country,
    city: data.city !== undefined ? data.city : company.city,
    address: data.address !== undefined ? data.address : company.address,
    notes: data.notes !== undefined ? data.notes : company.notes,
    status: data.status !== undefined ? data.status : company.status,
  });

  if (data.contacts !== undefined) {
    await db.CompanyContact.destroy({ where: { company_id: companyId } });
    if (data.contacts.length > 0) {
      await _upsertContactLinks(companyId, data.contacts);
    }
  }

  return getById(tenantId, companyId);
};

const remove = async (tenantId, companyId) => {
  const company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
  if (!company) throw ApiError.notFound('Company not found');

  await db.CompanyContact.destroy({ where: { company_id: companyId } });
  await company.destroy();
};

const addContact = async (tenantId, companyId, contactId, role, isPrimary) => {
  const company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
  if (!company) throw ApiError.notFound('Company not found');

  const contact = await db.Contact.findOne({ where: { id: contactId, tenant_id: tenantId } });
  if (!contact) throw ApiError.notFound('Contact not found');

  const [link] = await db.CompanyContact.findOrCreate({
    where: { company_id: companyId, contact_id: contactId },
    defaults: { role: role || null, is_primary: isPrimary || false },
  });

  if (link) {
    await link.update({ role: role || link.role, is_primary: isPrimary !== undefined ? isPrimary : link.is_primary });
  }

  return getById(tenantId, companyId);
};

const removeContact = async (tenantId, companyId, contactId) => {
  const company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
  if (!company) throw ApiError.notFound('Company not found');

  await db.CompanyContact.destroy({ where: { company_id: companyId, contact_id: contactId } });

  if (company.primary_contact_id === parseInt(contactId)) {
    await company.update({ primary_contact_id: null });
  }

  return getById(tenantId, companyId);
};

async function _upsertContactLinks(companyId, contacts) {
  for (const c of contacts) {
    await db.CompanyContact.findOrCreate({
      where: { company_id: companyId, contact_id: c.contactId },
      defaults: { role: c.role || null, is_primary: c.isPrimary || false },
    }).then(([link]) => {
      return link.update({ role: c.role || null, is_primary: c.isPrimary || false });
    });
  }
}

module.exports = { getAll, getById, create, update, remove, addContact, removeContact };
