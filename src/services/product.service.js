const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { RECORD_STATUS } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, category } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { product_code: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;

  const { count, rows } = await db.Product.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { products: rows, total: count };
};

const getById = async (tenantId, productId) => {
  const product = await db.Product.findOne({
    where: { id: productId, tenant_id: tenantId },
  });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

const create = async (tenantId, data) => {
  const productCode = generateReferenceNumber('PRD');

  const product = await db.Product.create({
    tenant_id: tenantId,
    product_code: productCode,
    name: data.name,
    description: data.description,
    category: data.category,
    unit_of_measure: data.unitOfMeasure || 'kg',
    purchase_price: data.purchasePrice || 0,
    selling_price: data.sellingPrice || 0,
    tax_rate: data.taxRate || 5,
    hs_code: data.hsCode,
    image: data.image,
    status: RECORD_STATUS.PENDING,
  });

  return product;
};

const update = async (tenantId, productId, data) => {
  const product = await getById(tenantId, productId);

  await product.update({
    name: data.name || product.name,
    description: data.description || product.description,
    category: data.category || product.category,
    unit_of_measure: data.unitOfMeasure || product.unit_of_measure,
    purchase_price: data.purchasePrice ?? product.purchase_price,
    selling_price: data.sellingPrice ?? product.selling_price,
    tax_rate: data.taxRate ?? product.tax_rate,
    hs_code: data.hsCode || product.hs_code,
    image: data.image || product.image,
  });

  return product;
};

const approve = async (tenantId, productId, userId) => {
  const product = await getById(tenantId, productId);
  if (product.status !== RECORD_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending products can be approved');
  }

  await product.update({
    status: RECORD_STATUS.ACTIVE,
    approved_by: userId,
    approved_at: new Date(),
  });

  return product;
};

const deactivate = async (tenantId, productId) => {
  const product = await getById(tenantId, productId);
  await product.update({ status: RECORD_STATUS.INACTIVE });
  return product;
};

const activate = async (tenantId, productId) => {
  const product = await getById(tenantId, productId);
  await product.update({ status: RECORD_STATUS.ACTIVE });
  return product;
};

const remove = async (tenantId, productId) => {
  const product = await getById(tenantId, productId);
  await product.destroy();
};

module.exports = { getAll, getById, create, update, approve, deactivate, activate, remove };
