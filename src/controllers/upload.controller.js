const path = require('path');
const config = require('../config');
const { getFileUrl } = require('../middlewares/upload');

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
