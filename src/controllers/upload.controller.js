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
  res.json({ success: true, data: { path: relativePath, url: fileUrl } });
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

