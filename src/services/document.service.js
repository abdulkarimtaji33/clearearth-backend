const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { deleteFile } = require('../middlewares/upload');
const { Op } = db.Sequelize;
const path = require('path');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, documentType, referenceType, referenceId } = filters;
  const where = { tenant_id: tenantId, is_active: true };

  if (search) where[Op.or] = [{ title: { [Op.like]: `%${search}%` } }, { document_number: { [Op.like]: `%${search}%` } }];
  if (documentType) where.document_type = documentType;
  if (referenceType) where.reference_type = referenceType;
  if (referenceId) where.reference_id = referenceId;

  const { count, rows } = await db.Document.findAndCountAll({
    where,
    include: [{ model: db.User, as: 'uploader', attributes: ['id', 'first_name', 'last_name'] }],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });

  return { documents: rows, total: count };
};

const getById = async (tenantId, documentId) => {
  const document = await db.Document.findOne({
    where: { id: documentId, tenant_id: tenantId },
    include: [
      { model: db.User, as: 'uploader' },
      { model: db.Document, as: 'versions', order: [['version', 'DESC']] },
    ],
  });

  if (!document) throw ApiError.notFound('Document not found');
  return document;
};

const create = async (tenantId, userId, data, file) => {
  if (!file) throw ApiError.badRequest('File is required');

  const documentNumber = generateReferenceNumber('DOC');

  const document = await db.Document.create({
    tenant_id: tenantId,
    document_number: documentNumber,
    document_type: data.documentType,
    title: data.title || file.originalname,
    description: data.description,
    file_path: file.path,
    file_name: file.originalname,
    file_size: file.size,
    mime_type: file.mimetype,
    reference_type: data.referenceType,
    reference_id: data.referenceId,
    version: 1,
    expiry_date: data.expiryDate,
    tags: data.tags ? JSON.parse(data.tags) : [],
    is_active: true,
    uploaded_by: userId,
  });

  return await getById(tenantId, document.id);
};

const createVersion = async (tenantId, userId, parentDocumentId, file, description) => {
  const parentDoc = await db.Document.findOne({
    where: { id: parentDocumentId, tenant_id: tenantId },
  });

  if (!parentDoc) throw ApiError.notFound('Parent document not found');

  // Get latest version
  const latestVersion = await db.Document.findOne({
    where: {
      tenant_id: tenantId,
      [Op.or]: [{ id: parentDocumentId }, { parent_document_id: parentDocumentId }],
    },
    order: [['version', 'DESC']],
  });

  const newVersion = latestVersion.version + 1;
  const documentNumber = generateReferenceNumber('DOC');

  const document = await db.Document.create({
    tenant_id: tenantId,
    document_number: documentNumber,
    document_type: parentDoc.document_type,
    title: parentDoc.title,
    description: description || `Version ${newVersion} of ${parentDoc.title}`,
    file_path: file.path,
    file_name: file.originalname,
    file_size: file.size,
    mime_type: file.mimetype,
    reference_type: parentDoc.reference_type,
    reference_id: parentDoc.reference_id,
    version: newVersion,
    parent_document_id: parentDoc.parent_document_id || parentDocumentId,
    expiry_date: parentDoc.expiry_date,
    tags: parentDoc.tags,
    is_active: true,
    uploaded_by: userId,
  });

  return await getById(tenantId, document.id);
};

const update = async (tenantId, documentId, data) => {
  const document = await db.Document.findOne({
    where: { id: documentId, tenant_id: tenantId },
  });

  if (!document) throw ApiError.notFound('Document not found');

  await document.update({
    title: data.title || document.title,
    description: data.description || document.description,
    expiry_date: data.expiryDate || document.expiry_date,
    tags: data.tags || document.tags,
  });

  return await getById(tenantId, documentId);
};

const deactivate = async (tenantId, documentId) => {
  const document = await db.Document.findOne({
    where: { id: documentId, tenant_id: tenantId },
  });

  if (!document) throw ApiError.notFound('Document not found');

  await document.update({ is_active: false });
  return await getById(tenantId, documentId);
};

const remove = async (tenantId, documentId) => {
  const document = await db.Document.findOne({
    where: { id: documentId, tenant_id: tenantId },
  });

  if (!document) throw ApiError.notFound('Document not found');

  // Delete file from filesystem
  try {
    await deleteFile(document.file_path);
  } catch (error) {
    // Log error but continue with database deletion
  }

  await document.destroy();
};

module.exports = { getAll, getById, create, createVersion, update, deactivate, remove };
