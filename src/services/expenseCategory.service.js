/**
 * Expense Category Service — tenant-scoped manual expense categories
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const DEFAULT_CATEGORIES = [
  { name: 'Travel', value: 'travel', displayOrder: 1 },
  { name: 'Utility', value: 'utility', displayOrder: 2 },
  { name: 'Fuel', value: 'fuel', displayOrder: 3 },
  { name: 'Materials', value: 'materials', displayOrder: 4 },
  { name: 'Equipment', value: 'equipment', displayOrder: 5 },
  { name: 'Professional services', value: 'professional', displayOrder: 6 },
  { name: 'Other', value: 'other', displayOrder: 99 },
];

function slugifyCategory(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100) || 'other';
}

const getAll = async (tenantId, filters = {}) => {
  const { search, activeOnly } = filters;
  const where = { tenant_id: tenantId };
  if (activeOnly !== false && activeOnly !== 'false') where.is_active = true;
  if (search) {
    const s = String(search).trim();
    where[Op.or] = [
      { name: { [Op.like]: `%${s}%` } },
      { value: { [Op.like]: `%${s}%` } },
    ];
  }
  return db.ExpenseCategory.findAll({
    where,
    order: [['display_order', 'ASC'], ['name', 'ASC']],
  });
};

const getById = async (tenantId, id) => {
  const row = await db.ExpenseCategory.findOne({ where: { id, tenant_id: tenantId } });
  if (!row) throw ApiError.notFound('Expense category not found');
  return row;
};

const resolveCategoryValue = async (tenantId, category) => {
  const value = category != null ? String(category).trim().toLowerCase() : '';
  if (!value) throw ApiError.badRequest('category is required');
  if (value === 'work_orders') return value;
  const row = await db.ExpenseCategory.findOne({
    where: { tenant_id: tenantId, value, is_active: true },
  });
  if (!row) throw ApiError.badRequest('Invalid expense category');
  return row.value;
};

const create = async (tenantId, data) => {
  const name = data.name?.trim();
  if (!name) throw ApiError.badRequest('Name is required');
  const value = data.value?.trim() ? String(data.value).trim().toLowerCase() : slugifyCategory(name);
  const existing = await db.ExpenseCategory.findOne({ where: { tenant_id: tenantId, value } });
  if (existing) throw ApiError.conflict('An expense category with this name already exists');
  return db.ExpenseCategory.create({
    tenant_id: tenantId,
    name,
    value,
    display_order: data.displayOrder != null ? parseInt(data.displayOrder, 10) : 0,
    is_active: data.isActive !== false,
  });
};

const update = async (tenantId, id, data) => {
  const row = await getById(tenantId, id);
  if (data.name !== undefined) {
    const name = data.name?.trim();
    if (!name) throw ApiError.badRequest('Name is required');
    row.name = name;
  }
  if (data.displayOrder !== undefined) row.display_order = parseInt(data.displayOrder, 10) || 0;
  if (data.isActive !== undefined) row.is_active = Boolean(data.isActive);
  await row.save();
  return row.reload();
};

const remove = async (tenantId, id) => {
  const row = await getById(tenantId, id);
  const inUse = await db.Expense.count({ where: { tenant_id: tenantId, category: row.value } });
  if (inUse > 0) {
    throw ApiError.badRequest('Cannot delete: this category is used on one or more expenses');
  }
  await db.ExpenseCategory.destroy({ where: { id, tenant_id: tenantId } });
};

const seedDefaultsForTenant = async (tenantId) => {
  for (const cat of DEFAULT_CATEGORIES) {
    const exists = await db.ExpenseCategory.findOne({
      where: { tenant_id: tenantId, value: cat.value },
    });
    if (!exists) {
      await db.ExpenseCategory.create({
        tenant_id: tenantId,
        name: cat.name,
        value: cat.value,
        display_order: cat.displayOrder,
        is_active: true,
      });
    }
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  resolveCategoryValue,
  seedDefaultsForTenant,
  DEFAULT_CATEGORIES,
  slugifyCategory,
};
