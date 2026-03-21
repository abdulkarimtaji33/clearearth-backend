const { Op } = require('sequelize');

/**
 * created_at between dateFrom and dateTo (YYYY-MM-DD, inclusive).
 * Pushes onto Op.and when it is already an array (scoped queries).
 */
function applyCreatedAtFilter(where, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return;
  const range = {};
  if (dateFrom) range[Op.gte] = `${dateFrom} 00:00:00`;
  if (dateTo) range[Op.lte] = `${dateTo} 23:59:59`;
  const clause = { created_at: range };
  if (Array.isArray(where[Op.and])) {
    where[Op.and].push(clause);
  } else {
    where.created_at = range;
  }
}

/** DATE / DATEONLY column, YYYY-MM-DD inclusive */
function applyDateOnlyColumnFilter(where, column, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return;
  const range = {};
  if (dateFrom) range[Op.gte] = dateFrom;
  if (dateTo) range[Op.lte] = dateTo;
  where[column] = range;
}

module.exports = { applyCreatedAtFilter, applyDateOnlyColumnFilter };
