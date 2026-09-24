/**
 * Quotation Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const notificationService = require('./notification.service');
const { nextReferenceNumber } = require('../utils/referenceNumber');
const SERVICE_QUOTATION_SEED = 654; // old ERP's last service quotation was QT/SERV/654/1
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { isManagerRole } = require('../utils/leadApproval');
const { Op } = db.Sequelize;

const QUOTATION_STATUS = {
  NEW: 'new',
  SENT: 'sent',
  UNDER_REVIEW: 'under_review',
  REVISED: 'revised',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const APPROVABLE_STATUSES = [
  QUOTATION_STATUS.NEW,
  QUOTATION_STATUS.SENT,
  QUOTATION_STATUS.UNDER_REVIEW,
  QUOTATION_STATUS.REVISED,
  QUOTATION_STATUS.PENDING_APPROVAL,
];
const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, statusNot, dealId, scopeUserId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  if (scopeUserId) where.prepared_by = scopeUserId;
  if (status) {
    where.status = status;
  } else if (statusNot) {
    where.status = { [Op.ne]: statusNot };
  }
  if (dealId) where.deal_id = dealId;

  const dealWhereForSearch = () => {
    if (!search) return undefined;
    const s = String(search).trim();
    const or = [
      { title: { [Op.like]: `%${s}%` } },
      { deal_number: { [Op.like]: `%${s}%` } },
    ];
    const n = parseInt(s, 10);
    if (String(n) === s && n > 0) or.push({ id: n });
    return { [Op.or]: or };
  };
  const dealInclude = {
    model: db.Deal,
    as: 'deal',
    attributes: ['id', 'title', 'deal_number'],
    required: !search,
    where: dealWhereForSearch(),
    include: [
      {
        model: db.DealItem,
        as: 'items',
        attributes: ['id'],
        required: false,
      },
    ],
  };
  if (search) dealInclude.required = true;
  applyDateOnlyColumnFilter(where, 'quotation_date', dateFrom, dateTo);

  const { count, rows } = await db.Quotation.findAndCountAll({
    where,
    include: [
      dealInclude,
      { model: db.User, as: 'preparedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
      { model: db.WorkOrder, as: 'workOrder', attributes: ['id', 'title', 'status'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
    subQuery: false,
  });

  return { quotations: rows, total: count };
};

const getById = async (tenantId, quotationId, scope = {}) => {
  const where = { id: quotationId, tenant_id: tenantId };
  if (scope.scopeUserId) where.prepared_by = scope.scopeUserId;
  const quotation = await db.Quotation.findOne({
    where,
    include: [
      {
        model: db.Deal,
        as: 'deal',
        include: [
          {
            model: db.DealItem,
            as: 'items',
            include: [{ model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'unit_of_measure'] }],
          },
        ],
      },
      { model: db.User, as: 'preparedByUser', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: db.WorkOrder, as: 'workOrder', attributes: ['id', 'title', 'status'], required: false },
      { model: db.ProformaInvoice, as: 'proformaInvoice', attributes: ['id', 'proforma_number'], required: false },
    ],
  });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return quotation;
};

const create = async (tenantId, data, scope = {}) => {
  const { dealId, preparedBy, quotationDate, quotationAmount, remarks } = data;

  const dealWhere = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where: dealWhere });
  if (!deal) throw ApiError.badRequest('Deal not found');
  const quotableStatuses = ['approved', 'quotation_sent', 'negotiation', 'won'];
  if (!quotableStatuses.includes(deal.status)) {
    throw ApiError.badRequest('Deal must be approved before creating a quotation');
  }

  const effectivePreparedBy = scope.scopeUserId || preparedBy;
  const user = await db.User.findOne({ where: { id: effectivePreparedBy, tenant_id: tenantId } });
  if (!user) throw ApiError.badRequest('User not found');

  const existingCount = await db.Quotation.count({ where: { tenant_id: tenantId, deal_id: dealId } });

  const quotation = await db.sequelize.transaction(async (t) => {
    const referenceNumber = await nextReferenceNumber(db.Quotation, SERVICE_QUOTATION_SEED, t);
    return db.Quotation.create(
      {
        tenant_id: tenantId,
        deal_id: dealId,
        prepared_by: effectivePreparedBy,
        quotation_date: quotationDate,
        quotation_amount: parseFloat(quotationAmount) || 0,
        currency: 'AED',
        status: QUOTATION_STATUS.NEW,
        version: existingCount + 1,
        reference_number: referenceNumber,
        remarks: remarks || null,
      },
      { transaction: t }
    );
  });

  return getById(tenantId, quotation.id);
};

const update = async (tenantId, quotationId, data, scope = {}, actor = null) => {
  throw ApiError.badRequest('Quotations cannot be edited after creation');
};

const _approveQuotation = async (quotation, { approvedByUserId, requestedPickupDate }) => {
  if (quotation.status === QUOTATION_STATUS.APPROVED) {
    throw ApiError.badRequest('Quotation is already approved');
  }
  if (quotation.status === QUOTATION_STATUS.REJECTED) {
    throw ApiError.badRequest('Rejected quotations cannot be approved');
  }
  if (!APPROVABLE_STATUSES.includes(quotation.status)) {
    throw ApiError.badRequest('Quotation cannot be approved in its current status');
  }

  const pickupDate = requestedPickupDate || quotation.requested_pickup_date || null;

  await quotation.update({
    status: QUOTATION_STATUS.APPROVED,
    approved_by: approvedByUserId || null,
    approved_at: new Date(),
    approval_requested_at: null,
    requested_pickup_date: pickupDate,
    pickup_date_status: pickupDate ? 'pending' : null,
    confirmed_pickup_date: null,
    pickup_reschedule_note: null,
  });
};

/** Approved service quotations convert straight into their work order — no separate manual step. */
const _autoCreateWorkOrder = async (tenantId, quotation, userId) => {
  const existing = await db.WorkOrder.findOne({ where: { tenant_id: tenantId, quotation_id: quotation.id } });
  if (existing) return existing;
  const workOrderService = require('./workOrder.service');
  try {
    return await workOrderService.create(tenantId, { quotationId: quotation.id, dealId: quotation.deal_id }, { userId });
  } catch (err) {
    console.warn('[quotation.approve] auto work order creation skipped:', err.message);
    return null;
  }
};

const approve = async (tenantId, quotationId, scope = {}, actor = {}, requestedPickupDate = null) => {
  if (!isManagerRole(actor.roleName) && actor.roleName !== 'sales') {
    throw ApiError.forbidden('Only a manager can approve quotations. Request manager approval instead.');
  }

  const where = { id: quotationId, tenant_id: tenantId };
  if (scope.scopeUserId) where.prepared_by = scope.scopeUserId;
  const quotation = await db.Quotation.findOne({
    where,
    include: [{ model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false }],
  });
  if (!quotation) throw ApiError.notFound('Quotation not found');

  await _approveQuotation(quotation, { approvedByUserId: actor.userId, requestedPickupDate });
  await _autoCreateWorkOrder(tenantId, quotation, actor.userId);

  const approvedByUser = actor.userId ? await db.User.findByPk(actor.userId, { attributes: ['first_name', 'last_name'] }) : null;
  await notificationService.notifyQuotationApproved(tenantId, quotation, approvedByUser);

  return await getById(tenantId, quotationId);
};

/** Operations confirms the sales-requested pickup date. */
const confirmPickupDate = async (tenantId, quotationId, actor = {}) => {
  const quotation = await db.Quotation.findOne({ where: { id: quotationId, tenant_id: tenantId } });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  if (quotation.status !== QUOTATION_STATUS.APPROVED) {
    throw ApiError.badRequest('Only approved quotations have a pickup date to confirm');
  }
  if (!quotation.requested_pickup_date) {
    throw ApiError.badRequest('No pickup date has been requested for this quotation');
  }

  await quotation.update({
    pickup_date_status: 'confirmed',
    confirmed_pickup_date: quotation.requested_pickup_date,
    pickup_reschedule_note: null,
  });

  const confirmedByUser = actor.userId ? await db.User.findByPk(actor.userId, { attributes: ['first_name', 'last_name'] }) : null;
  await notificationService.notifyPickupDateConfirmed(tenantId, 'quotation', quotation, quotation.prepared_by, confirmedByUser);

  return await getById(tenantId, quotationId);
};

/** Operations requests a different pickup date instead of confirming. */
const requestPickupReschedule = async (tenantId, quotationId, actor = {}, note = null) => {
  const quotation = await db.Quotation.findOne({ where: { id: quotationId, tenant_id: tenantId } });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  if (quotation.status !== QUOTATION_STATUS.APPROVED) {
    throw ApiError.badRequest('Only approved quotations have a pickup date to reschedule');
  }
  if (!quotation.requested_pickup_date) {
    throw ApiError.badRequest('No pickup date has been requested for this quotation');
  }

  await quotation.update({
    pickup_date_status: 'reschedule_requested',
    pickup_reschedule_note: note || null,
  });

  const requestedByUser = actor.userId ? await db.User.findByPk(actor.userId, { attributes: ['first_name', 'last_name'] }) : null;
  await notificationService.notifyPickupRescheduleRequested(tenantId, 'quotation', quotation, quotation.prepared_by, requestedByUser, note);

  return await getById(tenantId, quotationId);
};

/** Sales submits a new pickup date after operations requested a reschedule. */
const reschedulePickupDate = async (tenantId, quotationId, scope = {}, actor = {}, newPickupDate) => {
  if (!newPickupDate) throw ApiError.badRequest('New pickup date is required');
  const where = { id: quotationId, tenant_id: tenantId };
  if (scope.scopeUserId) where.prepared_by = scope.scopeUserId;
  const quotation = await db.Quotation.findOne({ where });
  if (!quotation) throw ApiError.notFound('Quotation not found');
  if (quotation.pickup_date_status !== 'reschedule_requested') {
    throw ApiError.badRequest('Operations has not requested a reschedule for this quotation');
  }

  await quotation.update({
    requested_pickup_date: newPickupDate,
    pickup_date_status: 'pending',
    pickup_reschedule_note: null,
  });

  const rescheduledByUser = actor.userId ? await db.User.findByPk(actor.userId, { attributes: ['first_name', 'last_name'] }) : null;
  await notificationService.notifyPickupDateRescheduled(tenantId, 'quotation', quotation, rescheduledByUser);

  return await getById(tenantId, quotationId);
};

const requestApproval = async (tenantId, quotationId, scope = {}, requestedByUser = null, requestedPickupDate = null) => {
  const where = { id: quotationId, tenant_id: tenantId };
  if (scope.scopeUserId) where.prepared_by = scope.scopeUserId;
  const quotation = await db.Quotation.findOne({
    where,
    include: [
      { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
    ],
  });
  if (!quotation) throw ApiError.notFound('Quotation not found');

  if (quotation.status === QUOTATION_STATUS.APPROVED) {
    throw ApiError.badRequest('Quotation is already approved');
  }
  if (quotation.status === QUOTATION_STATUS.REJECTED) {
    throw ApiError.badRequest('Rejected quotations cannot be submitted for approval');
  }
  if (quotation.status === QUOTATION_STATUS.PENDING_APPROVAL) {
    throw ApiError.badRequest('Approval has already been requested');
  }
  if (![QUOTATION_STATUS.NEW, QUOTATION_STATUS.SENT, QUOTATION_STATUS.UNDER_REVIEW, QUOTATION_STATUS.REVISED].includes(quotation.status)) {
    throw ApiError.badRequest('Quotation cannot be submitted for approval in its current status');
  }

  await quotation.update({
    status: QUOTATION_STATUS.PENDING_APPROVAL,
    approval_requested_at: new Date(),
    requested_pickup_date: requestedPickupDate || null,
  });

  await notificationService.notifyQuotationApprovalRequested(tenantId, quotation, requestedByUser);

  return await getById(tenantId, quotationId);
};

const remove = async (tenantId, quotationId, scope = {}) => {
  const quotation = await getById(tenantId, quotationId, scope);
  await quotation.destroy();
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  approve,
  requestApproval,
  confirmPickupDate,
  requestPickupReschedule,
  reschedulePickupDate,
};

