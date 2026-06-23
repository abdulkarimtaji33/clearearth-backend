/**
 * Quotation Service
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const notificationService = require('./notification.service');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { isManagerRole, verifyLeadApprovalPin } = require('../utils/leadApproval');
const { assertManagerCanChangeStatus } = require('../utils/statusChangeGuard');
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
const EDITABLE_STATUSES = [
  QUOTATION_STATUS.NEW,
  QUOTATION_STATUS.SENT,
  QUOTATION_STATUS.UNDER_REVIEW,
  QUOTATION_STATUS.REVISED,
  QUOTATION_STATUS.REJECTED,
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

  const quotation = await db.Quotation.create({
    tenant_id: tenantId,
    deal_id: dealId,
    prepared_by: effectivePreparedBy,
    quotation_date: quotationDate,
    quotation_amount: parseFloat(quotationAmount) || 0,
    currency: 'AED',
    status: QUOTATION_STATUS.NEW,
    version: existingCount + 1,
    remarks: remarks || null,
  });

  return getById(tenantId, quotation.id);
};

const update = async (tenantId, quotationId, data, scope = {}, actor = null) => {
  const quotation = await getById(tenantId, quotationId, scope);
  const { dealId, preparedBy, quotationDate, quotationAmount, status, remarks } = data;

  if (quotation.status === QUOTATION_STATUS.APPROVED) {
    throw ApiError.badRequest('Approved quotations cannot be edited');
  }

  if (dealId) {
    const dealWhere = { id: dealId, tenant_id: tenantId };
    if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
    const deal = await db.Deal.findOne({ where: dealWhere });
    if (!deal) throw ApiError.badRequest('Deal not found');
  }
  const effectivePreparedBy = scope.scopeUserId || preparedBy;
  if (effectivePreparedBy) {
    const user = await db.User.findOne({ where: { id: effectivePreparedBy, tenant_id: tenantId } });
    if (!user) throw ApiError.badRequest('User not found');
  }

  let nextStatus = quotation.status;
  if (status !== undefined) {
    assertManagerCanChangeStatus(actor, quotation.status, status);
    if (quotation.status === QUOTATION_STATUS.PENDING_APPROVAL && status !== QUOTATION_STATUS.REJECTED) {
      throw ApiError.badRequest('Quotation is awaiting approval');
    }
    if (status === QUOTATION_STATUS.APPROVED || status === QUOTATION_STATUS.PENDING_APPROVAL) {
      throw ApiError.badRequest('Quotation approval is required. Use the approval workflow.');
    }
    if (!EDITABLE_STATUSES.includes(status)) {
      throw ApiError.badRequest('Quotation status cannot be set directly. Use the approval workflow.');
    }
    nextStatus = status;
  }

  await quotation.update({
    deal_id: dealId ?? quotation.deal_id,
    prepared_by: effectivePreparedBy ?? quotation.prepared_by,
    quotation_date: quotationDate ?? quotation.quotation_date,
    quotation_amount: quotationAmount !== undefined ? parseFloat(quotationAmount) : quotation.quotation_amount,
    status: nextStatus,
    remarks: remarks !== undefined ? remarks : quotation.remarks,
  });

  return getById(tenantId, quotation.id);
};

const _approveQuotation = async (quotation, { approvedByUserId }) => {
  if (quotation.status === QUOTATION_STATUS.APPROVED) {
    throw ApiError.badRequest('Quotation is already approved');
  }
  if (quotation.status === QUOTATION_STATUS.REJECTED) {
    throw ApiError.badRequest('Rejected quotations cannot be approved');
  }
  if (!APPROVABLE_STATUSES.includes(quotation.status)) {
    throw ApiError.badRequest('Quotation cannot be approved in its current status');
  }

  await quotation.update({
    status: QUOTATION_STATUS.APPROVED,
    approved_by: approvedByUserId || null,
    approved_at: new Date(),
    approval_requested_at: null,
  });
};

const approve = async (tenantId, quotationId, scope = {}, actor = {}) => {
  if (!isManagerRole(actor.roleName)) {
    throw ApiError.forbidden('Only a manager can approve quotations. Use the approval PIN or request manager approval.');
  }

  const where = { id: quotationId, tenant_id: tenantId };
  if (scope.scopeUserId) where.prepared_by = scope.scopeUserId;
  const quotation = await db.Quotation.findOne({ where });
  if (!quotation) throw ApiError.notFound('Quotation not found');

  await _approveQuotation(quotation, { approvedByUserId: actor.userId });

  return await getById(tenantId, quotationId);
};

const requestApproval = async (tenantId, quotationId, scope = {}, requestedByUser = null) => {
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
  });

  await notificationService.notifyQuotationApprovalRequested(tenantId, quotation, requestedByUser);

  return await getById(tenantId, quotationId);
};

const approveWithPin = async (tenantId, quotationId, pin, scope = {}, actor = {}) => {
  const where = { id: quotationId, tenant_id: tenantId };
  if (scope.scopeUserId) where.prepared_by = scope.scopeUserId;
  const quotation = await db.Quotation.findOne({ where });
  if (!quotation) throw ApiError.notFound('Quotation not found');

  const pinValid = await verifyLeadApprovalPin(tenantId, pin);
  if (!pinValid) {
    throw ApiError.forbidden('Invalid approval PIN');
  }

  await _approveQuotation(quotation, { approvedByUserId: actor.userId });

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
  approveWithPin,
};

