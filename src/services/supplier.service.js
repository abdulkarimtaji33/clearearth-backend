/**
 * Supplier Service
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
      { supplier_code: { [Op.like]: `%${search}%` } },
      { industry_type: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;

  const { count, rows } = await db.Supplier.findAndCountAll({
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

  return { suppliers: rows, total: count };
};

const getById = async (tenantId, supplierId) => {
  const supplier = await db.Supplier.findOne({
    where: { id: supplierId, tenant_id: tenantId },
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
  if (!supplier) throw ApiError.notFound('Supplier not found');
  return supplier;
};

const create = async (tenantId, data) => {
  const {
    companyName, primaryContactId, industryType, website,
    email, phone, country, city, address, notes, contacts,
  } = data;

  if (email) {
    const existing = await db.Supplier.findOne({ where: { tenant_id: tenantId, email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  const supplierCode = generateReferenceNumber('SUP');

  const supplier = await db.Supplier.create({
    tenant_id: tenantId,
    supplier_code: supplierCode,
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
    await _upsertContactLinks(supplier.id, contacts);
  }

  return getById(tenantId, supplier.id);
};

const update = async (tenantId, supplierId, data) => {
  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  if (data.email && data.email !== supplier.email) {
    const existing = await db.Supplier.findOne({ where: { tenant_id: tenantId, email: data.email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  await supplier.update({
    company_name: data.companyName !== undefined ? data.companyName : supplier.company_name,
    primary_contact_id: data.primaryContactId !== undefined ? data.primaryContactId : supplier.primary_contact_id,
    industry_type: data.industryType !== undefined ? data.industryType : supplier.industry_type,
    website: data.website !== undefined ? data.website : supplier.website,
    email: data.email !== undefined ? data.email : supplier.email,
    phone: data.phone !== undefined ? data.phone : supplier.phone,
    country: data.country !== undefined ? data.country : supplier.country,
    city: data.city !== undefined ? data.city : supplier.city,
    address: data.address !== undefined ? data.address : supplier.address,
    notes: data.notes !== undefined ? data.notes : supplier.notes,
    status: data.status !== undefined ? data.status : supplier.status,
  });

  if (data.contacts !== undefined) {
    await db.SupplierContact.destroy({ where: { supplier_id: supplierId } });
    if (data.contacts.length > 0) {
      await _upsertContactLinks(supplierId, data.contacts);
    }
  }

  return getById(tenantId, supplierId);
};

const remove = async (tenantId, supplierId) => {
  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  await db.SupplierContact.destroy({ where: { supplier_id: supplierId } });
  await supplier.destroy();
};

const addContact = async (tenantId, supplierId, contactId, role, isPrimary) => {
  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  const contact = await db.Contact.findOne({ where: { id: contactId, tenant_id: tenantId } });
  if (!contact) throw ApiError.notFound('Contact not found');

  const [link] = await db.SupplierContact.findOrCreate({
    where: { supplier_id: supplierId, contact_id: contactId },
    defaults: { role: role || null, is_primary: isPrimary || false },
  });

  if (link) {
    await link.update({ role: role || link.role, is_primary: isPrimary !== undefined ? isPrimary : link.is_primary });
  }

  return getById(tenantId, supplierId);
};

const removeContact = async (tenantId, supplierId, contactId) => {
  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
  if (!supplier) throw ApiError.notFound('Supplier not found');

  await db.SupplierContact.destroy({ where: { supplier_id: supplierId, contact_id: contactId } });

  if (supplier.primary_contact_id === parseInt(contactId)) {
    await supplier.update({ primary_contact_id: null });
  }

  return getById(tenantId, supplierId);
};

async function _upsertContactLinks(supplierId, contacts) {
  for (const c of contacts) {
    await db.SupplierContact.findOrCreate({
      where: { supplier_id: supplierId, contact_id: c.contactId },
      defaults: { role: c.role || null, is_primary: c.isPrimary || false },
    }).then(([link]) => {
      return link.update({ role: c.role || null, is_primary: c.isPrimary || false });
    });
  }
}

module.exports = { getAll, getById, create, update, remove, addContact, removeContact };
