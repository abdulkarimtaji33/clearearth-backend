/**
 * File Upload Middleware using Multer
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { isAllowedUpload, getExtension } = require('../utils/uploadFileTypes');

// Ensure upload directory exists
const uploadDir = config.upload.path;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'others';
    const ext = getExtension(file.originalname);

    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype === 'application/pdf' || ext === '.pdf') {
      subDir = 'documents';
    } else if (
      file.mimetype.includes('spreadsheet')
      || file.mimetype.includes('excel')
      || ext === '.xls'
      || ext === '.xlsx'
    ) {
      subDir = 'spreadsheets';
    } else if (
      file.mimetype === 'application/msword'
      || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || ext === '.doc'
      || ext === '.docx'
    ) {
      subDir = 'documents';
    }

    const destination = path.join(uploadDir, subDir);

    // Create directory if it doesn't exist
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    cb(null, destination);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter — extension check with MIME fallback (Office files often report zip/octet-stream)
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedTypes;

  if (isAllowedUpload(file.mimetype, file.originalname, allowedTypes)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype || 'unknown'} (${file.originalname})`), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Upload single file
const uploadSingle = fieldName => {
  return upload.single(fieldName);
};

// Upload multiple files
const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Upload fields
const uploadFields = fields => {
  return upload.fields(fields);
};

// Delete file
const deleteFile = async filePath => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error('Error deleting file');
  }
};

// Get file URL
const getFileUrl = filePath => {
  if (!filePath) return null;
  return `/uploads/${filePath.replace(/\\/g, '/')}`;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  getFileUrl,
};
