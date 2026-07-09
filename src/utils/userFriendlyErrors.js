/**
 * Convert technical validation / ORM errors into plain-language messages for end users.
 */

const FIELD_LABELS = {
  email: 'Email',
  first_name: 'First name',
  last_name: 'Last name',
  phone: 'Phone',
  mobile: 'Mobile',
  company_name: 'Company name',
  company_id: 'Company',
  supplier_id: 'Supplier',
  contact_id: 'Contact',
  deal_id: 'Deal',
  password: 'Password',
  username: 'Username',
  po_date: 'PO date',
  quotation_date: 'Quotation date',
  unit_of_measure: 'Unit of measure',
  quantity: 'Quantity',
  price: 'Price',
  status: 'Status',
};

function humanizeField(field) {
  if (!field) return 'This field';
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  return String(field)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeSequelizeValidationError(error) {
  const field = error.path;
  const label = humanizeField(field);
  const validator = error.validatorKey || '';
  const msg = String(error.message || '');

  if (validator === 'isEmail' || msg.includes('isEmail')) {
    return `${label} must be a valid email address.`;
  }
  if (validator === 'notEmpty' || validator === 'notNull') {
    return `${label} is required.`;
  }
  if (validator === 'isInt') {
    return `${label} must be a whole number.`;
  }
  if (validator === 'isDecimal' || validator === 'isFloat') {
    return `${label} must be a valid number.`;
  }
  if (validator === 'len' || msg.toLowerCase().includes('length')) {
    return `${label} has an invalid length.`;
  }
  if (msg.includes('Validation')) {
    return `${label} is not valid. Please check and try again.`;
  }
  return humanizeGenericMessage(msg, field);
}

function humanizeGenericMessage(message, field) {
  if (!message) return 'Something went wrong. Please try again.';
  const m = String(message).trim();

  if (m.includes('Validation isEmail') || m.includes('isEmail on email')) {
    return field
      ? `${humanizeField(field)} must be a valid email address.`
      : 'Please enter a valid email address.';
  }
  if (m === 'Validation failed' || m === 'Validation Error') {
    return null;
  }
  if (m.includes('Sequelize') || m.includes('ECONNREFUSED')) {
    return 'Something went wrong. Please try again later.';
  }
  if (m.includes('must be a valid email')) {
    return field ? `${humanizeField(field)} must be a valid email address.` : 'Please enter a valid email address.';
  }
  if (m.includes('already exists')) {
    const fieldMatch = m.match(/^(\w+) already exists$/i);
    if (fieldMatch) return `${humanizeField(fieldMatch[1])} is already in use.`;
    return m.replace(/already exists/i, 'is already in use');
  }
  if (m.includes('not found')) {
    return m.charAt(0).toUpperCase() + m.slice(1);
  }
  return m;
}

function humanizeValidationErrors(errors) {
  if (!errors) return [];
  const list = Array.isArray(errors) ? errors : [errors];
  return list
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') return humanizeGenericMessage(entry);
      if (entry.message) return humanizeGenericMessage(entry.message, entry.field);
      return null;
    })
    .filter(Boolean);
}

function buildUserFriendlyMessage(primaryMessage, errors) {
  const fromErrors = humanizeValidationErrors(errors);
  if (fromErrors.length > 0) {
    return [...new Set(fromErrors)].join(' ');
  }
  const fromPrimary = humanizeGenericMessage(primaryMessage);
  if (fromPrimary) return fromPrimary;
  return 'Please check your input and try again.';
}

module.exports = {
  humanizeField,
  humanizeSequelizeValidationError,
  humanizeGenericMessage,
  humanizeValidationErrors,
  buildUserFriendlyMessage,
};
