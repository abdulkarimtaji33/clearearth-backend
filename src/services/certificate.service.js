const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, certificateType, clientId, jobId } = filters;
  const where = { tenant_id: tenantId };

  if (search) where.certificate_number = { [Op.like]: `%${search}%` };
  if (certificateType) where.certificate_type = certificateType;
  if (clientId) where.client_id = clientId;
  if (jobId) where.job_id = jobId;

  const { count, rows } = await db.Certificate.findAndCountAll({
    where,
    include: [
      { model: db.CertificateTemplate, as: 'template', attributes: ['id', 'name'] },
      { model: db.Job, as: 'job', attributes: ['id', 'job_number'] },
      { model: db.Client, as: 'client', attributes: ['id', 'company_name'] },
      { model: db.User, as: 'issuer', attributes: ['id', 'first_name', 'last_name'] },
    ],
    offset,
    limit,
    order: [['issue_date', 'DESC']],
  });

  return { certificates: rows, total: count };
};

const getById = async (tenantId, certificateId) => {
  const certificate = await db.Certificate.findOne({
    where: { id: certificateId, tenant_id: tenantId },
    include: [
      { model: db.CertificateTemplate, as: 'template' },
      { model: db.Job, as: 'job' },
      { model: db.Client, as: 'client' },
      { model: db.Lot, as: 'lot' },
      { model: db.User, as: 'issuer' },
    ],
  });

  if (!certificate) throw ApiError.notFound('Certificate not found');
  return certificate;
};

const create = async (tenantId, userId, data) => {
  const certificateNumber = generateReferenceNumber('CERT');

  // Generate QR code data
  const qrData = `${certificateNumber}|${data.certificateType}|${new Date().toISOString()}`;

  const certificate = await db.Certificate.create({
    tenant_id: tenantId,
    certificate_number: certificateNumber,
    certificate_type: data.certificateType,
    template_id: data.templateId,
    job_id: data.jobId,
    client_id: data.clientId,
    lot_id: data.lotId,
    issue_date: data.issueDate || new Date(),
    expiry_date: data.expiryDate,
    material_description: data.materialDescription,
    quantity: data.quantity,
    unit_of_measure: data.unitOfMeasure,
    service_description: data.serviceDescription,
    photos: data.photos || [],
    certificate_data: data.certificateData || {},
    qr_code: qrData,
    issued_by: userId,
    notes: data.notes,
  });

  // TODO: Generate PDF certificate from template

  return await getById(tenantId, certificate.id);
};

const verify = async (tenantId, certificateId, userId) => {
  const certificate = await db.Certificate.findOne({
    where: { id: certificateId, tenant_id: tenantId },
  });

  if (!certificate) throw ApiError.notFound('Certificate not found');

  await certificate.update({
    verified_by: userId,
    verified_at: new Date(),
  });

  return await getById(tenantId, certificateId);
};

const remove = async (tenantId, certificateId) => {
  const certificate = await db.Certificate.findOne({
    where: { id: certificateId, tenant_id: tenantId },
  });

  if (!certificate) throw ApiError.notFound('Certificate not found');

  if (certificate.verified_at) {
    throw ApiError.badRequest('Cannot delete verified certificate');
  }

  await certificate.destroy();
};

// Certificate Templates
const getAllTemplates = async (tenantId) => {
  const templates = await db.CertificateTemplate.findAll({
    where: { tenant_id: tenantId, is_active: true },
    order: [['created_at', 'DESC']],
  });

  return templates;
};

const getTemplateById = async (tenantId, templateId) => {
  const template = await db.CertificateTemplate.findOne({
    where: { id: templateId, tenant_id: tenantId },
  });

  if (!template) throw ApiError.notFound('Template not found');
  return template;
};

const createTemplate = async (tenantId, data) => {
  const template = await db.CertificateTemplate.create({
    tenant_id: tenantId,
    name: data.name,
    certificate_type: data.certificateType,
    template_content: data.templateContent,
    template_fields: data.templateFields || {},
    header_image: data.headerImage,
    footer_image: data.footerImage,
    is_active: true,
  });

  return template;
};

const updateTemplate = async (tenantId, templateId, data) => {
  const template = await getTemplateById(tenantId, templateId);

  await template.update({
    name: data.name || template.name,
    template_content: data.templateContent || template.template_content,
    template_fields: data.templateFields || template.template_fields,
    header_image: data.headerImage || template.header_image,
    footer_image: data.footerImage || template.footer_image,
  });

  return template;
};

module.exports = {
  getAll,
  getById,
  create,
  verify,
  remove,
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
};
