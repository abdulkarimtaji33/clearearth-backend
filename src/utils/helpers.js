/**
 * Helper Utility Functions
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

/**
 * Hash password using bcrypt
 */
const hashPassword = async password => {
  return await bcrypt.hash(password, config.security.bcryptRounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (payload, expiresIn = config.jwt.refreshExpiresIn) => {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn });
};

/**
 * Verify JWT token
 */
const verifyToken = token => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = token => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate unique reference number
 */
const generateReferenceNumber = (prefix = 'REF', length = 8) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(length).toString('hex').toUpperCase().substring(0, length);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate invoice number
 */
const generateInvoiceNumber = (tenantId, year = new Date().getFullYear(), sequence) => {
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `INV-${tenantId}-${year}-${paddedSequence}`;
};

/**
 * Generate lot number
 */
const generateLotNumber = (prefix = 'LOT', sequence) => {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(6, '0');
  return `${prefix}-${year}-${paddedSequence}`;
};

/**
 * Calculate pagination offset
 */
const getPaginationParams = (page = 1, pageSize = config.pagination.defaultPageSize) => {
  const validPage = Math.max(1, parseInt(page));
  const validPageSize = Math.min(
    config.pagination.maxPageSize,
    Math.max(1, parseInt(pageSize))
  );
  const offset = (validPage - 1) * validPageSize;

  return {
    page: validPage,
    pageSize: validPageSize,
    offset,
    limit: validPageSize,
  };
};

/**
 * Calculate VAT amount
 */
const calculateVAT = (amount, rate = config.vat.rate) => {
  return parseFloat((amount * rate).toFixed(2));
};

/**
 * Calculate amount including VAT
 */
const calculateAmountWithVAT = (amount, rate = config.vat.rate) => {
  return parseFloat((amount * (1 + rate)).toFixed(2));
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = config.locale.currency) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (date, format = 'DD/MM/YYYY') => {
  const moment = require('moment-timezone');
  return moment(date).tz(config.locale.timezone).format(format);
};

/**
 * Sanitize object by removing null/undefined values
 */
const sanitizeObject = obj => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] !== null && obj[key] !== undefined) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

/**
 * Deep clone object
 */
const deepClone = obj => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
const isEmpty = obj => {
  return !obj || (Object.keys(obj).length === 0 && obj.constructor === Object);
};

/**
 * Slugify string
 */
const slugify = str => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generate OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Mask email
 */
const maskEmail = email => {
  const [username, domain] = email.split('@');
  const maskedUsername =
    username.substring(0, 2) + '*'.repeat(username.length - 2) + username.slice(-1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask phone
 */
const maskPhone = phone => {
  return phone.substring(0, 3) + '*'.repeat(phone.length - 5) + phone.slice(-2);
};

/**
 * Calculate age from date of birth
 */
const calculateAge = dateOfBirth => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Sleep/delay function
 */
const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateRandomString,
  generateReferenceNumber,
  generateInvoiceNumber,
  generateLotNumber,
  getPaginationParams,
  calculateVAT,
  calculateAmountWithVAT,
  formatCurrency,
  formatDate,
  sanitizeObject,
  deepClone,
  isEmpty,
  slugify,
  generateOTP,
  maskEmail,
  maskPhone,
  calculateAge,
  sleep,
};
