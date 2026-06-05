/**
 * Purchase Order Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');

const normalizePoItems = (items, existingItems = [], isBill = false) => {
  return items.map((it, i) => {
    const existing = existingItems[i];
    const price = isBill && existing ? String(existing.price ?? '') : String(it.price ?? '');
    const productServiceId = isBill && existing ? existing.product_service_id : it.productServiceId;
    const itemDescription = isBill && existing
      ? (existing.item_description || null)
      : (it.itemDescription || null);
    const qty = parseFloat(it.quantity) || 0;
    const priceNum = parseFloat(price) || 0;
    const total = (qty * priceNum).toFixed(2);
    return {
      productServiceId,
      itemDescription,
      quantity: String(it.quantity ?? ''),
      price,
      total,
    };
  });
};

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
      {
        model: db.WorkOrder,
        as: 'sourceWorkOrder',
        attributes: ['id', 'title', 'status'],
        required: false,
        include: [
          {
            model: db.PurchaseOrder,
            as: 'purchaseBills',
            attributes: ['id', 'title', 'status', 'company_id', 'supplier_id', 'document_type'],
            required: false,
          },
        ],
      },
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
      {
        model: db.WorkOrder,
        as: 'sourceWorkOrder',
        attributes: ['id', 'title', 'status'],
        required: false,
        include: [
          {
            model: db.PurchaseOrder,
            as: 'purchaseBills',
            attributes: ['id', 'title', 'status', 'company_id', 'supplier_id', 'document_type'],
            required: false,
          },
        ],
      },
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
  const { dealId, companyId, supplierId, poDate, expectedDelivery, items, termsAndConditionsIds, status, dueDate, workOrderId, documentType } = data;

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
  const defaultStatus = hasS ? 'approved' : 'new';
  const resolvedStatus = explicitStatus || defaultStatus;
  const isBill = documentType === 'bill';
  const normalizedItems = normalizePoItems(items, [], isBill);

  if (isBill && workOrderId) {
    const dupWhere = {
      tenant_id: tenantId,
      work_order_id: workOrderId,
      document_type: 'bill',
    };
    if (hasC) dupWhere.company_id = companyId;
    if (hasS) dupWhere.supplier_id = supplierId;
    const existingBill = await db.PurchaseOrder.findOne({ where: dupWhere, attributes: ['id'] });
    if (existingBill) {
      throw ApiError.badRequest('A purchase bill already exists for this work order and party');
    }
  }

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
        work_order_id: workOrderId || null,
        document_type: documentType === 'bill' ? 'bill' : 'quotation',
      },
      { transaction: t }
    );

    for (let i = 0; i < normalizedItems.length; i++) {
      const it = normalizedItems[i];
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

    // GL: Dr Cost of Services (5000) / Cr AP (2000) if created directly as 'approved'
    if (resolvedStatus === 'approved') {
      try {
        const poTotal = items.reduce((s, it) => s + (parseFloat(it.total || 0)), 0);
        if (poTotal > 0.005) {
          const cosId = await jeService.getSystemAccountId(tenantId, '5000');
          const apId  = await jeService.getSystemAccountId(tenantId, '2000');
          await jeService.createJournalEntry(tenantId, 1, {
            entryDate: poDate || new Date().toISOString().slice(0, 10),
            description: `PO Approved — PO #${newPo.id}`,
            sourceType: 'purchase_order_approved',
            sourceId: newPo.id,
            lines: [
              { accountId: cosId, debit: poTotal, credit: 0 },
              { accountId: apId,  debit: 0,       credit: poTotal },
            ],
          }, t);
        }
      } catch (jeErr) {
        console.warn('[GL] purchase_order_approved (create) journal entry skipped:', jeErr.message);
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

  const prevStatus = po.status;

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
      const isBill = String(po.document_type).toLowerCase() === 'bill';
      const normalizedItems = normalizePoItems(items, po.items || [], isBill);
      await db.PurchaseOrderItem.destroy({ where: { purchase_order_id: po.id }, transaction: t });
      for (let i = 0; i < normalizedItems.length; i++) {
        const it = normalizedItems[i];
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

    // GL: Dr Cost of Services (5000) / Cr Accounts Payable (2000) — only when status transitions to 'approved'
    const nextStatus = status !== undefined ? status : po.status;
    const becomingApproved = prevStatus !== 'approved' && nextStatus === 'approved';

    if (becomingApproved) {
      try {
        // Re-fetch updated items for accurate total
        const updatedItems = items && Array.isArray(items) ? items : po.items || [];
        const poTotal = updatedItems.reduce((s, it) => s + (parseFloat(it.total || it.line_total || 0)), 0);

        if (poTotal > 0.005) {
          const cosId = await jeService.getSystemAccountId(tenantId, '5000');
          const apId  = await jeService.getSystemAccountId(tenantId, '2000');
          await jeService.createJournalEntry(tenantId, 1, {
            entryDate: poDate || po.po_date || new Date().toISOString().slice(0, 10),
            description: `PO Approved — PO #${po.id}`,
            sourceType: 'purchase_order_approved',
            sourceId: po.id,
            lines: [
              { accountId: cosId, debit: poTotal, credit: 0 },
              { accountId: apId,  debit: 0,       credit: poTotal },
            ],
          }, t);
        }
      } catch (jeErr) {
        console.warn('[GL] purchase_order_approved journal entry skipped:', jeErr.message);
      }
    }
  });

  return getById(tenantId, po.id);
};

const remove = async (tenantId, poId) => {
  const po = await getById(tenantId, poId);
  await po.destroy();
};

const _dealItemsToBillLines = (dealItems) => dealItems.map((it) => ({
  productServiceId: it.product_service_id,
  itemDescription: it.notes || null,
  quantity: String(it.quantity ?? ''),
  price: String(it.unit_price ?? ''),
  total: String(it.line_total ?? ''),
}));

const _ensurePurchaseBillForWorkOrderParty = async (tenantId, workOrderId, party) => {
  const isClient = party === 'client';
  const existingWhere = {
    tenant_id: tenantId,
    work_order_id: workOrderId,
    document_type: 'bill',
  };
  if (isClient) {
    existingWhere.company_id = { [Op.ne]: null };
  } else {
    existingWhere.supplier_id = { [Op.ne]: null };
  }
  const existing = await db.PurchaseOrder.findOne({ where: existingWhere });
  if (existing) return existing;

  const wo = await db.WorkOrder.findOne({
    where: { id: workOrderId, tenant_id: tenantId },
    include: [{
      model: db.Deal,
      as: 'deal',
      include: [{ model: db.DealItem, as: 'items' }],
    }],
  });
  if (!wo?.deal || wo.deal.deal_type !== 'offer_to_purchase') return null;

  const dealItems = wo.deal.items || [];
  if (dealItems.length === 0) return null;

  const items = _dealItemsToBillLines(dealItems);
  const base = {
    dealId: wo.deal_id,
    poDate: new Date().toISOString().slice(0, 10),
    items,
    status: 'approved',
    documentType: 'bill',
    workOrderId,
  };

  if (isClient) {
    const companyId = wo.deal.company_id;
    if (!companyId) return null;
    return create(tenantId, { ...base, companyId, supplierId: null });
  }

  const supplierId = wo.deal.downstream_partner_supplier_id || wo.deal.supplier_id;
  if (!supplierId) return null;
  return create(tenantId, { ...base, supplierId, companyId: null });
};

const ensurePurchaseBillForWorkOrder = async (tenantId, workOrderId) => {
  const clientBill = await _ensurePurchaseBillForWorkOrderParty(tenantId, workOrderId, 'client');
  const vendorBill = await _ensurePurchaseBillForWorkOrderParty(tenantId, workOrderId, 'vendor');
  return vendorBill || clientBill || null;
};

module.exports = { getAll, getById, create, update, remove, ensurePurchaseBillForWorkOrder };
