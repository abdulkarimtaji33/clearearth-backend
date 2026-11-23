const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyCreatedAtFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, category, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { content: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;
  applyCreatedAtFilter(where, dateFrom, dateTo);

  const { count, rows } = await db.TermsAndConditions.findAndCountAll({
    where,
    offset,
    limit,
    order: [['is_default', 'DESC'], ['created_at', 'DESC']],
  });

  return { terms: rows, total: count };
};

const getById = async (tenantId, id) => {
  const terms = await db.TermsAndConditions.findOne({
    where: { id, tenant_id: tenantId },
  });
  if (!terms) throw ApiError.notFound('Terms and Conditions not found');
  return terms;
};

const DEFAULT_ADMIN_ONLY = 'Only an administrator can choose the default Terms & Conditions';

// Several terms can be defaults: all of them are pre-selected when a quotation is created.
const create = async (tenantId, data, { canSetDefault = false } = {}) => {
  const { title, content, category, isDefault } = data;

  if (isDefault && !canSetDefault) throw ApiError.forbidden(DEFAULT_ADMIN_ONLY);

  const terms = await db.TermsAndConditions.create({
    tenant_id: tenantId,
    title,
    content,
    category: category || null,
    is_default: Boolean(isDefault),
    status: 'active',
  });

  return terms;
};

const update = async (tenantId, id, data, { canSetDefault = false } = {}) => {
  const terms = await getById(tenantId, id);
  const { title, content, category, isDefault, status } = data;

  if (isDefault !== undefined && Boolean(isDefault) !== Boolean(terms.is_default) && !canSetDefault) {
    throw ApiError.forbidden(DEFAULT_ADMIN_ONLY);
  }

  await terms.update({
    title: title !== undefined ? title : terms.title,
    content: content !== undefined ? content : terms.content,
    category: category !== undefined ? category : terms.category,
    is_default: isDefault !== undefined ? isDefault : terms.is_default,
    status: status !== undefined ? status : terms.status,
  });

  return terms;
};

const remove = async (tenantId, id) => {
  const terms = await getById(tenantId, id);
  await terms.destroy();
};

module.exports = { getAll, getById, create, update, remove };
