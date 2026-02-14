/**
 * File Upload Middleware using Multer
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const ApiError = require('../utils/apiError');

// Ensure upload directory exists
const uploadDir = config.upload.path;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create subdirectory based on file type
    let subDir = 'others';

    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype === 'application/pdf') {
      subDir = 'documents';
    } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      subDir = 'spreadsheets';
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

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedTypes;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`File type ${file.mimetype} is not allowed`), false);
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
