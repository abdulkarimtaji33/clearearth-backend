const path = require('path');

/** Extensions allowed for inspection / general ERP uploads. */
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
]);

/** MIME types browsers may send for Office files (often zip/octet-stream). */
const GENERIC_OFFICE_MIMES = new Set([
  'application/octet-stream',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
]);

const EXTENSION_MIMES = {
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'],
  '.xls': ['application/vnd.ms-excel', 'application/octet-stream'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/zip', 'application/x-zip-compressed'],
};

const getExtension = (filename) => path.extname(filename || '').toLowerCase();

/**
 * Accept upload when extension is allowed and MIME matches (or is a known generic Office MIME).
 */
const isAllowedUpload = (mimetype, originalname, allowedTypes = []) => {
  const ext = getExtension(originalname);
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;

  const mime = (mimetype || '').toLowerCase();
  if (!mime || GENERIC_OFFICE_MIMES.has(mime)) return true;

  if (allowedTypes.includes(mime)) return true;

  const extMimes = EXTENSION_MIMES[ext] || [];
  return extMimes.includes(mime);
};

module.exports = {
  ALLOWED_EXTENSIONS,
  getExtension,
  isAllowedUpload,
};
