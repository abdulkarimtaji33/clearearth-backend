const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;

const calculateDealTotals = (items, vatPercentage = 5) => {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
  }, 0);
  
  const vatAmount = (subtotal * parseFloat(vatPercentage)) / 100;
  const total = subtotal + vatAmount;
  
  return {
    subtotal: subtotal.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    total: total.toFixed(2),
  };
};

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, paymentStatus, companyId, supplierId } = filters;
  const where = { tenant_id: tenantId };

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { deal_number: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }
  if (status) where.status = status;
  if (paymentStatus) where.payment_status = paymentStatus;
  if (companyId) where.company_id = companyId;
  if (supplierId) where.supplier_id = supplierId;

  const { count, rows } = await db.Deal.findAndCountAll({
    where,
    include: [
      { model: db.Lead, as: 'lead', attributes: ['id', 'lead_number'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
      { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name'], required: false },
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
      {
        model: db.DealItem,
        as: 'items',
        include: [
          { model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'category'] },
        ],
      },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { deals: rows, total: count };
};

const getById = async (tenantId, dealId) => {
  const deal = await db.Deal.findOne({
    where: { id: dealId, tenant_id: tenantId },
    include: [
      { model: db.Lead, as: 'lead', required: false },
      { model: db.Company, as: 'company', required: false },
      { model: db.Contact, as: 'contact', required: false },
      { model: db.Supplier, as: 'supplier', required: false },
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      {
        model: db.DealItem,
        as: 'items',
        include: [
          { model: db.ProductService, as: 'productService' },
        ],
      },
    ],
  });
  if (!deal) throw ApiError.notFound('Deal not found');
  return deal;
};

const create = async (tenantId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const dealNumber = generateReferenceNumber('DEAL');

    // Calculate totals
    const totals = calculateDealTotals(data.items || [], data.vatPercentage || 5);

    // Create deal
    const deal = await db.Deal.create(
      {
        tenant_id: tenantId,
        deal_number: dealNumber,
        lead_id: data.leadId || null,
        company_id: data.companyId || null,
        contact_id: data.contactId || null,
        supplier_id: data.supplierId || null,
        title: data.title,
        description: data.description,
        deal_date: data.dealDate || new Date(),
        subtotal: totals.subtotal,
        vat_percentage: data.vatPercentage || 5,
        vat_amount: totals.vatAmount,
        total: totals.total,
        currency: data.currency || 'AED',
        status: data.status || 'draft',
        payment_status: 'unpaid',
        paid_amount: 0,
        assigned_to: data.assignedTo || null,
        notes: data.notes,
      },
      { transaction }
    );

    // Create deal items
    if (data.items && data.items.length > 0) {
      const itemsToCreate = data.items.map(item => ({
        deal_id: deal.id,
        product_service_id: item.productServiceId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2),
        notes: item.notes || null,
      }));

      await db.DealItem.bulkCreate(itemsToCreate, { transaction });
    }

    await transaction.commit();
    return await getById(tenantId, deal.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const update = async (tenantId, dealId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const deal = await db.Deal.findOne({
      where: { id: dealId, tenant_id: tenantId },
      transaction,
    });
    if (!deal) throw ApiError.notFound('Deal not found');

    // Calculate new totals if items provided
    let totals = null;
    if (data.items) {
      totals = calculateDealTotals(data.items, data.vatPercentage || deal.vat_percentage);
    }

    // Update deal
    await deal.update(
      {
        lead_id: data.leadId !== undefined ? data.leadId : deal.lead_id,
        company_id: data.companyId !== undefined ? data.companyId : deal.company_id,
        contact_id: data.contactId !== undefined ? data.contactId : deal.contact_id,
        supplier_id: data.supplierId !== undefined ? data.supplierId : deal.supplier_id,
        title: data.title !== undefined ? data.title : deal.title,
        description: data.description !== undefined ? data.description : deal.description,
        deal_date: data.dealDate !== undefined ? data.dealDate : deal.deal_date,
        subtotal: totals ? totals.subtotal : deal.subtotal,
        vat_percentage: data.vatPercentage !== undefined ? data.vatPercentage : deal.vat_percentage,
        vat_amount: totals ? totals.vatAmount : deal.vat_amount,
        total: totals ? totals.total : deal.total,
        currency: data.currency !== undefined ? data.currency : deal.currency,
        status: data.status !== undefined ? data.status : deal.status,
        payment_status: data.paymentStatus !== undefined ? data.paymentStatus : deal.payment_status,
        paid_amount: data.paidAmount !== undefined ? data.paidAmount : deal.paid_amount,
        assigned_to: data.assignedTo !== undefined ? data.assignedTo : deal.assigned_to,
        notes: data.notes !== undefined ? data.notes : deal.notes,
      },
      { transaction }
    );

    // Update deal items if provided
    if (data.items) {
      // Delete existing items
      await db.DealItem.destroy({ where: { deal_id: dealId }, transaction });

      // Create new items
      if (data.items.length > 0) {
        const itemsToCreate = data.items.map(item => ({
          deal_id: dealId,
          product_service_id: item.productServiceId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2),
          notes: item.notes || null,
        }));

        await db.DealItem.bulkCreate(itemsToCreate, { transaction });
      }
    }

    await transaction.commit();
    return await getById(tenantId, dealId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const updatePayment = async (tenantId, dealId, paidAmount) => {
  const deal = await db.Deal.findOne({
    where: { id: dealId, tenant_id: tenantId },
  });
  if (!deal) throw ApiError.notFound('Deal not found');

  const totalPaid = parseFloat(paidAmount);
  const totalAmount = parseFloat(deal.total);

  let paymentStatus = 'unpaid';
  if (totalPaid >= totalAmount) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  await deal.update({
    paid_amount: totalPaid,
    payment_status: paymentStatus,
  });

  return await getById(tenantId, dealId);
};

const remove = async (tenantId, dealId) => {
  const deal = await db.Deal.findOne({
    where: { id: dealId, tenant_id: tenantId },
  });
  if (!deal) throw ApiError.notFound('Deal not found');

  await deal.destroy();
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePayment,
  remove,
};
