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
  const { offset, limit, search, status, paymentStatus, companyId, supplierId, contactId, assignedTo, productServiceId, minAmount, maxAmount, scopeUserId } = filters;
  const where = { tenant_id: tenantId };

  if (scopeUserId) where.assigned_to = scopeUserId;
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
    { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    {
      model: db.DealItem,
      as: 'items',
      include: [
        { model: db.ProductService, as: 'productService', attributes: ['id', 'name', 'category'] },
      ],
      required: !!productServiceId,
    },
  ];

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
    ],
  });
  if (!deal) throw ApiError.notFound('Deal not found');
  return deal;
};

const create = async (tenantId, data, scope = {}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const dealNumber = generateReferenceNumber('DEAL');
    const assignedTo = scope.scopeUserId || data.assignedTo;

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
        status: data.status || 'draft',
        payment_status: 'unpaid',
        paid_amount: 0,
        assigned_to: assignedTo || null,
        notes: data.notes,
      },
      { transaction }
    );

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
          quantity: insp.quantity || null,
          quantity_uom: insp.quantityUom || null,
          safety_tools_required: insp.safetyToolsRequired || false,
          supporting_documents: insp.supportingDocuments || null,
          requested_by: insp.requestedBy || null,
          notes: insp.notes || null,
        },
        { transaction }
      );
    }

    // Create WDS details if provided
    if (data.wdsRequired && data.wdsDetails) {
      const w = data.wdsDetails;
      if (!w.refNo?.trim() || !w.date || !w.companyName?.trim() || !w.licenseNo?.trim() || !w.wasteDescription?.trim() || !w.containerNo?.trim()) {
        throw ApiError.badRequest('WDS required fields missing: Ref No, Date, Company Name, License No, Waste Description, Container No');
      }
      const wds = await db.DealWds.create(
        {
          deal_id: deal.id,
          ref_no: data.wdsDetails.refNo,
          date: data.wdsDetails.date,
          company_name: data.wdsDetails.companyName,
          license_no: data.wdsDetails.licenseNo,
          waste_description: data.wdsDetails.wasteDescription,
          source_process: data.wdsDetails.sourceProcess || null,
          package_type: data.wdsDetails.packageType || null,
          quantity_per_package: data.wdsDetails.quantityPerPackage || null,
          total_weight: data.wdsDetails.totalWeight || null,
          container_no: data.wdsDetails.containerNo,
          purpose: data.wdsDetails.purpose || null,
          bl_no: data.wdsDetails.blNo || null,
          bor_no: data.wdsDetails.borNo || null,
        },
        { transaction }
      );
      const attachments = data.wdsDetails.attachments || [];
      if (attachments.length > 0) {
        await db.DealWdsAttachment.bulkCreate(
          attachments.map(a => ({
            deal_wds_id: wds.id,
            file_path: a.path || a.file_path,
            file_name: a.fileName || a.file_name || null,
          })),
          { transaction }
        );
      }
    }

    // Create deal items
    if (data.items && data.items.length > 0) {
      const invalidItems = data.items.filter((item) => !item.productServiceId);
      if (invalidItems.length > 0) {
        throw ApiError.badRequest('Each line item must have a product/service selected');
      }
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

const update = async (tenantId, dealId, data, scope = {}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const dealWhere = { id: dealId, tenant_id: tenantId };
    if (scope.scopeUserId) dealWhere.assigned_to = scope.scopeUserId;
    const deal = await db.Deal.findOne({
      where: dealWhere,
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
        deal_type: data.dealType !== undefined ? data.dealType : deal.deal_type,
        container_type: data.containerType !== undefined ? data.containerType : deal.container_type,
        location_type: data.locationType !== undefined ? data.locationType : deal.location_type,
        wds_required: data.wdsRequired !== undefined ? data.wdsRequired : deal.wds_required,
        inspection_required: data.inspectionRequired !== undefined ? data.inspectionRequired : deal.inspection_required,
        custom_inspection: data.customInspection !== undefined ? data.customInspection : deal.custom_inspection,
        trakhees_inspection: data.trakheesInspection !== undefined ? data.trakheesInspection : deal.trakhees_inspection,
        dubai_municipality_inspection: data.dubaiMunicipalityInspection !== undefined ? data.dubaiMunicipalityInspection : deal.dubai_municipality_inspection,
        status: data.status !== undefined ? data.status : deal.status,
        payment_status: data.paymentStatus !== undefined ? data.paymentStatus : deal.payment_status,
        paid_amount: data.paidAmount !== undefined ? data.paidAmount : deal.paid_amount,
        assigned_to: scope.scopeUserId ? scope.scopeUserId : (data.assignedTo !== undefined ? data.assignedTo : deal.assigned_to),
        terms_and_conditions_id: (() => {
          if (Array.isArray(data.termsAndConditionsIds)) return data.termsAndConditionsIds.length > 0 ? data.termsAndConditionsIds[0] : null;
          if (data.termsAndConditionsId !== undefined) return data.termsAndConditionsId;
          return deal.terms_and_conditions_id;
        })(),
        notes: data.notes !== undefined ? data.notes : deal.notes,
      },
      { transaction }
    );

    // Handle WDS details
    if (data.wdsRequired && data.wdsDetails) {
      const w = data.wdsDetails;
      if (!w.refNo?.trim() || !w.date || !w.companyName?.trim() || !w.licenseNo?.trim() || !w.wasteDescription?.trim() || !w.containerNo?.trim()) {
        throw ApiError.badRequest('WDS required fields missing: Ref No, Date, Company Name, License No, Waste Description, Container No');
      }
      const existingWds = await db.DealWds.findOne({ where: { deal_id: dealId }, transaction });

      if (existingWds) {
        await existingWds.update(
          {
            ref_no: data.wdsDetails.refNo,
            date: data.wdsDetails.date,
            company_name: data.wdsDetails.companyName,
            license_no: data.wdsDetails.licenseNo,
            waste_description: data.wdsDetails.wasteDescription,
            source_process: data.wdsDetails.sourceProcess || null,
            package_type: data.wdsDetails.packageType || null,
            quantity_per_package: data.wdsDetails.quantityPerPackage || null,
            total_weight: data.wdsDetails.totalWeight || null,
            container_no: data.wdsDetails.containerNo,
            purpose: data.wdsDetails.purpose || null,
            bl_no: data.wdsDetails.blNo || null,
            bor_no: data.wdsDetails.borNo || null,
          },
          { transaction }
        );
        await db.DealWdsAttachment.destroy({ where: { deal_wds_id: existingWds.id }, transaction });
        const attachments = data.wdsDetails.attachments || [];
        if (attachments.length > 0) {
          await db.DealWdsAttachment.bulkCreate(
            attachments.map(a => ({
              deal_wds_id: existingWds.id,
              file_path: a.path || a.file_path,
              file_name: a.fileName || a.file_name || null,
            })),
            { transaction }
          );
        }
      } else {
        const wds = await db.DealWds.create(
          {
            deal_id: dealId,
            ref_no: data.wdsDetails.refNo,
            date: data.wdsDetails.date,
            company_name: data.wdsDetails.companyName,
            license_no: data.wdsDetails.licenseNo,
            waste_description: data.wdsDetails.wasteDescription,
            source_process: data.wdsDetails.sourceProcess || null,
            package_type: data.wdsDetails.packageType || null,
            quantity_per_package: data.wdsDetails.quantityPerPackage || null,
            total_weight: data.wdsDetails.totalWeight || null,
            container_no: data.wdsDetails.containerNo,
            purpose: data.wdsDetails.purpose || null,
            bl_no: data.wdsDetails.blNo || null,
            bor_no: data.wdsDetails.borNo || null,
          },
          { transaction }
        );
        const attachments = data.wdsDetails.attachments || [];
        if (attachments.length > 0) {
          await db.DealWdsAttachment.bulkCreate(
            attachments.map(a => ({
              deal_wds_id: wds.id,
              file_path: a.path || a.file_path,
              file_name: a.fileName || a.file_name || null,
            })),
            { transaction }
          );
        }
      }
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
        quantity: insp.quantity || null,
        quantity_uom: insp.quantityUom || null,
        safety_tools_required: insp.safetyToolsRequired || false,
        supporting_documents: insp.supportingDocuments || null,
        requested_by: insp.requestedBy || null,
        notes: insp.notes || null,
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

const remove = async (tenantId, dealId, scope = {}) => {
  const where = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) where.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where });
  if (!deal) throw ApiError.notFound('Deal not found');

  await deal.destroy();
};

const saveInspectionReport = async (tenantId, dealId, data, scope = {}) => {
  const where = { id: dealId, tenant_id: tenantId };
  if (scope.scopeUserId) where.assigned_to = scope.scopeUserId;
  const deal = await db.Deal.findOne({ where });
  if (!deal) throw ApiError.notFound('Deal not found');

  const existing = await db.DealInspectionReport.findOne({
    where: { deal_id: dealId },
  });

  const payload = {
    deal_id: dealId,
    inspection_datetime: data.inspectionDatetime || null,
    approximate_weight: data.approximateWeight != null ? data.approximateWeight : null,
    weight_uom: data.weightUom || null,
    cargo_type: data.cargoType || null,
    transportation_arrangement: data.transportationArrangement || null,
    approximate_value: data.approximateValue != null ? data.approximateValue : null,
    images: data.images && data.images.length > 0 ? data.images : null,
    inspector_id: data.inspectorId || null,
    approved_by_id: data.approvedById || null,
    notes: data.notes || null,
  };

  if (existing) {
    await existing.update(payload);
  } else {
    await db.DealInspectionReport.create(payload);
  }

  return await getById(tenantId, dealId);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePayment,
  remove,
  saveInspectionReport,
};
