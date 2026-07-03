const db = require('../models');
const ApiError = require('../utils/apiError');
const notificationService = require('./notification.service');
const { applyCreatedAtFilter } = require('../utils/dateRangeWhere');
const { isManagerRole, verifyLeadApprovalPin } = require('../utils/leadApproval');
const { assertManagerCanChangeStatus } = require('../utils/statusChangeGuard');
const { Op } = db.Sequelize;

const DEAL_STATUS = {
  NEW: 'new',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  QUOTATION_SENT: 'quotation_sent',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost',
};

const APPROVABLE_STATUSES = [DEAL_STATUS.NEW, DEAL_STATUS.PENDING_APPROVAL];
const PIPELINE_STATUSES = [DEAL_STATUS.APPROVED, DEAL_STATUS.QUOTATION_SENT, DEAL_STATUS.NEGOTIATION, DEAL_STATUS.WON];
const EDITABLE_STATUSES = [DEAL_STATUS.NEW, DEAL_STATUS.QUOTATION_SENT, DEAL_STATUS.NEGOTIATION, DEAL_STATUS.WON, DEAL_STATUS.LOST];

const _validateDownstreamSupplier = async (tenantId, supplierId, downstreamPartnerSupplierId) => {
  if (!downstreamPartnerSupplierId) return;
  if (supplierId && Number(supplierId) === Number(downstreamPartnerSupplierId)) {
    throw ApiError.badRequest('Downstream partner supplier must be different from the primary supplier');
  }
  const ds = await db.Supplier.findOne({ where: { id: downstreamPartnerSupplierId, tenant_id: tenantId } });
  if (!ds) throw ApiError.badRequest('Downstream partner supplier not found');
};

const _hasWdsContent = (w) => {
  if (!w) return false;
  if ((w.attachments || []).length > 0) return true;
  const fields = [
    'refNo', 'companyName', 'licenseNo', 'wasteDescription', 'containerNo',
    'sourceProcess', 'packageType', 'quantityPerPackage', 'totalWeight', 'purpose', 'blNo', 'borNo',
  ];
  return fields.some((f) => w[f]?.toString().trim());
};

const _mapWdsAttributes = (w) => ({
  ref_no: w.refNo?.trim() || null,
  date: w.date || null,
  company_name: w.companyName?.trim() || null,
  license_no: w.licenseNo?.trim() || null,
  waste_description: w.wasteDescription?.trim() || null,
  source_process: w.sourceProcess?.trim() || null,
  package_type: w.packageType?.trim() || null,
  quantity_per_package: w.quantityPerPackage?.trim() || null,
  total_weight: w.totalWeight?.trim() || null,
  container_no: w.containerNo?.trim() || null,
  purpose: w.purpose?.trim() || null,
  bl_no: w.blNo?.trim() || null,
  bor_no: w.borNo?.trim() || null,
});

const _saveDealWds = async (dealId, wdsDetails, transaction) => {
  if (!_hasWdsContent(wdsDetails)) return;
  const attrs = _mapWdsAttributes(wdsDetails);
  const existingWds = await db.DealWds.findOne({ where: { deal_id: dealId }, transaction });
  let wdsId;
  if (existingWds) {
    await existingWds.update(attrs, { transaction });
    wdsId = existingWds.id;
    await db.DealWdsAttachment.destroy({ where: { deal_wds_id: wdsId }, transaction });
  } else {
    const wds = await db.DealWds.create({ deal_id: dealId, ...attrs }, { transaction });
    wdsId = wds.id;
  }
  const attachments = wdsDetails.attachments || [];
  if (attachments.length > 0) {
    await db.DealWdsAttachment.bulkCreate(
      attachments.map((a) => ({
        deal_wds_id: wdsId,
        file_path: a.path || a.file_path,
        file_name: a.fileName || a.file_name || null,
      })),
      { transaction }
    );
  }
};

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
  const { offset, limit, search, status, paymentStatus, companyId, supplierId, contactId, assignedTo, productServiceId, minAmount, maxAmount, scopeUserId, dateFrom, dateTo } = filters;
  const where = { tenant_id: tenantId };

  if (scopeUserId) where.assigned_to = scopeUserId;
  if (search) {
    const s = String(search).trim();
    const or = [
      { title: { [Op.like]: `%${s}%` } },
      { deal_number: { [Op.like]: `%${s}%` } },
      { description: { [Op.like]: `%${s}%` } },
    ];
    const n = parseInt(s, 10);
    if (String(n) === s && n > 0) or.push({ id: n });
    where[Op.or] = or;
  }
  if (status) where.status = status;
  if (paymentStatus) where.payment_status = paymentStatus;
  if (companyId) where.company_id = companyId;
  if (supplierId) where.supplier_id = supplierId;
  if (contactId) where.contact_id = contactId;
  if (assignedTo) where.assigned_to = assignedTo;
  
  if (minAmount || maxAmount) {
    where.total = {};
    if (minAmount) where.total[Op.gte] = parseFloat(minAmount);
    if (maxAmount) where.total[Op.lte] = parseFloat(maxAmount);
  }

  let includeClause = [
    { model: db.Lead, as: 'lead', attributes: ['id', 'lead_number'], required: false },
    { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
    { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name'], required: false },
    { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
    { model: db.Supplier, as: 'downstreamPartner', attributes: ['id', 'company_name'], required: false },
    { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    {
      model: db.DealInspectionRequest,
      as: 'inspectionRequest',
      attributes: ['id', 'status', 'response_status', 'priority', 'rejection_reason'],
      required: false,
    },
    {
      model: db.DealInspectionReport,
      as: 'inspectionReport',
      attributes: ['id'],
      required: false,
    },
    {
      model: db.ProformaInvoice,
      as: 'proformaInvoices',
      attributes: ['id', 'proforma_number', 'total', 'currency', 'invoice_date'],
      required: false,
      include: [
        {
          model: db.TaxInvoice,
          as: 'taxInvoice',
          attributes: ['id', 'tax_invoice_number', 'total', 'payment_status', 'paid_amount'],
          required: false,
        },
      ],
    },
    {
      model: db.DealItem,
      as: 'items',
      include: [
        { model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'category'] },
      ],
      required: !!productServiceId,
    },
  ];

  applyCreatedAtFilter(where, dateFrom, dateTo);

  if (productServiceId) {
    includeClause = includeClause.map(inc => {
      if (inc.as === 'items') {
        return {
          ...inc,
          where: { product_service_id: productServiceId },
        };
      }
      return inc;
    });
  }

  const { count, rows } = await db.Deal.findAndCountAll({
    where,
    include: includeClause,
    offset,
    limit,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { deals: rows, total: count };
};

const getById = async (tenantId, dealId, scope = {}) => {
  const where = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) where.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({
    where,
    include: [
      { model: db.Lead, as: 'lead', required: false },
      { model: db.Company, as: 'company', required: false },
      { model: db.Contact, as: 'contact', required: false },
      { model: db.Supplier, as: 'supplier', required: false },
      { model: db.Supplier, as: 'downstreamPartner', attributes: ['id', 'company_name'], required: false },
      { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
      { model: db.TermsAndConditions, as: 'termsAndConditions', attributes: ['id', 'title', 'content'], required: false },
      { model: db.TermsAndConditions, as: 'termsList', through: { attributes: ['sort_order'] }, attributes: ['id', 'title', 'content'], required: false },
      { model: db.DealWds, as: 'wdsDetails', include: [{ model: db.DealWdsAttachment, as: 'attachments', required: false }], required: false },
      { model: db.DealImage, as: 'images', order: [['display_order', 'ASC']], required: false },
      {
        model: db.DealInspectionReport,
        as: 'inspectionReport',
        include: [
          { model: db.User, as: 'inspector', attributes: ['id', 'first_name', 'last_name'], required: false },
          { model: db.User, as: 'approvedBy', attributes: ['id', 'first_name', 'last_name'], required: false },
        ],
        required: false,
      },
      {
        model: db.DealInspectionRequest,
        as: 'inspectionRequest',
        include: [
          { model: db.MaterialType, as: 'materialType', attributes: ['id', 'value', 'display_name'], required: false },
          { model: db.User, as: 'requestedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
        ],
        required: false,
      },
      {
        model: db.DealItem,
        as: 'items',
        include: [
          { model: db.ProductService, as: 'productService' },
        ],
      },
      {
        model: db.WorkOrder,
        as: 'workOrders',
        attributes: ['id', 'title', 'status', 'deal_id', 'created_at', 'updated_at'],
        required: false,
        include: [
          {
            model: db.WorkOrderTask,
            as: 'tasks',
            attributes: ['id', 'type_of_work', 'work_type_id', 'status'],
            required: false,
            include: [{ model: db.WorkType, as: 'workType', attributes: ['id', 'name'], required: false }],
          },
        ],
      },
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoices',
        required: false,
        include: [
          {
            model: db.TaxInvoice,
            as: 'taxInvoice',
            required: false,
          },
        ],
      },
    ],
  });
  if (!deal) throw ApiError.notFound('Deal not found');
  if (deal.workOrders?.length) {
    deal.workOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    deal.workOrders.forEach((wo) => {
      if (wo.tasks?.length) wo.tasks.sort((a, b) => a.id - b.id);
    });
  }
  return deal;
};

const create = async (tenantId, data, scope = {}, actor = null) => {
  const transaction = await db.sequelize.transaction();

  try {
    const assignedTo = scope.scopeUserId || data.assignedTo;

    await _validateDownstreamSupplier(tenantId, data.supplierId, data.downstreamPartnerSupplierId);

    let items = data.items || [];
    if (items.length === 0 && data.leadId) {
      const lead = await db.Lead.findOne({
        where: { id: data.leadId, tenant_id: tenantId },
        include: [{ model: db.ProductService, as: 'productService', required: false }],
        transaction,
      });
      if (lead?.product_service_id) {
        const ps = lead.productService;
        const unitPrice = ps?.price ? parseFloat(ps.price) : (lead.estimated_value ? parseFloat(lead.estimated_value) : 0);
        items = [{
          productServiceId: lead.product_service_id,
          quantity: 1,
          unitPrice,
          unitOfMeasure: ps?.unit_of_measure || null,
        }];
      }
    }

    // Calculate totals
    const totals = calculateDealTotals(items, data.vatPercentage || 5);

    // Create deal
    const deal = await db.Deal.create(
      {
        tenant_id: tenantId,
        lead_id: data.leadId || null,
        company_id: data.companyId || null,
        contact_id: data.contactId || null,
        supplier_id: data.supplierId || null,
        downstream_partner_supplier_id: data.downstreamPartnerSupplierId || null,
        title: data.title,
        description: data.description,
        deal_date: data.dealDate || new Date(),
        subtotal: totals.subtotal,
        vat_percentage: data.vatPercentage || 5,
        vat_amount: totals.vatAmount,
        total: totals.total,
        currency: data.currency || 'AED',
        terms_and_conditions_id: (Array.isArray(data.termsAndConditionsIds) && data.termsAndConditionsIds.length > 0)
          ? data.termsAndConditionsIds[0]
          : (data.termsAndConditionsId || null),
        deal_type: data.dealType || 'offer_to_purchase',
        container_type: data.containerType || null,
        location_type: data.locationType || null,
        wds_required: data.wdsRequired || false,
        inspection_required: data.inspectionRequired || false,
        custom_inspection: data.customInspection || false,
        trakhees_inspection: data.trakheesInspection || false,
        dubai_municipality_inspection: data.dubaiMunicipalityInspection || false,
        is_rcm_applicable: data.isRcmApplicable || false,
        status: DEAL_STATUS.NEW,
        loss_reason: data.lossReason || null,
        payment_status: 'unpaid',
        paid_amount: 0,
        assigned_to: assignedTo || null,
        notes: data.notes,
      },
      { transaction }
    );

    await deal.update({ deal_number: String(deal.id) }, { transaction });

    // Create inspection request if provided
    if (data.inspectionRequired && data.inspectionDetails) {
      const insp = data.inspectionDetails;
      await db.DealInspectionRequest.create(
        {
          deal_id: deal.id,
          material_type_id: insp.materialTypeId || null,
          location: insp.location || null,
          location_type: insp.locationType || null,
          gate_pass_requirement: insp.gatePassRequirement || null,
          service_type: insp.serviceType || null,
          quantity: insp.quantityUom === 'lumpsum' ? null : (insp.quantity || null),
          quantity_uom: insp.quantityUom || null,
          lumpsum_price: insp.quantityUom === 'lumpsum' ? (insp.lumpsumPrice || null) : null,
          safety_tools_required: Array.isArray(insp.safetyTools) && insp.safetyTools.length > 0,
          safety_tools: Array.isArray(insp.safetyTools) && insp.safetyTools.length > 0 ? JSON.stringify(insp.safetyTools) : null,
          supporting_documents: insp.supportingDocuments || null,
          requested_by: insp.requestedBy || null,
          notes: insp.notes || null,
          priority: insp.priority || 'medium',
        },
        { transaction }
      );
    }

    // WDS flag can be set without details; details are optional until filled in later
    if (data.wdsRequired && data.wdsDetails) {
      await _saveDealWds(deal.id, data.wdsDetails, transaction);
    }

    // Create deal items
    if (items.length > 0) {
      const invalidItems = items.filter((item) => !item.productServiceId);
      if (invalidItems.length > 0) {
        throw ApiError.badRequest('Each line item must have a product/service selected');
      }
      const itemsToCreate = items.map(item => ({
        deal_id: deal.id,
        product_service_id: item.productServiceId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2),
        notes: item.notes || null,
        unit_of_measure: item.unitOfMeasure != null && String(item.unitOfMeasure).trim() !== '' ? String(item.unitOfMeasure).trim() : null,
      }));

      await db.DealItem.bulkCreate(itemsToCreate, { transaction });
    }

    // Create deal images if provided
    if (data.images && data.images.length > 0) {
      const imagesToCreate = data.images.map((img, idx) => ({
        deal_id: deal.id,
        file_path: img.path || img.file_path,
        display_order: idx,
      }));
      await db.DealImage.bulkCreate(imagesToCreate, { transaction });
    }

    // Create deal_terms for multi-select Terms and Conditions
    const termsIds = Array.isArray(data.termsAndConditionsIds) ? data.termsAndConditionsIds
      : (data.termsAndConditionsId ? [data.termsAndConditionsId] : []);
    if (termsIds.length > 0) {
      await db.DealTerm.bulkCreate(
        termsIds.map((tid, idx) => ({
          deal_id: deal.id,
          terms_and_conditions_id: tid,
          sort_order: idx,
        })),
      { transaction }
    );
    }

    // Mark lead as converted if connected
    if (data.leadId) {
      await db.Lead.update(
        { status: 'converted' },
        { where: { id: data.leadId, tenant_id: tenantId }, transaction }
      );
    }

    await transaction.commit();
    return await getById(tenantId, deal.id);
  } catch (error) {
    if (!transaction.finished) {
    await transaction.rollback();
    }
    throw error;
  }
};

const update = async (tenantId, dealId, data, scope = {}, actor = null) => {
  const transaction = await db.sequelize.transaction();

  try {
    const dealWhere = { id: dealId, tenant_id: tenantId };
    if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
    const deal = await db.Deal.findOne({
      where: dealWhere,
      include: [
        { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
        { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      ],
      transaction,
    });
    if (!deal) throw ApiError.notFound('Deal not found');

    const previousStatus = deal.status;

    let nextStatus = deal.status;
    if (data.status !== undefined && data.status !== deal.status) {
      assertManagerCanChangeStatus(actor, deal.status, data.status, 'deals');
      if (deal.status === DEAL_STATUS.PENDING_APPROVAL && data.status !== DEAL_STATUS.LOST) {
        throw ApiError.badRequest('Deal is awaiting approval');
      }
      if (data.status === DEAL_STATUS.APPROVED || data.status === DEAL_STATUS.PENDING_APPROVAL) {
        throw ApiError.badRequest('Deal approval is required. Use the approval workflow.');
      }
      if (!EDITABLE_STATUSES.includes(data.status)) {
        throw ApiError.badRequest('Deal status cannot be set directly. Use the approval workflow.');
      }
      if ([DEAL_STATUS.QUOTATION_SENT, DEAL_STATUS.NEGOTIATION, DEAL_STATUS.WON].includes(data.status)
        && !PIPELINE_STATUSES.includes(deal.status)) {
        throw ApiError.badRequest('Deal must be approved before changing to this status');
      }
      nextStatus = data.status;
    }

    const nextSupplierId = data.supplierId !== undefined ? data.supplierId : deal.supplier_id;
    const nextDownstreamId = data.downstreamPartnerSupplierId !== undefined ? data.downstreamPartnerSupplierId : deal.downstream_partner_supplier_id;
    await _validateDownstreamSupplier(tenantId, nextSupplierId, nextDownstreamId);

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
        downstream_partner_supplier_id: data.downstreamPartnerSupplierId !== undefined ? data.downstreamPartnerSupplierId : deal.downstream_partner_supplier_id,
        title: data.title !== undefined ? data.title : deal.title,
        description: data.description !== undefined ? data.description : deal.description,
        deal_date: data.dealDate !== undefined ? data.dealDate : deal.deal_date,
        subtotal: totals ? totals.subtotal : deal.subtotal,
        vat_percentage: data.vatPercentage !== undefined ? data.vatPercentage : deal.vat_percentage,
        vat_amount: totals ? totals.vatAmount : deal.vat_amount,
        total: totals ? totals.total : deal.total,
        currency: data.currency !== undefined ? data.currency : deal.currency,
        deal_type: data.dealType !== undefined ? data.dealType : deal.deal_type,
        container_type: data.containerType !== undefined ? data.containerType : deal.container_type,
        location_type: data.locationType !== undefined ? data.locationType : deal.location_type,
        wds_required: data.wdsRequired !== undefined ? data.wdsRequired : deal.wds_required,
        inspection_required: data.inspectionRequired !== undefined ? data.inspectionRequired : deal.inspection_required,
        custom_inspection: data.customInspection !== undefined ? data.customInspection : deal.custom_inspection,
        trakhees_inspection: data.trakheesInspection !== undefined ? data.trakheesInspection : deal.trakhees_inspection,
        dubai_municipality_inspection: data.dubaiMunicipalityInspection !== undefined ? data.dubaiMunicipalityInspection : deal.dubai_municipality_inspection,
        is_rcm_applicable: data.isRcmApplicable !== undefined ? data.isRcmApplicable : deal.is_rcm_applicable,
        status: nextStatus,
        loss_reason: data.lossReason !== undefined ? data.lossReason : deal.loss_reason,
        payment_status: deal.payment_status,
        paid_amount: deal.paid_amount,
        service_payment_status: data.servicePaymentStatus !== undefined ? (data.servicePaymentStatus || null) : deal.service_payment_status,
        assigned_to: scope.scopeUserId ? scope.scopeUserId : (data.assignedTo !== undefined ? data.assignedTo : deal.assigned_to),
        terms_and_conditions_id: (() => {
          if (Array.isArray(data.termsAndConditionsIds)) return data.termsAndConditionsIds.length > 0 ? data.termsAndConditionsIds[0] : null;
          if (data.termsAndConditionsId !== undefined) return data.termsAndConditionsId;
          return deal.terms_and_conditions_id;
        })(),
        notes: data.notes !== undefined ? data.notes : deal.notes,
        pickup_location: data.pickupLocation !== undefined ? data.pickupLocation : deal.pickup_location,
        pickup_contact_name: data.pickupContactName !== undefined ? data.pickupContactName : deal.pickup_contact_name,
        pickup_contact_number: data.pickupContactNumber !== undefined ? data.pickupContactNumber : deal.pickup_contact_number,
      },
      { transaction }
    );

    // Handle WDS details (optional when wds_required is true)
    if (data.wdsRequired && data.wdsDetails) {
      await _saveDealWds(dealId, data.wdsDetails, transaction);
    } else if (data.wdsRequired === false) {
      const wdsRows = await db.DealWds.findAll({ where: { deal_id: dealId }, attributes: ['id'], transaction });
      for (const row of wdsRows) {
        await db.DealWdsAttachment.destroy({ where: { deal_wds_id: row.id }, transaction });
      }
      await db.DealWds.destroy({ where: { deal_id: dealId }, transaction });
    }

    // Handle inspection request
    if (data.inspectionRequired && data.inspectionDetails) {
      const insp = data.inspectionDetails;
      const existingInsp = await db.DealInspectionRequest.findOne({ where: { deal_id: dealId }, transaction });
      const inspPayload = {
        material_type_id: insp.materialTypeId || null,
        location: insp.location || null,
        location_type: insp.locationType || null,
        gate_pass_requirement: insp.gatePassRequirement || null,
        service_type: insp.serviceType || null,
        quantity: insp.quantityUom === 'lumpsum' ? null : (insp.quantity || null),
        quantity_uom: insp.quantityUom || null,
        lumpsum_price: insp.quantityUom === 'lumpsum' ? (insp.lumpsumPrice || null) : null,
        safety_tools_required: Array.isArray(insp.safetyTools) && insp.safetyTools.length > 0,
        safety_tools: Array.isArray(insp.safetyTools) && insp.safetyTools.length > 0 ? JSON.stringify(insp.safetyTools) : null,
        supporting_documents: insp.supportingDocuments || null,
        requested_by: insp.requestedBy || null,
        notes: insp.notes || null,
        priority: insp.priority || existingInsp?.priority || 'medium',
      };
      if (existingInsp) {
        await existingInsp.update(inspPayload, { transaction });
      } else {
        await db.DealInspectionRequest.create({ deal_id: dealId, ...inspPayload }, { transaction });
      }
    } else if (data.inspectionRequired === false) {
      await db.DealInspectionRequest.destroy({ where: { deal_id: dealId }, transaction });
    }

    // Update deal_terms (multi-select Terms and Conditions)
    if (data.termsAndConditionsIds !== undefined || data.termsAndConditionsId !== undefined) {
      await db.DealTerm.destroy({ where: { deal_id: dealId }, transaction });
      const termsIds = Array.isArray(data.termsAndConditionsIds) ? data.termsAndConditionsIds
        : (data.termsAndConditionsId ? [data.termsAndConditionsId] : []);
      if (termsIds.length > 0) {
        await db.DealTerm.bulkCreate(
          termsIds.map((tid, idx) => ({
            deal_id: dealId,
            terms_and_conditions_id: tid,
            sort_order: idx,
          })),
          { transaction }
        );
      }
    }

    // Update deal items if provided
    if (data.items) {
      // Delete existing items
      await db.DealItem.destroy({ where: { deal_id: dealId }, transaction });

      // Create new items
      if (data.items.length > 0) {
        const invalidItems = data.items.filter((item) => !item.productServiceId);
        if (invalidItems.length > 0) {
          throw ApiError.badRequest('Each line item must have a product/service selected');
        }
        const itemsToCreate = data.items.map(item => ({
          deal_id: dealId,
          product_service_id: item.productServiceId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2),
          notes: item.notes || null,
          unit_of_measure: item.unitOfMeasure != null && String(item.unitOfMeasure).trim() !== '' ? String(item.unitOfMeasure).trim() : null,
        }));

        await db.DealItem.bulkCreate(itemsToCreate, { transaction });
      }
    }

    // Handle deal images if provided
    if (data.images !== undefined) {
      await db.DealImage.destroy({ where: { deal_id: dealId }, transaction });
      if (data.images && data.images.length > 0) {
        const imagesToCreate = data.images.map((img, idx) => ({
          deal_id: dealId,
          file_path: img.path || img.file_path,
          display_order: idx,
        }));
        await db.DealImage.bulkCreate(imagesToCreate, { transaction });
      }
    }

    await transaction.commit();

    const newStatus = nextStatus;
    if (['won', 'lost'].includes(newStatus) && previousStatus !== newStatus) {
      try {
        await notificationService.notifyDealStatusChange(tenantId, deal, previousStatus, newStatus, actor);
      } catch (err) {
        console.warn('[Notification] deal status change skipped:', err.message);
      }
    }

    return await getById(tenantId, dealId);
  } catch (error) {
    if (!transaction.finished) {
    await transaction.rollback();
    }
    throw error;
  }
};

const updatePayment = async (tenantId, dealId, paidAmount, scope = {}) => {
  const where = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) where.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where });
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

/** Pickup/collection fields only — for operations staff without full deals.update */
const updateCollectionDetails = async (tenantId, dealId, data, scope = {}) => {
  const where = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) where.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where });
  if (!deal) throw ApiError.notFound('Deal not found');

  await deal.update({
    pickup_location: data.pickupLocation !== undefined ? data.pickupLocation : deal.pickup_location,
    pickup_contact_name: data.pickupContactName !== undefined ? data.pickupContactName : deal.pickup_contact_name,
    pickup_contact_number: data.pickupContactNumber !== undefined ? data.pickupContactNumber : deal.pickup_contact_number,
  });

  return await getById(tenantId, dealId);
};

const remove = async (tenantId, dealId, scope = {}) => {
  const where = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) where.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where });
  if (!deal) throw ApiError.notFound('Deal not found');

  await deal.destroy();
};

const INSPECTION_ROLES = ['inspection_team', 'inspection'];
const INSPECTION_REPORT_APPROVER_ROLES = ['sales', 'sales_manager', 'operations_manager', 'admin', 'tenant_admin', 'super_admin'];

const saveInspectionReport = async (tenantId, dealId, data, scope = {}, actor = {}) => {
  const where = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) where.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where });
  if (!deal) throw ApiError.notFound('Deal not found');

  const existing = await db.DealInspectionReport.findOne({
    where: { deal_id: dealId },
  });

  const roleName = actor.roleName;
  const isInspectorRole = INSPECTION_ROLES.includes(roleName);
  const canApproveReport = INSPECTION_REPORT_APPROVER_ROLES.includes(roleName);

  let inspectorId = data.inspectorId || null;
  if (isInspectorRole) {
    inspectorId = actor.userId || inspectorId;
  } else if (!inspectorId) {
    throw ApiError.badRequest('Inspector is required');
  }

  let approvedById = existing?.approved_by_id || null;
  if (canApproveReport && data.approvedById != null) {
    approvedById = data.approvedById;
  } else if (!canApproveReport && data.approvedById != null && data.approvedById !== existing?.approved_by_id) {
    throw ApiError.forbidden('Only sales, sales manager, operations manager, or admin can approve inspection reports');
  }

  const payload = {
    deal_id: dealId,
    inspection_datetime: data.inspectionDatetime || null,
    approximate_weight: data.approximateWeight != null ? data.approximateWeight : null,
    weight_uom: data.weightUom || null,
    cargo_type: data.cargoType || null,
    transportation_arrangement: data.transportationArrangement || null,
    approximate_value: data.approximateValue != null ? data.approximateValue : null,
    images: data.images && data.images.length > 0 ? data.images : null,
    inspector_id: inspectorId,
    approved_by_id: approvedById,
    notes: data.notes || null,
  };

  if (existing) {
    await existing.update(payload);
  } else {
    await db.DealInspectionReport.create(payload);
  }

  const inspectionRequest = await db.DealInspectionRequest.findOne({ where: { deal_id: dealId } });
  if (inspectionRequest && inspectionRequest.status !== 'report_submitted') {
    await inspectionRequest.update({ status: 'report_submitted' });
  }

  return await getById(tenantId, dealId);
};

const _approveDeal = async (deal, { approvedByUserId }) => {
  if (deal.status === DEAL_STATUS.WON || deal.status === DEAL_STATUS.LOST) {
    throw ApiError.badRequest('Deal is already closed');
  }
  if (deal.status === DEAL_STATUS.APPROVED) {
    throw ApiError.badRequest('Deal is already approved');
  }
  if (!APPROVABLE_STATUSES.includes(deal.status)) {
    throw ApiError.badRequest('Deal cannot be approved in its current status');
  }

  await deal.update({
    status: DEAL_STATUS.APPROVED,
    approved_by: approvedByUserId || null,
    approved_at: new Date(),
    approval_requested_at: null,
  });
};

const approve = async (tenantId, dealId, scope = {}, actor = {}) => {
  if (!isManagerRole(actor, 'deals')) {
    throw ApiError.forbidden('Only a manager can approve deals. Use the approval PIN or request manager approval.');
  }

  const dealWhere = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where: dealWhere });
  if (!deal) throw ApiError.notFound('Deal not found');

  await _approveDeal(deal, { approvedByUserId: actor.userId });

  return await getById(tenantId, dealId);
};

const requestApproval = async (tenantId, dealId, scope = {}, requestedByUser = null) => {
  const dealWhere = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({
    where: dealWhere,
    include: [
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
    ],
  });
  if (!deal) throw ApiError.notFound('Deal not found');

  if (deal.status === DEAL_STATUS.APPROVED || PIPELINE_STATUSES.includes(deal.status)) {
    throw ApiError.badRequest('Deal is already approved');
  }
  if (deal.status === DEAL_STATUS.PENDING_APPROVAL) {
    throw ApiError.badRequest('Approval has already been requested');
  }
  if (deal.status !== DEAL_STATUS.NEW) {
    throw ApiError.badRequest('Deal cannot be submitted for approval in its current status');
  }

  await deal.update({
    status: DEAL_STATUS.PENDING_APPROVAL,
    approval_requested_at: new Date(),
  });

  await notificationService.notifyDealApprovalRequested(tenantId, deal, requestedByUser);

  return await getById(tenantId, dealId);
};

const approveWithPin = async (tenantId, dealId, pin, scope = {}, actor = {}) => {
  const dealWhere = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where: dealWhere });
  if (!deal) throw ApiError.notFound('Deal not found');

  const pinValid = await verifyLeadApprovalPin(tenantId, pin);
  if (!pinValid) {
    throw ApiError.forbidden('Invalid approval PIN');
  }

  await _approveDeal(deal, { approvedByUserId: actor.userId });

  return await getById(tenantId, dealId);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePayment,
  updateCollectionDetails,
  remove,
  saveInspectionReport,
  approve,
  requestApproval,
  approveWithPin,
};
