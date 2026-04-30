/**
 * Purchase Order Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, supplierId, companyId, dealId, status, statusNot, side, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  if (companyId) {
    where.company_id = companyId;
  } else if (side === 'client') {
    where.company_id = { [Op.not]: null };
  }
  if (supplierId) {
    where.supplier_id = supplierId;
  } else if (side === 'supplier') {
    where.supplier_id = { [Op.not]: null };
  }
  if (dealId) where.deal_id = dealId;
  if (status) {
    where.status = status;
  } else if (statusNot) {
    where.status = { [Op.ne]: statusNot };
  }
  applyDateOnlyColumnFilter(where, 'po_date', dateFrom, dateTo);

  if (search) {
    where[Op.or] = [
      { '$supplier.company_name$': { [Op.like]: `%${search}%` } },
      { '$company.company_name$': { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await db.PurchaseOrder.findAndCountAll({
    where,
    include: [
      { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
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
    subQuery: false,
  });

  return { purchaseOrders: rows, total: count };
};

const getById = async (tenantId, poId) => {
  const po = await db.PurchaseOrder.findOne({
    where: { id: poId, tenant_id: tenantId },
    include: [
      { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'] },
      { model: db.Company, as: 'company', required: false },
      { model: db.Supplier, as: 'supplier', required: false },
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

const _validateParty = async (tenantId, companyId, supplierId) => {
  const hasC = companyId != null && companyId !== '';
  const hasS = supplierId != null && supplierId !== '';
  if (hasC === hasS) {
    throw ApiError.badRequest('Specify exactly one of company (client) or supplier (vendor)');
  }
  if (hasC) {
    const company = await db.Company.findOne({ where: { id: companyId, tenant_id: tenantId } });
    if (!company) throw ApiError.badRequest('Company not found');
  }
  if (hasS) {
    const supplier = await db.Supplier.findOne({ where: { id: supplierId, tenant_id: tenantId } });
    if (!supplier) throw ApiError.badRequest('Supplier not found');
  }
  return { hasC, hasS };
};

const create = async (tenantId, data) => {
  const { dealId, companyId, supplierId, poDate, expectedDelivery, items, termsAndConditionsIds, status, dueDate } = data;

  await _validateParty(tenantId, companyId, supplierId);
  const hasC = companyId != null && companyId !== '';
  const hasS = supplierId != null && supplierId !== '';

  if (dealId) {
    const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
    if (!deal) throw ApiError.badRequest('Deal not found');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('At least one item is required');
  }

  const explicitStatus = status && String(status).trim();
  const defaultStatus = hasS ? 'approved' : 'draft';
  const resolvedStatus = explicitStatus || defaultStatus;

  const po = await db.sequelize.transaction(async (t) => {
    const newPo = await db.PurchaseOrder.create(
      {
        tenant_id: tenantId,
        deal_id: dealId || null,
        company_id: hasC ? companyId : null,
        supplier_id: hasS ? supplierId : null,
        po_date: poDate,
        expected_delivery: expectedDelivery || null,
        status: resolvedStatus,
        due_date: dueDate != null && dueDate !== '' ? dueDate : null,
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
  const { dealId, companyId, supplierId, poDate, expectedDelivery, items, termsAndConditionsIds, status, dueDate } = data;

  let nextCompanyId = po.company_id;
  let nextSupplierId = po.supplier_id;
  if (companyId !== undefined || supplierId !== undefined) {
    nextCompanyId = companyId !== undefined ? (companyId || null) : po.company_id;
    nextSupplierId = supplierId !== undefined ? (supplierId || null) : po.supplier_id;
    if (nextSupplierId) nextCompanyId = null;
    else if (nextCompanyId) nextSupplierId = null;
    await _validateParty(tenantId, nextCompanyId, nextSupplierId);
  }

  if (dealId !== undefined) {
    if (dealId) {
      const deal = await db.Deal.findOne({ where: { id: dealId, tenant_id: tenantId } });
      if (!deal) throw ApiError.badRequest('Deal not found');
    }
  }

  await db.sequelize.transaction(async (t) => {
    await po.update(
      {
        deal_id: dealId !== undefined ? (dealId || null) : po.deal_id,
        company_id: nextCompanyId,
        supplier_id: nextSupplierId,
        po_date: poDate ?? po.po_date,
        expected_delivery: expectedDelivery !== undefined ? expectedDelivery : po.expected_delivery,
        status: status !== undefined ? status : po.status,
        due_date: dueDate !== undefined ? (dueDate || null) : po.due_date,
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
