/**
 * Inspection Request Service - List and manage inspection requests
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters = {}) => {
  const { offset, limit, search, dealId, scopeUserId } = filters;

  const dealWhere = { tenant_id: tenantId };
  if (scopeUserId) dealWhere.assigned_to = scopeUserId;
  if (dealId) dealWhere.id = dealId;
  if (search) {
    dealWhere[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { deal_number: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await db.DealInspectionRequest.findAndCountAll({
    include: [
      {
        model: db.Deal,
        as: 'deal',
        where: dealWhere,
        required: true,
        attributes: ['id', 'title', 'deal_number', 'deal_date', 'status'],
        include: [
          { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
          { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
          {
            model: db.DealInspectionReport,
            as: 'inspectionReport',
            required: false,
          },
        ],
      },
      { model: db.MaterialType, as: 'materialType', attributes: ['id', 'value', 'display_name'], required: false },
      { model: db.User, as: 'requestedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { inspectionRequests: rows, total: count };
};

const getById = async (tenantId, requestId, scope = {}) => {
  const dealWhere = { tenant_id: tenantId };
  if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
  const request = await db.DealInspectionRequest.findOne({
    where: { id: requestId },
    include: [
      {
        model: db.Deal,
        as: 'deal',
        where: dealWhere,
        required: true,
        include: [
          { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
          { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
          {
            model: db.DealInspectionReport,
            as: 'inspectionReport',
            include: [
              { model: db.User, as: 'inspector', attributes: ['id', 'first_name', 'last_name'], required: false },
              { model: db.User, as: 'approvedBy', attributes: ['id', 'first_name', 'last_name'], required: false },
            ],
            required: false,
          },
        ],
      },
      { model: db.MaterialType, as: 'materialType', attributes: ['id', 'value', 'display_name'], required: false },
      { model: db.User, as: 'requestedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
  });

  if (!request) throw ApiError.notFound('Inspection request not found');
  return request;
};

module.exports = { getAll, getById };
