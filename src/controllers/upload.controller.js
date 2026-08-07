const path = require('path');
const config = require('../config');
const { getFileUrl } = require('../middlewares/upload');
const db = require('../models');

exports.uploadInspectionDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl, fileName: req.file.originalname } });
};

exports.uploadDealImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl } });
};

exports.uploadCompanyDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl, fileName: req.file.originalname } });
};

exports.uploadWdsAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl, fileName: req.file.originalname } });
};
exports.uploadTaxInvoiceAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl, fileName: req.file.originalname } });
};

exports.uploadExpenseEvidence = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl, fileName: req.file.originalname } });
};

exports.uploadTenantLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: 'Tenant not found' });
  }
  await tenant.update({ logo: relativePath });
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl } });
};

/**
 * Signature of the signed-in user, rendered next to the stamp on documents they
 * prepare. Every user manages their own — no admin permission required.
 */
exports.uploadMySignature = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Choose a signature image and try again.' });
  }
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const user = await db.User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  await user.update({ signature: relativePath });
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl } });
};

/** Remove the signed-in user's signature. */
exports.deleteMySignature = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const user = await db.User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  await user.update({ signature: null });
  res.json({ success: true, data: { path: null, url: null } });
};

/**
 * Company-wide fallback signature, used when the preparing user has none of their own.
 * A transparent PNG gives the best result over the stamp.
 */
exports.uploadTenantSignature = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Choose a signature image and try again.' });
  }
  const relativePath = path.relative(config.upload.path, req.file.path).replace(/\\/g, '/');
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: 'Tenant not found' });
  }
  await tenant.update({ signature: relativePath });
  const fileUrl = getFileUrl(relativePath);
  res.json({ success: true, data: { path: relativePath, url: fileUrl } });
};

/** Remove the stored signature so documents fall back to a blank signing line. */
exports.deleteTenantSignature = async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, message: 'Tenant not found' });
  }
  await tenant.update({ signature: null });
  res.json({ success: true, data: { path: null, url: null } });
};

