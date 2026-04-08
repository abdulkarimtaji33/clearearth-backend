/**
 * Work Type Service — tenant-scoped labels for work order tasks
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters = {}) => {
  const { search, activeOnly } = filters;
  const where = { tenant_id: tenantId };
  if (activeOnly !== false && activeOnly !== 'false') where.is_active = true;
  if (search) {
    const s = String(search).trim();
    where.name = { [Op.like]: `%${s}%` };
  }
  return db.WorkType.findAll({
    where,
    order: [['display_order', 'ASC'], ['name', 'ASC']],
  });
};

const getById = async (tenantId, id) => {
  const row = await db.WorkType.findOne({ where: { id, tenant_id: tenantId } });
  if (!row) throw ApiError.notFound('Work type not found');
  return row;
};

const clearOtherDefaults = async (tenantId, exceptId, transaction) => {
  await db.WorkType.update(
    { is_default: false },
    { where: { tenant_id: tenantId, ...(exceptId != null ? { id: { [Op.ne]: exceptId } } : {}) }, transaction }
  );
};

const create = async (tenantId, data) => {
  const name = data.name?.trim();
  if (!name) throw ApiError.badRequest('Name is required');
  const existing = await db.WorkType.findOne({ where: { tenant_id: tenantId, name } });
  if (existing) throw ApiError.conflict('A work type with this name already exists');
  const isDefault = Boolean(data.isDefault);
  return db.sequelize.transaction(async (t) => {
    if (isDefault) await clearOtherDefaults(tenantId, null, t);
    return db.WorkType.create(
      {
        tenant_id: tenantId,
        name,
        display_order: data.displayOrder != null ? parseInt(data.displayOrder, 10) : 0,
        is_active: data.isActive !== false,
        is_default: isDefault,
      },
      { transaction: t }
    );
  });
};

const update = async (tenantId, id, data) => {
  const row = await getById(tenantId, id);
  if (data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) throw ApiError.badRequest('Name is required');
    const dup = await db.WorkType.findOne({
      where: { tenant_id: tenantId, name, id: { [Op.ne]: id } },
    });
    if (dup) throw ApiError.conflict('A work type with this name already exists');
    row.name = name;
  }
  if (data.displayOrder !== undefined) row.display_order = parseInt(data.displayOrder, 10) || 0;
  if (data.isActive !== undefined) row.is_active = Boolean(data.isActive);
  if (data.isDefault !== undefined) row.is_default = Boolean(data.isDefault);

  await db.sequelize.transaction(async (t) => {
    if (row.is_default) {
      await clearOtherDefaults(tenantId, id, t);
    }
    await row.save({ transaction: t });
  });
  return row.reload();
};

const remove = async (tenantId, id) => {
  await getById(tenantId, id);
  const inUse = await db.WorkOrderTask.count({ where: { work_type_id: id } });
  if (inUse > 0) {
    throw ApiError.badRequest('Cannot delete: this type is used on one or more work order tasks');
  }
  await db.WorkType.destroy({ where: { id, tenant_id: tenantId } });
};

module.exports = { getAll, getById, create, update, remove };
