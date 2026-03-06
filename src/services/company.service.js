/**
 * Company Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { getSalesRelatedCompanyIds } = require('../utils/scopeHelper');
const { Op } = db.Sequelize;

const contactInclude = {
  model: db.Contact,
  as: 'contacts',
  through: { attributes: ['id', 'role', 'is_primary'] },
  attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'job_title', 'department'],
};

const _buildCompanyWhereForSales = async (tenantId, companyId, scopeUserId) => {
  const where = { id: companyId, tenant_id: tenantId };
  if (scopeUserId) {
    const relatedIds = await getSalesRelatedCompanyIds(db, tenantId, scopeUserId);
    if (!relatedIds.includes(parseInt(companyId, 10))) where.created_by = scopeUserId;
  }
  return where;
};

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, industryType, country, city, contactId, scopeUserId } = filters;
  const where = { tenant_id: tenantId };

  if (scopeUserId) {
    const relatedIds = await getSalesRelatedCompanyIds(db, tenantId, scopeUserId);
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { created_by: scopeUserId },
        ...(relatedIds.length ? [{ id: { [Op.in]: relatedIds } }] : []),
      ],
    });
  }
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
  if (industryType) where.industry_type = industryType;
  if (country) where.country = country;
  if (city) where.city = city;
  if (contactId) where.primary_contact_id = contactId;

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

const getById = async (tenantId, companyId, scope = {}) => {
  const where = await _buildCompanyWhereForSales(tenantId, companyId, scope.scopeUserId);
  const company = await db.Company.findOne({
    where,
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
      {
        model: db.Deal,
        as: 'deals',
        attributes: ['id', 'deal_number', 'title', 'description', 'subtotal', 'vat_amount', 'total', 'currency', 'deal_date', 'status', 'payment_status'],
        required: false,
      },
    ],
  });
  if (!company) throw ApiError.notFound('Company not found');
  return company;
};

const create = async (tenantId, data, scope = {}) => {
  const {
    companyName, primaryContactId, industryType, website,
    email, phone, country, city, address, notes, contacts, type, vatNumber,
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
    type: type || 'organization',
    vat_number: vatNumber || null,
    created_by: scope.scopeUserId || null,
  });

  if (contacts && contacts.length > 0) {
    await _upsertContactLinks(company.id, contacts);
  }

  // Always ensure primary contact is in company_contacts after linked contacts are created
  if (primaryContactId) {
    await db.Contact.update(
      { company_id: company.id },
      { where: { id: primaryContactId, tenant_id: tenantId } }
    );
    const [link, created] = await db.CompanyContact.findOrCreate({
      where: { company_id: company.id, contact_id: primaryContactId },
      defaults: { role: null, is_primary: true },
    });
    if (!created) {
      await link.update({ is_primary: true });
    }
  }

  return getById(tenantId, company.id);
};

const update = async (tenantId, companyId, data, scope = {}) => {
  const where = await _buildCompanyWhereForSales(tenantId, companyId, scope.scopeUserId);
  const company = await db.Company.findOne({ where });
  if (!company) throw ApiError.notFound('Company not found');

  if (data.email && data.email !== company.email) {
    const existing = await db.Company.findOne({ where: { tenant_id: tenantId, email: data.email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  const oldPrimaryContactId = company.primary_contact_id;
  const newPrimaryContactId = data.primaryContactId !== undefined ? data.primaryContactId : company.primary_contact_id;

  await company.update({
    company_name: data.companyName !== undefined ? data.companyName : company.company_name,
    primary_contact_id: newPrimaryContactId,
    industry_type: data.industryType !== undefined ? data.industryType : company.industry_type,
    website: data.website !== undefined ? data.website : company.website,
    email: data.email !== undefined ? data.email : company.email,
    phone: data.phone !== undefined ? data.phone : company.phone,
    vat_number: data.vatNumber !== undefined ? data.vatNumber || null : company.vat_number,
    country: data.country !== undefined ? data.country : company.country,
    city: data.city !== undefined ? data.city : company.city,
    address: data.address !== undefined ? data.address : company.address,
    notes: data.notes !== undefined ? data.notes : company.notes,
    status: data.status !== undefined ? data.status : company.status,
    type: data.type !== undefined ? data.type : company.type,
  });

  // Clear old primary contact's company_id if changed
  if (oldPrimaryContactId && oldPrimaryContactId !== newPrimaryContactId) {
    await db.Contact.update(
      { company_id: null },
      { where: { id: oldPrimaryContactId, tenant_id: tenantId } }
    );
  }

  // Rebuild linked contacts (destroy all, re-insert from form)
  if (data.contacts !== undefined) {
    await db.CompanyContact.destroy({ where: { company_id: companyId }, force: true });
    if (data.contacts.length > 0) {
      await _upsertContactLinks(companyId, data.contacts);
    }
  }

  // Always ensure primary contact is in company_contacts with is_primary=true
  if (newPrimaryContactId) {
    await db.Contact.update(
      { company_id: companyId },
      { where: { id: newPrimaryContactId, tenant_id: tenantId } }
    );
    const [link, created] = await db.CompanyContact.findOrCreate({
      where: { company_id: companyId, contact_id: newPrimaryContactId },
      defaults: { role: null, is_primary: true },
    });
    if (!created) {
      await link.update({ is_primary: true });
    }
  }

  return getById(tenantId, companyId);
};

const remove = async (tenantId, companyId, scope = {}) => {
  const where = await _buildCompanyWhereForSales(tenantId, companyId, scope.scopeUserId);
  const company = await db.Company.findOne({ where });
  if (!company) throw ApiError.notFound('Company not found');

  await db.CompanyContact.destroy({ where: { company_id: companyId } });
  await company.destroy();
};

const addContact = async (tenantId, companyId, contactId, role, isPrimary, scope = {}) => {
  const where = await _buildCompanyWhereForSales(tenantId, companyId, scope.scopeUserId);
  const company = await db.Company.findOne({ where });
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

const removeContact = async (tenantId, companyId, contactId, scope = {}) => {
  const where = await _buildCompanyWhereForSales(tenantId, companyId, scope.scopeUserId);
  const company = await db.Company.findOne({ where });
  if (!company) throw ApiError.notFound('Company not found');

  await db.CompanyContact.destroy({ where: { company_id: companyId, contact_id: contactId } });

  if (company.primary_contact_id === parseInt(contactId)) {
    await company.update({ primary_contact_id: null });
  }

  return getById(tenantId, companyId);
};

async function _upsertContactLinks(companyId, contacts) {
  for (const c of contacts) {
    const [link, created] = await db.CompanyContact.findOrCreate({
      where: { company_id: companyId, contact_id: c.contactId },
      defaults: { role: c.role || null, is_primary: c.isPrimary || false },
    });
    
    if (!created) {
      await link.update({ role: c.role || null, is_primary: c.isPrimary || false });
    }
  }
}

module.exports = { getAll, getById, create, update, remove, addContact, removeContact };
