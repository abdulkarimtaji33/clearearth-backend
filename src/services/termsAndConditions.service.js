const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, category } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { content: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;

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

const create = async (tenantId, data) => {
  const { title, content, category, isDefault } = data;

  if (isDefault) {
    await db.TermsAndConditions.update(
      { is_default: false },
      { where: { tenant_id: tenantId } }
    );
  }

  const terms = await db.TermsAndConditions.create({
    tenant_id: tenantId,
    title,
    content,
    category: category || null,
    is_default: isDefault || false,
    status: 'active',
  });

  return terms;
};

const update = async (tenantId, id, data) => {
  const terms = await getById(tenantId, id);
  const { title, content, category, isDefault, status } = data;

  if (isDefault && !terms.is_default) {
    await db.TermsAndConditions.update(
      { is_default: false },
      { where: { tenant_id: tenantId } }
    );
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
