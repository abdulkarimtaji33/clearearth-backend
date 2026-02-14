/**
 * Vendor Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { RECORD_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, vendorType } = filters;

  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { company_name: { [Op.like]: `%${search}%` } },
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { vendor_code: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;
  if (vendorType) where.vendor_type = vendorType;

  const { count, rows } = await db.Vendor.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { vendors: rows, total: count };
};

const getById = async (tenantId, vendorId) => {
  const vendor = await db.Vendor.findOne({
    where: { id: vendorId, tenant_id: tenantId },
  });

  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vendor;
};

const create = async (tenantId, userId, data) => {
  if (data.email) {
    const existing = await db.Vendor.findOne({
      where: { tenant_id: tenantId, email: data.email },
    });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  const vendorCode = generateReferenceNumber('VEN');

  const vendor = await db.Vendor.create({
    tenant_id: tenantId,
    vendor_code: vendorCode,
    vendor_type: data.vendorType || 'company',
    company_name: data.companyName,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    mobile: data.mobile,
    address: data.address,
    city: data.city,
    state: data.state,
    country: data.country || 'UAE',
    postal_code: data.postalCode,
    trn_number: data.trnNumber,
    license_number: data.licenseNumber,
    contact_person_name: data.contactPersonName,
    contact_person_phone: data.contactPersonPhone,
    contact_person_email: data.contactPersonEmail,
    service_categories: data.serviceCategories || [],
    payment_terms_days: data.paymentTermsDays || 30,
    bank_name: data.bankName,
    bank_account_number: data.bankAccountNumber,
    bank_iban: data.bankIban,
    bank_swift_code: data.bankSwiftCode,
    notes: data.notes,
    status: RECORD_STATUS.PENDING,
  });

  return await getById(tenantId, vendor.id);
};

const update = async (tenantId, vendorId, data) => {
  const vendor = await getById(tenantId, vendorId);

  if (data.email && data.email !== vendor.email) {
    const existing = await db.Vendor.findOne({
      where: { tenant_id: tenantId, email: data.email },
    });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  await vendor.update({
    vendor_type: data.vendorType !== undefined ? data.vendorType : vendor.vendor_type,
    company_name: data.companyName !== undefined ? data.companyName : vendor.company_name,
    first_name: data.firstName !== undefined ? data.firstName : vendor.first_name,
    last_name: data.lastName !== undefined ? data.lastName : vendor.last_name,
    email: data.email !== undefined ? data.email : vendor.email,
    phone: data.phone !== undefined ? data.phone : vendor.phone,
    mobile: data.mobile !== undefined ? data.mobile : vendor.mobile,
    address: data.address !== undefined ? data.address : vendor.address,
    city: data.city !== undefined ? data.city : vendor.city,
    state: data.state !== undefined ? data.state : vendor.state,
    country: data.country !== undefined ? data.country : vendor.country,
    postal_code: data.postalCode !== undefined ? data.postalCode : vendor.postal_code,
    trn_number: data.trnNumber !== undefined ? data.trnNumber : vendor.trn_number,
    license_number: data.licenseNumber !== undefined ? data.licenseNumber : vendor.license_number,
    contact_person_name: data.contactPersonName !== undefined ? data.contactPersonName : vendor.contact_person_name,
    contact_person_phone: data.contactPersonPhone !== undefined ? data.contactPersonPhone : vendor.contact_person_phone,
    contact_person_email: data.contactPersonEmail !== undefined ? data.contactPersonEmail : vendor.contact_person_email,
    service_categories: data.serviceCategories !== undefined ? data.serviceCategories : vendor.service_categories,
    payment_terms_days: data.paymentTermsDays !== undefined ? data.paymentTermsDays : vendor.payment_terms_days,
    bank_name: data.bankName !== undefined ? data.bankName : vendor.bank_name,
    bank_account_number: data.bankAccountNumber !== undefined ? data.bankAccountNumber : vendor.bank_account_number,
    bank_iban: data.bankIban !== undefined ? data.bankIban : vendor.bank_iban,
    bank_swift_code: data.bankSwiftCode !== undefined ? data.bankSwiftCode : vendor.bank_swift_code,
    notes: data.notes !== undefined ? data.notes : vendor.notes,
  });

  return await getById(tenantId, vendorId);
};

const approve = async (tenantId, vendorId, userId) => {
  const vendor = await getById(tenantId, vendorId);

  if (vendor.status !== RECORD_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending vendors can be approved');
  }

  await vendor.update({
    status: RECORD_STATUS.ACTIVE,
    approved_by: userId,
    approved_at: new Date(),
  });

  return await getById(tenantId, vendorId);
};

const deactivate = async (tenantId, vendorId) => {
  const vendor = await getById(tenantId, vendorId);
  await vendor.update({ status: RECORD_STATUS.INACTIVE });
  return await getById(tenantId, vendorId);
};

const activate = async (tenantId, vendorId) => {
  const vendor = await getById(tenantId, vendorId);
  await vendor.update({ status: RECORD_STATUS.ACTIVE });
  return await getById(tenantId, vendorId);
};

const remove = async (tenantId, vendorId) => {
  const vendor = await getById(tenantId, vendorId);

  // Check if vendor has associated invoices or payments
  const invoiceCount = await db.Invoice.count({
    where: { tenant_id: tenantId, vendor_id: vendorId },
  });
  if (invoiceCount > 0) {
    throw ApiError.badRequest('Cannot delete vendor with associated invoices');
  }

  const paymentCount = await db.Payment.count({
    where: { tenant_id: tenantId, vendor_id: vendorId },
  });
  if (paymentCount > 0) {
    throw ApiError.badRequest('Cannot delete vendor with associated payments');
  }

  await vendor.destroy();
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
};
