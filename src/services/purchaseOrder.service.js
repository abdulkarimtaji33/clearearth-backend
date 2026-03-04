/**
 * Purchase Order Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, supplierId } = filters;
  const where = { tenant_id: tenantId };

  if (supplierId) where.supplier_id = supplierId;

  const supplierInclude = {
    model: db.Supplier,
    as: 'supplier',
    attributes: ['id', 'company_name'],
    required: true,
    where: search ? { company_name: { [Op.like]: `%${search}%` } } : undefined,
  };

  const { count, rows } = await db.PurchaseOrder.findAndCountAll({
    where,
    include: [
      supplierInclude,
      {
        model: db.PurchaseOrderItem,
        as: 'items',
        include: [{ model: db.ProductService, as: 'productService', attributes: ['id', 'name'], required: false }],
        required: false,
      },
      { model: db.TermsAndConditions, as: 'terms', through: { attributes: [] }, attributes: ['id', 'title'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { purchaseOrders: rows, total: count };
};

const getById = async (tenantId, poId) => {
  const po = await db.PurchaseOrder.findOne({
    where: { id: poId, tenant_id: tenantId },
    include: [
      { model: db.Supplier, as: 'supplier' },
      {
        model: db.PurchaseOrderItem,
        as: 'items',
        include: [{ model: db.ProductService, as: 'productService' }],
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      },
      { model: db.TermsAndConditions, as: 'terms', through: { attributes: [] } },
    ],
  });
  if (!po) throw ApiError.notFound('Purchase order not found');
  return po;
};

const create = async (tenantId, data) => {
  const { supplierId, poDate, expectedDelivery, items, termsAndConditionsIds } = data;

  const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
  if (!supplier) throw ApiError.badRequest('Supplier not found');

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('At least one item is required');
  }

  const po = await db.sequelize.transaction(async (t) => {
    const newPo = await db.PurchaseOrder.create(
      {
        tenant_id: tenantId,
        supplier_id: supplierId,
        po_date: poDate,
        expected_delivery: expectedDelivery || null,
      },
      { transaction: t }
    );

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      await db.PurchaseOrderItem.create(
        {
          purchase_order_id: newPo.id,
          product_service_id: it.productServiceId,
          item_description: it.itemDescription || null,
          quantity: String(it.quantity ?? ''),
          price: String(it.price ?? ''),
          total: String(it.total ?? ''),
          sort_order: i,
        },
        { transaction: t }
      );
    }

    if (termsAndConditionsIds && Array.isArray(termsAndConditionsIds) && termsAndConditionsIds.length > 0) {
      for (let i = 0; i < termsAndConditionsIds.length; i++) {
        await db.PurchaseOrderTerm.create(
          {
            purchase_order_id: newPo.id,
            terms_and_conditions_id: termsAndConditionsIds[i],
            sort_order: i,
          },
          { transaction: t }
        );
      }
    }

    return newPo;
  });

  return getById(tenantId, po.id);
};

const update = async (tenantId, poId, data) => {
  const po = await getById(tenantId, poId);
  const { supplierId, poDate, expectedDelivery, items, termsAndConditionsIds } = data;

  if (supplierId) {
    const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
    if (!supplier) throw ApiError.badRequest('Supplier not found');
  }

  await db.sequelize.transaction(async (t) => {
    await po.update(
      {
        supplier_id: supplierId ?? po.supplier_id,
        po_date: poDate ?? po.po_date,
        expected_delivery: expectedDelivery !== undefined ? expectedDelivery : po.expected_delivery,
      },
      { transaction: t }
    );

    if (items && Array.isArray(items)) {
      await db.PurchaseOrderItem.destroy({ where: { purchase_order_id: po.id }, transaction: t });
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await db.PurchaseOrderItem.create(
          {
            purchase_order_id: po.id,
            product_service_id: it.productServiceId,
            item_description: it.itemDescription || null,
            quantity: String(it.quantity ?? ''),
            price: String(it.price ?? ''),
            total: String(it.total ?? ''),
            sort_order: i,
          },
          { transaction: t }
        );
      }
    }

    if (termsAndConditionsIds !== undefined) {
      await db.PurchaseOrderTerm.destroy({ where: { purchase_order_id: po.id }, transaction: t });
      if (Array.isArray(termsAndConditionsIds) && termsAndConditionsIds.length > 0) {
        for (let i = 0; i < termsAndConditionsIds.length; i++) {
          await db.PurchaseOrderTerm.create(
            {
              purchase_order_id: po.id,
              terms_and_conditions_id: termsAndConditionsIds[i],
              sort_order: i,
            },
            { transaction: t }
          );
        }
      }
    }
  });

  return getById(tenantId, po.id);
};

const remove = async (tenantId, poId) => {
  const po = await getById(tenantId, poId);
  await po.destroy();
};

module.exports = { getAll, getById, create, update, remove };
