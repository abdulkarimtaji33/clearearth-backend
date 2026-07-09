const path = require('path');

/** Extensions allowed for inspection / general ERP uploads. */
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
]);

/** Generic MIME types browsers/OS often use for Office binaries. */
const GENERIC_OFFICE_MIMES = new Set([
  'application/octet-stream',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/vnd.ms-office',
  'application/x-ole-storage',
  'application/CDFV2',
  'application/cdfv2',
]);

/** Legacy Word (.doc) — IANA + common browser/OS variants. */
const WORD_DOC_MIMES = [
  'application/msword',
  'application/vnd.ms-word',
  'application/x-msword',
  'application/doc',
  'application/x-doc',
];

/** Word Open XML (.docx) and related OOXML types. */
const WORD_DOCX_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  'application/vnd.ms-word.document.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml',
];

/** Legacy Excel (.xls) — IANA + common browser/OS variants. */
const EXCEL_XLS_MIMES = [
  'application/vnd.ms-excel',
  'application/msexcel',
  'application/x-msexcel',
  'application/x-ms-excel',
  'application/x-excel',
  'application/x-dos_ms_excel',
  'application/xls',
  'application/excel',
];

/** Excel Open XML (.xlsx) and related OOXML types. */
const EXCEL_XLSX_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml',
];

const IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const PDF_MIMES = ['application/pdf'];

const EXTENSION_MIMES = {
  '.jpg': IMAGE_MIMES,
  '.jpeg': IMAGE_MIMES,
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.pdf': PDF_MIMES,
  '.doc': [...WORD_DOC_MIMES, ...GENERIC_OFFICE_MIMES],
  '.docx': [...WORD_DOCX_MIMES, ...GENERIC_OFFICE_MIMES],
  '.xls': [...EXCEL_XLS_MIMES, ...GENERIC_OFFICE_MIMES],
  '.xlsx': [...EXCEL_XLSX_MIMES, ...EXCEL_XLS_MIMES, ...GENERIC_OFFICE_MIMES],
};

/** Default env allow-list — explicit Office MIME types (generic types handled by extension fallback). */
const DEFAULT_ALLOWED_MIME_TYPES = [
  ...IMAGE_MIMES,
  ...PDF_MIMES,
  ...WORD_DOC_MIMES,
  ...WORD_DOCX_MIMES,
  ...EXCEL_XLS_MIMES,
  ...EXCEL_XLSX_MIMES,
];

const getExtension = (filename) => path.extname(filename || '').toLowerCase();

const mimeMatchesExtension = (mime, ext) => {
  const known = EXTENSION_MIMES[ext] || [];
  return known.includes(mime);
};

/**
 * Accept upload when extension is allowed and MIME matches (or is a known generic Office MIME).
 */
const isAllowedUpload = (mimetype, originalname, allowedTypes = []) => {
  const ext = getExtension(originalname);
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;

  const mime = (mimetype || '').toLowerCase().trim();
  if (!mime || GENERIC_OFFICE_MIMES.has(mime)) return true;

  if (allowedTypes.map((t) => t.toLowerCase()).includes(mime)) return true;
  if (mimeMatchesExtension(mime, ext)) return true;

  // Image/* wildcard from some clients
  if (mime.startsWith('image/') && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    return true;
  }

  return false;
};

module.exports = {
  ALLOWED_EXTENSIONS,
  GENERIC_OFFICE_MIMES,
  WORD_DOC_MIMES,
  WORD_DOCX_MIMES,
  EXCEL_XLS_MIMES,
  EXCEL_XLSX_MIMES,
  DEFAULT_ALLOWED_MIME_TYPES,
  getExtension,
  isAllowedUpload,
};
