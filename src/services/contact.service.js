/**
 * Contact Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { getSalesRelatedContactIds } = require('../utils/scopeHelper');
const { Op } = db.Sequelize;
const { applyCreatedAtFilter } = require('../utils/dateRangeWhere');

const _buildContactWhereForSales = async (tenantId, contactId, scopeUserId) => {
  const where = { id: contactId, tenant_id: tenantId };
  if (scopeUserId) {
    const relatedIds = await getSalesRelatedContactIds(db, tenantId, scopeUserId);
    if (!relatedIds.includes(parseInt(contactId, 10))) where.created_by = scopeUserId;
  }
  return where;
};

const _resolveContactType = (companyId, supplierId, explicitType) => {
  const hasC = companyId != null && companyId !== '';
  const hasS = supplierId != null && supplierId !== '';
  if (explicitType === 'both' || (hasC && hasS)) return 'both';
  if (hasS) return 'vendors';
  if (hasC) return 'clients';
  if (explicitType === 'clients' || explicitType === 'vendors' || explicitType === 'both') return explicitType;
  return null;
};

const _normalizeOptionalId = (value) => {
  if (value == null || value === '') return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

const _syncCompanyContactLink = async (contactId, prevCompanyId, nextCompanyId) => {
  const cid = parseInt(contactId, 10);
  const prev = _normalizeOptionalId(prevCompanyId);
  const next = _normalizeOptionalId(nextCompanyId);
  if (prev === next) return;

  await db.CompanyContact.destroy({ where: { contact_id: cid }, force: true });
  if (next) {
    await db.CompanyContact.create({
      company_id: next,
      contact_id: cid,
      role: null,
      is_primary: true,
    });
  }
};

const _syncSupplierContactLink = async (contactId, prevSupplierId, nextSupplierId) => {
  const cid = parseInt(contactId, 10);
  const prev = _normalizeOptionalId(prevSupplierId);
  const next = _normalizeOptionalId(nextSupplierId);
  if (prev === next) return;

  await db.SupplierContact.destroy({ where: { contact_id: cid }, force: true });
  if (next) {
    await db.SupplierContact.create({
      supplier_id: next,
      contact_id: cid,
      role: null,
      is_primary: true,
    });
  }
};

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, designation, department, companyId, supplierId, contactType, scopeUserId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  if (scopeUserId) {
    const relatedIds = await getSalesRelatedContactIds(db, tenantId, scopeUserId);
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { created_by: scopeUserId },
        ...(relatedIds.length ? [{ id: { [Op.in]: relatedIds } }] : []),
      ],
    });
  }
  if (search) {
    const s = String(search).trim();
    const orConditions = [
      { first_name: { [Op.like]: `%${s}%` } },
      { last_name: { [Op.like]: `%${s}%` } },
      { email: { [Op.like]: `%${s}%` } },
      { phone: { [Op.like]: `%${s}%` } },
      { contact_code: { [Op.like]: `%${s}%` } },
    ];
    const n = parseInt(s, 10);
    if (String(n) === s && n > 0) orConditions.push({ id: n });
    where[Op.or] = orConditions;
  }

  if (status) where.status = status;
  if (contactType === 'clients') {
    where.contact_type = { [Op.in]: ['clients', 'both'] };
  } else if (contactType === 'vendors') {
    where.contact_type = { [Op.in]: ['vendors', 'both'] };
  } else if (contactType) {
    where.contact_type = contactType;
  }
  if (designation) where.designation = designation;
  if (department) where.department = { [Op.like]: `%${department}%` };
  if (companyId) where.company_id = companyId;
  if (supplierId) where.supplier_id = supplierId;
  applyCreatedAtFilter(where, dateFrom, dateTo);

  const { count, rows } = await db.Contact.findAndCountAll({
    where,
    include: [
      {
        model: db.Company,
        as: 'company',
        attributes: ['id', 'company_name'],
        required: false,
      },
      {
        model: db.Supplier,
        as: 'supplier',
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

const getById = async (tenantId, contactId, scope = {}) => {
  const where = await _buildContactWhereForSales(tenantId, contactId, scope.scopeUserId);
  const contact = await db.Contact.findOne({
    where,
    include: [
      {
        model: db.Company,
        as: 'company',
        attributes: ['id', 'company_name'],
        required: false,
      },
      {
        model: db.Supplier,
        as: 'supplier',
        attributes: ['id', 'company_name'],
        required: false,
      },
    ],
  });
  if (!contact) throw ApiError.notFound('Contact not found');
  return contact;
};

const create = async (tenantId, data, scope = {}) => {
  const { firstName, lastName, email, phone, mobile, designation, jobTitle, department, companyId, supplierId, notes, contactType, setAsPrimaryContact } = data;

  if (email) {
    const existing = await db.Contact.findOne({ where: { tenant_id: tenantId, email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  let company = null;
  let supplier = null;
  if (companyId) {
    company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
    if (!company) throw ApiError.notFound('Company not found');
  }
  if (supplierId) {
    supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
    if (!supplier) throw ApiError.notFound('Supplier not found');
  }

  const resolvedContactType = _resolveContactType(companyId, supplierId, contactType);

  const contact = await db.Contact.create({
    tenant_id: tenantId,
    first_name: firstName,
    last_name: lastName || null,
    email: email || null,
    phone: phone || null,
    mobile: mobile || null,
    designation: designation || null,
    job_title: jobTitle || null,
    department: department || null,
    company_id: companyId || null,
    supplier_id: supplierId || null,
    notes: notes || null,
    contact_type: resolvedContactType,
    status: 'active',
    created_by: scope.scopeUserId || null,
  });

  await contact.update({ contact_code: String(contact.id) });

  if (company && (setAsPrimaryContact || !company.primary_contact_id)) {
    await company.update({ primary_contact_id: contact.id });

    const [link, created] = await db.CompanyContact.findOrCreate({
      where: { company_id: company.id, contact_id: contact.id },
      defaults: { role: null, is_primary: true },
    });
    if (!created) {
      await link.update({ is_primary: true });
    }
  } else if (company) {
    await db.CompanyContact.findOrCreate({
      where: { company_id: company.id, contact_id: contact.id },
      defaults: { role: null, is_primary: false },
    });
  }

  if (supplier && (setAsPrimaryContact || !supplier.primary_contact_id)) {
    await supplier.update({ primary_contact_id: contact.id });
    const [link, created] = await db.SupplierContact.findOrCreate({
      where: { supplier_id: supplier.id, contact_id: contact.id },
      defaults: { role: null, is_primary: true },
    });
    if (!created) {
      await link.update({ is_primary: true });
    }
  } else if (supplier) {
    const [link, created] = await db.SupplierContact.findOrCreate({
      where: { supplier_id: supplier.id, contact_id: contact.id },
      defaults: { role: null, is_primary: false },
    });
    if (!created) {
      await link.update({ is_primary: false });
    }
  }

  return getById(tenantId, contact.id);
};

const update = async (tenantId, contactId, data, scope = {}) => {
  const where = await _buildContactWhereForSales(tenantId, contactId, scope.scopeUserId);
  const contact = await db.Contact.findOne({ where });
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
  // Validate supplier if provided
  if (data.supplierId !== undefined && data.supplierId !== null) {
    const supplier = await db.Supplier.findOne({ where: { id: data.supplierId, tenant_id: tenantId } });
    if (!supplier) throw ApiError.notFound('Supplier not found');
  }

  const newCompanyId = data.companyId !== undefined ? data.companyId : contact.company_id;
  const newSupplierId = data.supplierId !== undefined ? data.supplierId : contact.supplier_id;
  const resolvedContactType = data.contactType !== undefined
    ? _resolveContactType(newCompanyId, newSupplierId, data.contactType)
    : _resolveContactType(newCompanyId, newSupplierId, contact.contact_type);

  await contact.update({
    first_name: data.firstName !== undefined ? data.firstName : contact.first_name,
    last_name: data.lastName !== undefined ? data.lastName : contact.last_name,
    email: data.email !== undefined ? (data.email && String(data.email).trim() ? String(data.email).trim() : null) : contact.email,
    phone: data.phone !== undefined ? data.phone : contact.phone,
    mobile: data.mobile !== undefined ? data.mobile : contact.mobile,
    designation: data.designation !== undefined ? data.designation : contact.designation,
    job_title: data.jobTitle !== undefined ? data.jobTitle : contact.job_title,
    department: data.department !== undefined ? data.department : contact.department,
    company_id: data.companyId !== undefined ? data.companyId : contact.company_id,
    supplier_id: data.supplierId !== undefined ? data.supplierId : contact.supplier_id,
    notes: data.notes !== undefined ? data.notes : contact.notes,
    contact_type: resolvedContactType,
    status: data.status !== undefined ? data.status : contact.status,
  });

  // Sync junction links only when company/supplier assignment changed
  if (data.companyId !== undefined) {
    await _syncCompanyContactLink(contactId, contact.company_id, data.companyId);
  }
  if (data.supplierId !== undefined) {
    await _syncSupplierContactLink(contactId, contact.supplier_id, data.supplierId);
  }

  return getById(tenantId, contact.id);
};

const remove = async (tenantId, contactId, scope = {}) => {
  const where = await _buildContactWhereForSales(tenantId, contactId, scope.scopeUserId);
  const contact = await db.Contact.findOne({ where });
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
