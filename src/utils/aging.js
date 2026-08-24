/**
 * Shared aging-bucket logic for Receivables, Payables, and the Statement of Account —
 * all three now bucket by days *overdue vs due date* using the same five buckets, so
 * a client's totals agree whether read from the Aging Summary screen or the Statement.
 */

/** Days between `asOfDate` and `dueDateStr` (positive = overdue). Null when there is no due date. */
function daysOverdue(dueDateStr, asOfDate) {
  if (!dueDateStr) return null;
  const due = new Date(`${dueDateStr}T12:00:00`);
  return Math.floor((asOfDate - due) / 86400000);
}

/** Bucket key for a `daysOverdue` value (null = no due date on the document). */
function agingBucketByDueDate(d) {
  if (d == null) return 'no_due_date';
  if (d <= 0) return 'current';
  if (d <= 30) return '1_30';
  if (d <= 60) return '31_60';
  if (d <= 90) return '61_90';
  return 'over_90';
}

const BUCKET_FIELD = {
  current: 'current',
  '1_30': 'bucket_1_30',
  '31_60': 'bucket_31_60',
  '61_90': 'bucket_61_90',
  over_90: 'bucket_over_90',
  no_due_date: 'bucket_no_due_date',
};

function emptyAgingBuckets() {
  return {
    current: 0,
    bucket_1_30: 0,
    bucket_31_60: 0,
    bucket_61_90: 0,
    bucket_over_90: 0,
    bucket_no_due_date: 0,
  };
}

function addToBucket(buckets, bucketKey, amount) {
  const field = BUCKET_FIELD[bucketKey] || 'bucket_no_due_date';
  buckets[field] = (buckets[field] || 0) + amount;
}

function sumAgingBuckets(buckets) {
  return Object.values(buckets).reduce((s, v) => s + (parseFloat(v) || 0), 0);
}

module.exports = {
  daysOverdue,
  agingBucketByDueDate,
  emptyAgingBuckets,
  addToBucket,
  sumAgingBuckets,
  BUCKET_FIELD,
};
