const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, type, isActive } = filters;
  const where = { tenant_id: tenantId };

  if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { code: { [Op.like]: `%${search}%` } }];
  if (type) where.type = type;
  if (isActive !== undefined) where.is_active = isActive === 'true';

  const { count, rows } = await db.Warehouse.findAndCountAll({
    where,
    include: [{ model: db.User, as: 'manager', attributes: ['id', 'first_name', 'last_name'] }],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { warehouses: rows, total: count };
};

const getById = async (tenantId, warehouseId) => {
  const warehouse = await db.Warehouse.findOne({
    where: { id: warehouseId, tenant_id: tenantId },
    include: [{ model: db.User, as: 'manager' }],
  });
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  return warehouse;
};

const create = async (tenantId, data) => {
  const code = generateReferenceNumber('WHS');

  const warehouse = await db.Warehouse.create({
    tenant_id: tenantId,
    name: data.name,
    code,
    type: data.type || 'warehouse',
    address: data.address,
    city: data.city,
    contact_person: data.contactPerson,
    contact_phone: data.contactPhone,
    capacity: data.capacity,
    manager_id: data.managerId,
    is_active: true,
  });

  return await getById(tenantId, warehouse.id);
};

const update = async (tenantId, warehouseId, data) => {
  const warehouse = await db.Warehouse.findOne({ where: { id: warehouseId, tenant_id: tenantId } });
  if (!warehouse) throw ApiError.notFound('Warehouse not found');

  await warehouse.update({
    name: data.name || warehouse.name,
    address: data.address || warehouse.address,
    city: data.city || warehouse.city,
    contact_person: data.contactPerson || warehouse.contact_person,
    contact_phone: data.contactPhone || warehouse.contact_phone,
    capacity: data.capacity ?? warehouse.capacity,
    manager_id: data.managerId ?? warehouse.manager_id,
  });

  return await getById(tenantId, warehouseId);
};

const deactivate = async (tenantId, warehouseId) => {
  const warehouse = await db.Warehouse.findOne({ where: { id: warehouseId, tenant_id: tenantId } });
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  await warehouse.update({ is_active: false });
  return await getById(tenantId, warehouseId);
};

const activate = async (tenantId, warehouseId) => {
  const warehouse = await db.Warehouse.findOne({ where: { id: warehouseId, tenant_id: tenantId } });
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  await warehouse.update({ is_active: true });
  return await getById(tenantId, warehouseId);
};

const remove = async (tenantId, warehouseId) => {
  const warehouse = await db.Warehouse.findOne({ where: { id: warehouseId, tenant_id: tenantId } });
  if (!warehouse) throw ApiError.notFound('Warehouse not found');

  // Check if warehouse has inventory
  const inventoryCount = await db.Inventory.count({ where: { tenant_id: tenantId, warehouse_id: warehouseId } });
  if (inventoryCount > 0) {
    throw ApiError.badRequest('Cannot delete warehouse with existing inventory');
  }

  await warehouse.destroy();
};

module.exports = { getAll, getById, create, update, deactivate, activate, remove };
