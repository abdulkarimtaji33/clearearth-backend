/**
 * Supplier Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const { applyCreatedAtFilter } = require('../utils/dateRangeWhere');

const contactInclude = {
  model: db.Contact,
  as: 'contacts',
  through: { attributes: ['id', 'role', 'is_primary'] },
  attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'job_title', 'department'],
};

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, industryType, country, city, contactId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    const s = String(search).trim();
    const or = [
      { company_name: { [Op.like]: `%${s}%` } },
      { email: { [Op.like]: `%${s}%` } },
      { phone: { [Op.like]: `%${s}%` } },
      { supplier_code: { [Op.like]: `%${s}%` } },
      { industry_type: { [Op.like]: `%${s}%` } },
    ];
    const n = parseInt(s, 10);
    if (String(n) === s && n > 0) or.push({ id: n });
    where[Op.or] = or;
  }

  if (status) where.status = status;
  if (industryType) where.industry_type = industryType;
  if (country) where.country = country;
  if (city) where.city = city;
  if (contactId) where.primary_contact_id = contactId;
  applyCreatedAtFilter(where, dateFrom, dateTo);

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

  const deals = await db.Deal.findAll({
    where: {
      tenant_id: tenantId,
      [Op.or]: [
        { supplier_id: supplierId },
        { downstream_partner_supplier_id: supplierId },
      ],
    },
    attributes: [
      'id',
      'deal_number',
      'title',
      'description',
      'subtotal',
      'vat_amount',
      'total',
      'currency',
      'deal_date',
      'status',
      'payment_status',
      'supplier_id',
      'downstream_partner_supplier_id',
    ],
    order: [['created_at', 'DESC']],
    limit: 200,
  });

  const plain = supplier.get({ plain: true });
  plain.deals = deals.map(d => {
    const row = d.get({ plain: true });
    const sid = Number(supplierId);
    const isPrimary = Number(row.supplier_id) === sid;
    const isDownstream = Number(row.downstream_partner_supplier_id) === sid;
    row.vendorRole = isPrimary && isDownstream ? 'both' : isPrimary ? 'primary' : 'downstream';
    delete row.supplier_id;
    delete row.downstream_partner_supplier_id;
    return row;
  });

  const payablesService = require('./payables.service');
  const [purchaseOrders, expenses] = await Promise.all([
    db.PurchaseOrder.findAll({
      where: { tenant_id: tenantId, supplier_id: supplierId, status: 'approved' },
      include: [
        {
          model: db.PurchaseOrderItem,
          as: 'items',
          include: [{ model: db.ProductService, as: 'productService', attributes: ['id', 'name'] }],
        },
        { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    }),
    db.Expense.findAll({
      where: {
        tenant_id: tenantId,
        [Op.or]: [
          { reference: 'supplier', reference_id: String(supplierId) },
          ...(plain.company_name
            ? [{ paid_to: { [Op.like]: `%${String(plain.company_name).replace(/%/g, '\\%')}%` } }]
            : []),
        ],
      },
      attributes: ['id', 'category', 'amount', 'expense_date', 'paid_to', 'payment_status', 'paid_amount', 'payment_method', 'reference', 'reference_id'],
      order: [['expense_date', 'DESC']],
      limit: 80,
    }),
  ]);

  let payablesOutstanding = 0;
  for (const po of purchaseOrders) {
    payablesOutstanding += payablesService.balanceDue(po.get({ plain: true }));
  }

  plain.finance = {
    purchaseOrders: purchaseOrders.map(p => {
      const o = p.get({ plain: true });
      o.po_total = payablesService.poTotal(o);
      o.balance_due = payablesService.balanceDue(o);
      return o;
    }),
    expenses: expenses.map(e => e.get({ plain: true })),
    payablesOutstanding,
  };

  return plain;
};

const create = async (tenantId, data) => {
  const {
    companyName, primaryContactId, industryType, website,
    email, phone, country, city, address, notes, contacts, type, vatNumber,
  } = data;

  if (email) {
    const existing = await db.Supplier.findOne({ where: { tenant_id: tenantId, email } });
    if (existing) throw ApiError.conflict('Email already exists');
  }

  const supplier = await db.Supplier.create({
    tenant_id: tenantId,
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
    trade_license_file_path: data.tradeLicenseFilePath || null,
    trade_license_number: data.tradeLicenseNumber || null,
    trade_license_name: data.tradeLicenseName || null,
    trade_license_expiry_date: data.tradeLicenseExpiryDate || null,
    vat_certificate_file_path: data.vatCertificateFilePath || null,
    vat_certificate_trn: data.vatCertificateTrn || null,
    bank_details_file_path: data.bankDetailsFilePath || null,
    bank_name: data.bankName || null,
    bank_iban: data.bankIban || null,
  });

  await supplier.update({ supplier_code: String(supplier.id) });

  if (primaryContactId) {
    await db.Contact.update(
      { supplier_id: supplier.id },
      { where: { id: primaryContactId, tenant_id: tenantId } }
    );
    await db.SupplierContact.findOrCreate({
      where: { supplier_id: supplier.id, contact_id: primaryContactId },
      defaults: { role: null, is_primary: true },
    });
  }

  if (contacts && contacts.length > 0) {
    await _upsertContactLinks(supplier.id, contacts);
  }

  const supplierData = await getById(tenantId, supplier.id);
  const plain = supplierData.get ? supplierData.get({ plain: true }) : supplierData;
  return plain;
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
    vat_number: data.vatNumber !== undefined ? data.vatNumber || null : supplier.vat_number,
    country: data.country !== undefined ? data.country : supplier.country,
    city: data.city !== undefined ? data.city : supplier.city,
    address: data.address !== undefined ? data.address : supplier.address,
    notes: data.notes !== undefined ? data.notes : supplier.notes,
    status: data.status !== undefined ? data.status : supplier.status,
    type: data.type !== undefined ? data.type : supplier.type,
    trade_license_file_path: data.tradeLicenseFilePath !== undefined ? data.tradeLicenseFilePath || null : supplier.trade_license_file_path,
    trade_license_number: data.tradeLicenseNumber !== undefined ? data.tradeLicenseNumber || null : supplier.trade_license_number,
    trade_license_name: data.tradeLicenseName !== undefined ? data.tradeLicenseName || null : supplier.trade_license_name,
    trade_license_expiry_date: data.tradeLicenseExpiryDate !== undefined ? data.tradeLicenseExpiryDate || null : supplier.trade_license_expiry_date,
    vat_certificate_file_path: data.vatCertificateFilePath !== undefined ? data.vatCertificateFilePath || null : supplier.vat_certificate_file_path,
    vat_certificate_trn: data.vatCertificateTrn !== undefined ? data.vatCertificateTrn || null : supplier.vat_certificate_trn,
    bank_details_file_path: data.bankDetailsFilePath !== undefined ? data.bankDetailsFilePath || null : supplier.bank_details_file_path,
    bank_name: data.bankName !== undefined ? data.bankName || null : supplier.bank_name,
    bank_iban: data.bankIban !== undefined ? data.bankIban || null : supplier.bank_iban,
  });

  if (data.contacts !== undefined) {
    await db.SupplierContact.destroy({ where: { supplier_id: supplierId }, force: true });
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
    const [link, created] = await db.SupplierContact.findOrCreate({
      where: { supplier_id: supplierId, contact_id: c.contactId },
      defaults: { role: c.role || null, is_primary: c.isPrimary || false },
    });
    
    if (!created) {
      await link.update({ role: c.role || null, is_primary: c.isPrimary || false });
    }
  }
}

module.exports = { getAll, getById, create, update, remove, addContact, removeContact };
