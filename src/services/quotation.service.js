/**
 * Quotation Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, statusNot, dealId, scopeUserId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  if (scopeUserId) where.prepared_by = scopeUserId;
  if (status) {
    where.status = status;
  } else if (statusNot) {
    where.status = { [Op.ne]: statusNot };
  }
  if (dealId) where.deal_id = dealId;

  const dealWhereForSearch = () => {
    if (!search) return undefined;
    const s = String(search).trim();
    const or = [
      { title: { [Op.like]: `%${s}%` } },
      { deal_number: { [Op.like]: `%${s}%` } },
    ];
    const n = parseInt(s, 10);
    if (String(n) === s && n > 0) or.push({ id: n });
    return { [Op.or]: or };
  };
  const dealInclude = {
    model: db.Deal,
    as: 'deal',
    attributes: ['id', 'title', 'deal_number'],
    required: !search,
    where: dealWhereForSearch(),
    include: [
      {
        model: db.DealItem,
        as: 'items',
        attributes: ['id'],
        required: false,
      },
    ],
  };
  if (search) dealInclude.required = true;
  applyDateOnlyColumnFilter(where, 'quotation_date', dateFrom, dateTo);

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
    subQuery: false,
  });

  return { quotations: rows, total: count };
};

const getById = async (tenantId, quotationId, scope = {}) => {
  const where = { id: quotationId, tenant_id: tenantId };
  if (scope.scopeUserId) where.prepared_by = scope.scopeUserId;
  const quotation = await db.Quotation.findOne({
    where,
    include: [
      {
        model: db.Deal,
        as: 'deal',
        include: [
          {
            model: db.DealItem,
            as: 'items',
            include: [{ model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'unit_of_measure'] }],
          },
        ],
      },
      { model: db.User, as: 'preparedByUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
    ],
  });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return quotation;
};

const create = async (tenantId, data, scope = {}) => {
  const { dealId, preparedBy, quotationDate, quotationAmount, status, remarks } = data;

  const dealWhere = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where: dealWhere });
  if (!deal) throw ApiError.badRequest('Deal not found');

  const effectivePreparedBy = scope.scopeUserId || preparedBy;
  const user = await db.User.findOne({ where: { id: effectivePreparedBy, tenant_id: tenantId } });
  if (!user) throw ApiError.badRequest('User not found');

  const quotation = await db.Quotation.create({
    tenant_id: tenantId,
    deal_id: dealId,
    prepared_by: effectivePreparedBy,
    quotation_date: quotationDate,
    quotation_amount: parseFloat(quotationAmount) || 0,
    currency: 'AED',
    status: status || 'draft',
    remarks: remarks || null,
  });

  return getById(tenantId, quotation.id);
};

const update = async (tenantId, quotationId, data, scope = {}) => {
  const quotation = await getById(tenantId, quotationId, scope);
  const { dealId, preparedBy, quotationDate, quotationAmount, status, remarks } = data;

  if (dealId) {
    const dealWhere = { id: dealId, tenant_id: tenantId };
    if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
    const deal = await db.Deal.findOne({ where: dealWhere });
    if (!deal) throw ApiError.badRequest('Deal not found');
  }
  const effectivePreparedBy = scope.scopeUserId || preparedBy;
  if (effectivePreparedBy) {
    const user = await db.User.findOne({ where: { id: effectivePreparedBy, tenant_id: tenantId } });
    if (!user) throw ApiError.badRequest('User not found');
  }

  await quotation.update({
    deal_id: dealId ?? quotation.deal_id,
    prepared_by: effectivePreparedBy ?? quotation.prepared_by,
    quotation_date: quotationDate ?? quotation.quotation_date,
    quotation_amount: quotationAmount !== undefined ? parseFloat(quotationAmount) : quotation.quotation_amount,
    status: status ?? quotation.status,
    remarks: remarks !== undefined ? remarks : quotation.remarks,
  });

  return getById(tenantId, quotation.id);
};

const remove = async (tenantId, quotationId, scope = {}) => {
  const quotation = await getById(tenantId, quotationId, scope);
  await quotation.destroy();
};

module.exports = { getAll, getById, create, update, remove };
