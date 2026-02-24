const db = require('../models');
const { ProductCategory } = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, category, status, type, unitOfMeasure, minPrice, maxPrice } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }
  if (category) where.category = category;
  if (status) where.status = status;
  if (type) where.type = type;
  if (unitOfMeasure) where.unit_of_measure = unitOfMeasure;
  
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
    if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
  }

  const { count, rows } = await db.ProductService.findAndCountAll({
    where,
    offset,
    limit,
    order: [['name', 'ASC']],
  });

  return { products: rows, total: count };
};

const getById = async (tenantId, productId) => {
  const product = await db.ProductService.findOne({
    where: { id: productId, tenant_id: tenantId },
  });
  if (!product) throw ApiError.notFound('Product/Service not found');
  return product;
};

const create = async (tenantId, data) => {
  // Auto-create category if it doesn't exist
  if (data.category) {
    await db.ProductCategory.findOrCreate({
      where: { value: data.category },
      defaults: {
        value: data.category,
        display_name: data.category,
        display_order: 0,
        is_active: true,
      }
    });
  }

  const product = await db.ProductService.create({
    tenant_id: tenantId,
    name: data.name,
    type: data.type || 'product',
    category: data.category,
    description: data.description,
    unit_of_measure: data.unitOfMeasure,
    price: data.price || 0,
    currency: data.currency || 'AED',
    status: data.status || 'active',
  });

  return await getById(tenantId, product.id);
};

const update = async (tenantId, productId, data) => {
  const product = await db.ProductService.findOne({
    where: { id: productId, tenant_id: tenantId },
  });
  if (!product) throw ApiError.notFound('Product/Service not found');

  // Auto-create category if it doesn't exist
  if (data.category) {
    await db.ProductCategory.findOrCreate({
      where: { value: data.category },
      defaults: {
        value: data.category,
        display_name: data.category,
        display_order: 0,
        is_active: true,
      }
    });
  }

  await product.update({
    name: data.name !== undefined ? data.name : product.name,
    type: data.type !== undefined ? data.type : product.type,
    category: data.category !== undefined ? data.category : product.category,
    description: data.description !== undefined ? data.description : product.description,
    unit_of_measure: data.unitOfMeasure !== undefined ? data.unitOfMeasure : product.unit_of_measure,
    price: data.price !== undefined ? data.price : product.price,
    currency: data.currency !== undefined ? data.currency : product.currency,
    status: data.status !== undefined ? data.status : product.status,
  });

  return await getById(tenantId, productId);
};

const remove = async (tenantId, productId) => {
  const product = await db.ProductService.findOne({
    where: { id: productId, tenant_id: tenantId },
  });
  if (!product) throw ApiError.notFound('Product/Service not found');

  await product.destroy();
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
