/**
 * Quotation Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, dealId } = filters;
  const where = { tenant_id: tenantId };

  if (status) where.status = status;
  if (dealId) where.deal_id = dealId;

  const dealInclude = {
    model: db.Deal,
    as: 'deal',
    attributes: ['id', 'title', 'deal_number'],
    required: !search,
    where: search ? { [Op.or]: [{ title: { [Op.like]: `%${search}%` } }, { deal_number: { [Op.like]: `%${search}%` } }] } : undefined,
  };
  if (search) dealInclude.required = true;

  const { count, rows } = await db.Quotation.findAndCountAll({
    where,
    include: [
      dealInclude,
      { model: db.User, as: 'preparedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { quotations: rows, total: count };
};

const getById = async (tenantId, quotationId) => {
  const quotation = await db.Quotation.findOne({
    where: { id: quotationId, tenant_id: tenantId },
    include: [
      { model: db.Deal, as: 'deal' },
      { model: db.User, as: 'preparedByUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
    ],
  });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return quotation;
};

const create = async (tenantId, data) => {
  const { dealId, preparedBy, quotationDate, quotationAmount, status, remarks } = data;

  const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
  if (!deal) throw ApiError.badRequest('Deal not found');

  const user = await db.User.findOne({ where: { id: preparedBy, tenant_id: tenantId } });
  if (!user) throw ApiError.badRequest('User not found');

  const quotation = await db.Quotation.create({
    tenant_id: tenantId,
    deal_id: dealId,
    prepared_by: preparedBy,
    quotation_date: quotationDate,
    quotation_amount: parseFloat(quotationAmount) || 0,
    currency: 'AED',
    status: status || 'draft',
    remarks: remarks || null,
  });

  return getById(tenantId, quotation.id);
};

const update = async (tenantId, quotationId, data) => {
  const quotation = await getById(tenantId, quotationId);
  const { dealId, preparedBy, quotationDate, quotationAmount, status, remarks } = data;

  if (dealId) {
    const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
    if (!deal) throw ApiError.badRequest('Deal not found');
  }
  if (preparedBy) {
    const user = await db.User.findOne({ where: { id: preparedBy, tenant_id: tenantId } });
    if (!user) throw ApiError.badRequest('User not found');
  }

  await quotation.update({
    deal_id: dealId ?? quotation.deal_id,
    prepared_by: preparedBy ?? quotation.prepared_by,
    quotation_date: quotationDate ?? quotation.quotation_date,
    quotation_amount: quotationAmount !== undefined ? parseFloat(quotationAmount) : quotation.quotation_amount,
    status: status ?? quotation.status,
    remarks: remarks !== undefined ? remarks : quotation.remarks,
  });

  return getById(tenantId, quotation.id);
};

const remove = async (tenantId, quotationId) => {
  const quotation = await getById(tenantId, quotationId);
  await quotation.destroy();
};

module.exports = { getAll, getById, create, update, remove };
