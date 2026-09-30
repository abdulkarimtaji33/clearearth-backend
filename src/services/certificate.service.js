/**
 * Certificate Management service
 */
const fs = require('fs');
const path = require('path');
const db = require('../models');
const config = require('../config');
const ApiError = require('../utils/apiError');
const { nextCertificateNumber } = require('../utils/referenceNumber');
const certificatePdfService = require('./certificatePdf.service');
const { Op } = db.Sequelize;

const CERTIFICATE_TYPES = [
  'green_certificate',
  'certificate_of_destruction',
  'certificate_of_data_destruction',
  'carbon_footprint',
  'destruction_report_evidence',
];

const requestIncludes = [
  { model: db.Grn, as: 'grn', required: false },
  { model: db.Deal, as: 'deal', attributes: ['id', 'deal_number', 'title'], required: false },
  { model: db.User, as: 'requestedByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
  { model: db.User, as: 'verifiedByUser', attributes: ['id', 'first_name', 'last_name', 'email'], required: false },
  { model: db.MaterialType, as: 'materialType', required: false },
  { model: db.CertificateRequestType, as: 'types', separate: true },
  { model: db.CertificateRequestAttachment, as: 'attachments', separate: true },
  { model: db.Certificate, as: 'certificates', separate: true, order: [['id', 'ASC']] },
];

/**
 * Server-side mirror of the frontend's mandatory-photo validation for
 * Destruction Report with Evidence requests (both itemized_equipment and
 * bulk_material variants require at least one photo).
 */
function assertPhotoRequirement(types, attachments) {
  const needsPhoto = Array.isArray(types) && types.includes('destruction_report_evidence');
  if (!needsPhoto) return;
  const hasPhoto = Array.isArray(attachments) && attachments.some((a) => (a.fileType || a.file_type) === 'destruction_photo');
  if (!hasPhoto) {
    throw ApiError.badRequest(
      'At least one photo is required for the Destruction Report with Evidence certificate type.'
    );
  }
}

const listRequests = async (tenantId, filters = {}) => {
  const { offset, limit, search, status, requestedBy } = filters;
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  if (requestedBy) where.requested_by = requestedBy;
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.or] = [
      { company_name: { [Op.like]: s } },
      { contact_person: { [Op.like]: s } },
      { grn_no: { [Op.like]: s } },
    ];
  }

  const { count, rows } = await db.CertificateRequest.findAndCountAll({
    where,
    include: requestIncludes,
    offset,
    limit,
    order: [['id', 'DESC']],
    distinct: true,
  });

  return { requests: rows.map((r) => r.get({ plain: true })), total: count };
};

const getRequestById = async (tenantId, id) => {
  const row = await db.CertificateRequest.findOne({ where: { id, tenant_id: tenantId }, include: requestIncludes });
  if (!row) throw ApiError.notFound('Certificate request not found');
  return row.get({ plain: true });
};

const createRequest = async (tenantId, userId, body) => {
  const {
    grnId, dealId, companyName, contactPerson, contactNo, contactEmail, collectionDate,
    grnNo, materialWasteDetails, totalWeightQuantity, invoiceNo, additionalNotes,
    certificateTypes = [], destructionReportVariant, wdsRefNo, docRef, reqNo, boeNo, barcode,
    materialTypeId, attachments = [],
  } = body;

  if (!companyName || !contactPerson || !contactNo || !contactEmail || !collectionDate || !materialWasteDetails) {
    throw ApiError.badRequest('Missing required fields for certificate request');
  }
  if (!Array.isArray(certificateTypes) || !certificateTypes.length) {
    throw ApiError.badRequest('Select at least one certificate type');
  }
  const invalidTypes = certificateTypes.filter((t) => !CERTIFICATE_TYPES.includes(t));
  if (invalidTypes.length) {
    throw ApiError.badRequest(`Invalid certificate type(s): ${invalidTypes.join(', ')}`);
  }

  assertPhotoRequirement(certificateTypes, attachments);

  if (grnId) {
    const grn = await db.Grn.findOne({ where: { id: grnId, tenant_id: tenantId } });
    if (!grn) throw ApiError.notFound('Linked GRN not found');
  }

  const t = await db.sequelize.transaction();
  try {
    const request = await db.CertificateRequest.create(
      {
        tenant_id: tenantId,
        grn_id: grnId || null,
        deal_id: dealId || null,
        company_name: companyName,
        contact_person: contactPerson,
        contact_no: contactNo,
        contact_email: contactEmail,
        collection_date: collectionDate,
        grn_no: grnNo || null,
        material_waste_details: materialWasteDetails,
        total_weight_quantity: parseFloat(totalWeightQuantity) || 0,
        invoice_no: invoiceNo || null,
        additional_notes: additionalNotes || null,
        destruction_report_variant: certificateTypes.includes('destruction_report_evidence')
          ? (destructionReportVariant || 'itemized_equipment')
          : null,
        wds_ref_no: wdsRefNo || null,
        doc_ref: docRef || null,
        req_no: reqNo || null,
        boe_no: boeNo || null,
        barcode: barcode || null,
        requested_by: userId,
        status: 'pending_verification',
        material_type_id: materialTypeId || null,
      },
      { transaction: t }
    );

    await db.CertificateRequestType.bulkCreate(
      certificateTypes.map((type) => ({ certificate_request_id: request.id, type })),
      { transaction: t }
    );

    if (Array.isArray(attachments) && attachments.length) {
      await db.CertificateRequestAttachment.bulkCreate(
        attachments.map((a) => ({
          certificate_request_id: request.id,
          file_path: a.filePath || a.file_path,
          file_name: a.fileName || a.file_name || null,
          file_type: a.fileType || a.file_type || 'other',
          photo_stage: a.photoStage || a.photo_stage || (
            (a.fileType || a.file_type) === 'destruction_photo' ? 'other' : null
          ),
        })),
        { transaction: t }
      );
    }

    await t.commit();
    return getRequestById(tenantId, request.id);
  } catch (e) {
    await t.rollback();
    throw e;
  }
};

const addAttachments = async (tenantId, requestId, attachments) => {
  const request = await db.CertificateRequest.findOne({ where: { id: requestId, tenant_id: tenantId } });
  if (!request) throw ApiError.notFound('Certificate request not found');
  if (!Array.isArray(attachments) || !attachments.length) throw ApiError.badRequest('No attachments provided');

  await db.CertificateRequestAttachment.bulkCreate(
    attachments.map((a) => ({
      certificate_request_id: requestId,
      file_path: a.filePath || a.file_path,
      file_name: a.fileName || a.file_name || null,
      file_type: a.fileType || a.file_type || 'other',
      photo_stage: a.photoStage || a.photo_stage || (
        (a.fileType || a.file_type) === 'destruction_photo' ? 'other' : null
      ),
    }))
  );

  return getRequestById(tenantId, requestId);
};

const verifyRequest = async (tenantId, requestId, userId, body = {}) => {
  const request = await db.CertificateRequest.findOne({ where: { id: requestId, tenant_id: tenantId } });
  if (!request) throw ApiError.notFound('Certificate request not found');

  const updates = {
    verified_by: userId,
    verified_at: new Date(),
    verification_notes: body.verificationNotes || body.verification_notes || null,
    status: 'verified',
  };

  // HR may correct/confirm intake values during verification.
  const editableFields = {
    companyName: 'company_name', contactPerson: 'contact_person', contactNo: 'contact_no',
    contactEmail: 'contact_email', collectionDate: 'collection_date', grnNo: 'grn_no',
    materialWasteDetails: 'material_waste_details', totalWeightQuantity: 'total_weight_quantity',
    invoiceNo: 'invoice_no', additionalNotes: 'additional_notes', materialTypeId: 'material_type_id',
  };
  for (const [inKey, dbKey] of Object.entries(editableFields)) {
    if (body[inKey] !== undefined) updates[dbKey] = body[inKey];
  }

  await request.update(updates);
  return getRequestById(tenantId, requestId);
};

/** Load the tenant-wide fallback (material_type_id = NULL) factor row, creating it with the spec's placeholder defaults if missing. */
async function ensureDefaultFactor(tenantId, transaction) {
  let row = await db.CarbonFootprintFactor.findOne({
    where: { tenant_id: tenantId, material_type_id: null },
    transaction,
  });
  if (!row) {
    row = await db.CarbonFootprintFactor.create(
      { tenant_id: tenantId, material_type_id: null, co2_factor_per_ton: 50, liters_factor_per_ton: 100, kg_factor_per_ton: 500 },
      { transaction }
    );
  }
  return row;
}

async function resolveCarbonFactor(tenantId, materialTypeId, transaction) {
  if (materialTypeId) {
    const row = await db.CarbonFootprintFactor.findOne({
      where: { tenant_id: tenantId, material_type_id: materialTypeId },
      transaction,
    });
    if (row) return row;
  }
  return ensureDefaultFactor(tenantId, transaction);
}

function ensureCertsDir() {
  const dir = path.join(config.upload.path, 'certificates');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function persistPdf(buffer, tenantId, certificateNumber) {
  const dir = ensureCertsDir();
  const safeName = `${certificateNumber.replace(/[^\w.-]+/g, '_')}.pdf`;
  const absPath = path.join(dir, safeName);
  fs.writeFileSync(absPath, buffer);
  return path.relative(config.upload.path, absPath).replace(/\\/g, '/');
}

/**
 * Generates one `certificates` row + PDF per requested type for a verified
 * request. Enforces the GRN-approval gate (only when the request has an
 * in-system linked GRN — free-text grn_no has nothing to check) and the
 * mandatory-photo rule for destruction_report_evidence.
 */
const generateCertificate = async (tenantId, userId, requestId, types) => {
  const request = await db.CertificateRequest.findOne({
    where: { id: requestId, tenant_id: tenantId },
    include: [
      { model: db.Grn, as: 'grn', required: false },
      { model: db.CertificateRequestType, as: 'types', separate: true },
      { model: db.CertificateRequestAttachment, as: 'attachments', separate: true },
    ],
  });
  if (!request) throw ApiError.notFound('Certificate request not found');

  const requestedTypes = Array.isArray(types) && types.length
    ? types
    : (request.types || []).map((t) => t.type);
  if (!requestedTypes.length) throw ApiError.badRequest('No certificate types selected for generation');
  const invalidTypes = requestedTypes.filter((t) => !CERTIFICATE_TYPES.includes(t));
  if (invalidTypes.length) throw ApiError.badRequest(`Invalid certificate type(s): ${invalidTypes.join(', ')}`);

  // GRN-approval gate — only applies when a real in-system GRN is linked.
  if (request.grn_id) {
    if (!request.grn || request.grn.status !== 'approved') {
      throw ApiError.badRequest(
        'Certificate generation is blocked: the linked GRN has not been approved yet. Ask operations to approve the GRN before generating certificates.'
      );
    }
  }

  // Defensive server-side re-check of the mandatory-photo rule at generation time too.
  assertPhotoRequirement(requestedTypes, (request.attachments || []).map((a) => a.get({ plain: true })));

  const generated = [];
  const t = await db.sequelize.transaction();
  try {
    for (const type of requestedTypes) {
      const certificateNumber = await nextCertificateNumber(db, tenantId, type, t);
      const cert = await db.Certificate.create(
        {
          tenant_id: tenantId,
          certificate_request_id: requestId,
          type,
          certificate_number: certificateNumber,
          issued_date: new Date().toISOString().slice(0, 10),
          generated_by: userId,
        },
        { transaction: t }
      );
      generated.push(cert);
    }

    await request.update({ status: 'generated' }, { transaction: t });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  // Render + persist PDFs and compute carbon-footprint values outside the
  // DB transaction (Puppeteer rendering must not hold a DB lock open).
  for (const cert of generated) {
    let extra = {};
    if (cert.type === 'carbon_footprint') {
      const factor = await resolveCarbonFactor(tenantId, request.material_type_id, null);
      const tons = parseFloat(request.total_weight_quantity) || 0;
      extra = {
        co2_saved: (tons * parseFloat(factor.co2_factor_per_ton)).toFixed(2),
        liters_saved: (tons * parseFloat(factor.liters_factor_per_ton)).toFixed(2),
        kg_saved: (tons * parseFloat(factor.kg_factor_per_ton)).toFixed(2),
      };
      await cert.update(extra);
    }

    const buffer = await certificatePdfService.generateCertificatePdf(tenantId, cert.id);
    const relPath = await persistPdf(buffer, tenantId, cert.certificate_number);
    await cert.update({ pdf_path: relPath });
  }

  return getRequestById(tenantId, requestId);
};

const listCertificates = async (tenantId, filters = {}) => {
  const { offset, limit, search, type, status, from, to } = filters;
  const where = { tenant_id: tenantId };
  if (type) where.type = type;
  if (from || to) {
    where.issued_date = {};
    if (from) where.issued_date[Op.gte] = from;
    if (to) where.issued_date[Op.lte] = to;
  }

  const requestWhere = {};
  if (search) {
    const s = `%${String(search).trim()}%`;
    requestWhere[Op.or] = [{ company_name: { [Op.like]: s } }, { contact_person: { [Op.like]: s } }];
  }
  if (status) requestWhere.status = status;

  const { count, rows } = await db.Certificate.findAndCountAll({
    where,
    include: [
      { model: db.CertificateRequest, as: 'request', where: Object.keys(requestWhere).length ? requestWhere : undefined, required: true },
      { model: db.CertificateItem, as: 'items', separate: true },
      { model: db.User, as: 'generatedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
    offset,
    limit,
    order: [['id', 'DESC']],
    distinct: true,
  });

  return { certificates: rows.map((r) => r.get({ plain: true })), total: count };
};

const getCertificateById = async (tenantId, id) => {
  const row = await db.Certificate.findOne({
    where: { id, tenant_id: tenantId },
    include: [
      { model: db.CertificateRequest, as: 'request', include: [{ model: db.MaterialType, as: 'materialType', required: false }] },
      { model: db.CertificateItem, as: 'items', separate: true },
      { model: db.User, as: 'generatedByUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    ],
  });
  if (!row) throw ApiError.notFound('Certificate not found');
  return row.get({ plain: true });
};

const listCarbonFactors = async (tenantId) => {
  const rows = await db.CarbonFootprintFactor.findAll({
    where: { tenant_id: tenantId },
    include: [{ model: db.MaterialType, as: 'materialType', required: false }],
    order: [['id', 'ASC']],
  });
  return rows.map((r) => r.get({ plain: true }));
};

const upsertCarbonFactor = async (tenantId, body) => {
  const { id, materialTypeId, co2FactorPerTon, litersFactorPerTon, kgFactorPerTon } = body;
  const payload = {
    tenant_id: tenantId,
    material_type_id: materialTypeId || null,
    co2_factor_per_ton: co2FactorPerTon != null ? parseFloat(co2FactorPerTon) : 50,
    liters_factor_per_ton: litersFactorPerTon != null ? parseFloat(litersFactorPerTon) : 100,
    kg_factor_per_ton: kgFactorPerTon != null ? parseFloat(kgFactorPerTon) : 500,
  };

  if (id) {
    const row = await db.CarbonFootprintFactor.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) throw ApiError.notFound('Carbon footprint factor not found');
    await row.update(payload);
    return row.get({ plain: true });
  }

  const existing = await db.CarbonFootprintFactor.findOne({
    where: { tenant_id: tenantId, material_type_id: payload.material_type_id },
  });
  if (existing) {
    await existing.update(payload);
    return existing.get({ plain: true });
  }
  const created = await db.CarbonFootprintFactor.create(payload);
  return created.get({ plain: true });
};

module.exports = {
  CERTIFICATE_TYPES,
  listRequests,
  getRequestById,
  createRequest,
  addAttachments,
  verifyRequest,
  generateCertificate,
  listCertificates,
  getCertificateById,
  listCarbonFactors,
  upsertCarbonFactor,
  resolveCarbonFactor,
  ensureDefaultFactor,
};
