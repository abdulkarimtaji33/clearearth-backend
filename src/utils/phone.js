/**
 * Phone number validation shared by every route that accepts one.
 *
 * Permissive about formatting (spaces, dashes, brackets, leading +) but strict about
 * digit count: 7–15 digits, where 15 is the E.164 maximum. Mirrors
 * clearearth-frontend/src/utils/phone.js — keep both in sync.
 */

const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

const ALLOWED_CHARS = /^[+()\d\s.-]+$/;

/** Strip formatting down to digits so length rules apply to the number itself. */
function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/**
 * Returns null when valid, otherwise a message naming the problem and the fix.
 * Messages match the frontend so the user sees the same wording either way.
 */
function validatePhone(value, { required = false, label = 'Phone number' } = {}) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return required ? `${label} is required.` : null;
  }

  if (!ALLOWED_CHARS.test(raw)) {
    return `${label} can only contain digits, spaces and + ( ) -  — remove any letters or other symbols.`;
  }

  if (raw.includes('+') && !raw.startsWith('+')) {
    return `${label} can only use + at the start, for the country code (e.g. +971 50 123 4567).`;
  }

  const digits = phoneDigits(raw);

  if (digits.length < PHONE_MIN_DIGITS) {
    return `${label} is too short — enter at least ${PHONE_MIN_DIGITS} digits (e.g. +971 50 123 4567).`;
  }

  if (digits.length > PHONE_MAX_DIGITS) {
    return `${label} is too long — enter no more than ${PHONE_MAX_DIGITS} digits (e.g. +971 50 123 4567).`;
  }

  return null;
}

function isValidPhone(value, options) {
  return validatePhone(value, options) === null;
}

/**
 * express-validator custom validator.
 *   body('phone').optional({ values: 'falsy' }).custom(phoneValidator())
 *   body('phone').notEmpty()...custom(phoneValidator({ label: 'Phone' }))
 */
function phoneValidator({ label = 'Phone number', required = false } = {}) {
  return (value) => {
    const message = validatePhone(value, { required, label });
    if (message) throw new Error(message);
    return true;
  };
}

module.exports = {
  PHONE_MIN_DIGITS,
  PHONE_MAX_DIGITS,
  phoneDigits,
  validatePhone,
  isValidPhone,
  phoneValidator,
};
