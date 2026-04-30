/**
 * Accounts payable (approved purchase orders with balance due)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { applyDateOnlyColumnFilter } = require('../utils/dateRangeWhere');
const { Op } = db.Sequelize;

const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

function poTotal(po) {
  const items = po.items || [];
  return items.reduce((s, it) => s + parseFloat(it.total || 0), 0);
}

function balanceDue(po) {
  const total = poTotal(po);
  const paid = po.paid_amount != null ? parseFloat(po.paid_amount) : 0;
  return Math.max(0, total - paid);
}

function daysOpenForPayable(po) {
  const ref = po.due_date || po.po_date;
  if (!ref) return 0;
  const refD = new Date(`${ref}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.floor((today - refD) / 86400000);
}

function agingBucketFromDaysOpen(d) {
  if (d <= 30) return 'current';
  if (d <= 60) return '31_60';
  if (d <= 90) return '61_90';
  return 'over_90';
}

const listPayables = async (tenantId, filters = {}) => {
  const {
    offset,
    limit,
    search,
    dateFrom,
    dateTo,
    paymentStatus,
    supplierId,
    companyId,
  } = filters;

  const where = {
    tenant_id: tenantId,
    status: 'approved',
    payment_status: { [Op.in]: ['unpaid', 'partial'] },
  };
  applyDateOnlyColumnFilter(where, 'po_date', dateFrom, dateTo);
  if (paymentStatus && PAYMENT_STATUSES.includes(String(paymentStatus).toLowerCase())) {
    where.payment_status = String(paymentStatus).toLowerCase();
  }
  if (supplierId) where.supplier_id = supplierId;
  if (companyId) where.company_id = companyId;

  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { '$supplier.company_name$': { [Op.like]: s } },
        { '$company.company_name$': { [Op.like]: s } },
      ],
    });
  }

  const { count, rows } = await db.PurchaseOrder.findAndCountAll({
    where,
    include: [
      { model: db.Deal, as: 'deal', attributes: ['id', 'title', 'deal_number'], required: false },
      { model: db.Supplier, as: 'supplier', attributes: ['id', 'company_name'], required: false },
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
      {
        model: db.PurchaseOrderItem,
        as: 'items',
        include: [{ model: db.ProductService, as: 'productService', attributes: ['id', 'name'], required: false }],
        required: false,
      },
    ],
    offset,
    limit,
    order: [['po_date', 'DESC'], ['id', 'DESC']],
    distinct: true,
    subQuery: false,
  });

  const plain = rows.map((r) => {
    const o = r.get({ plain: true });
    o.po_total = poTotal(o);
    o.balance_due = balanceDue(o);
    const dOpen = daysOpenForPayable(o);
    o.days_open = dOpen;
    o.aging_bucket = agingBucketFromDaysOpen(dOpen);
    o.party_label = o.supplier_id ? 'Vendor' : o.company_id ? 'Client' : '—';
    o.party_name = o.supplier?.company_name || o.company?.company_name || '—';
    return o;
  });

  return { payables: plain, total: count };
};

const recordPayment = async (tenantId, poId, body) => {
  const po = await db.PurchaseOrder.findOne({
    where: { id: poId, tenant_id: tenantId, status: 'approved' },
    include: [{ model: db.PurchaseOrderItem, as: 'items', required: false }],
  });
  if (!po) throw ApiError.notFound('Payable purchase order not found');

  const add = body.amount != null && body.amount !== '' ? parseFloat(body.amount) : NaN;
  if (!Number.isFinite(add) || add <= 0) throw ApiError.badRequest('amount must be a positive number');

  const total = poTotal(po);
  const cur = po.paid_amount != null ? parseFloat(po.paid_amount) : 0;
  const next = Math.min(total, cur + add);

  let ps = 'unpaid';
  if (next >= total - 0.01) ps = 'paid';
  else if (next > 0) ps = 'partial';

  const updates = {
    paid_amount: next,
    payment_status: ps,
  };
  if (body.dueDate !== undefined) updates.due_date = body.dueDate || null;

  await po.update(updates);

  return db.PurchaseOrder.findOne({
    where: { id: poId, tenant_id: tenantId },
    include: [
      { model: db.Deal, as: 'deal', required: false },
      { model: db.Supplier, as: 'supplier', required: false },
      { model: db.Company, as: 'company', required: false },
      { model: db.PurchaseOrderItem, as: 'items', include: [{ model: db.ProductService, as: 'productService' }] },
    ],
  });
};

const getAgingSummary = async (tenantId, filters = {}) => {
  const result = await listPayables(tenantId, { ...filters, limit: 5000, offset: 0 });
  const rows = result.payables;

  const buckets = {
    current: 0,
    bucket_31_60: 0,
    bucket_61_90: 0,
    bucket_over_90: 0,
  };

  const byParty = {};

  for (const o of rows) {
    const bal = o.balance_due;
    if (bal <= 0.005) continue;
    const b = o.aging_bucket;
    if (b === 'current') buckets.current += bal;
    else if (b === '31_60') buckets.bucket_31_60 += bal;
    else if (b === '61_90') buckets.bucket_61_90 += bal;
    else buckets.bucket_over_90 += bal;

    const sid = o.supplier_id;
    const cid = o.company_id;
    const key = sid ? `s-${sid}` : cid ? `c-${cid}` : `p-${o.id}`;
    const name = o.party_name || '—';
    if (!byParty[key]) {
      byParty[key] = {
        supplierId: sid || null,
        companyId: cid || null,
        partyName: name,
        partyLabel: o.party_label,
        total: 0,
        current: 0,
        bucket_31_60: 0,
        bucket_61_90: 0,
        bucket_over_90: 0,
      };
    }
    byParty[key].total += bal;
    if (b === 'current') byParty[key].current += bal;
    else if (b === '31_60') byParty[key].bucket_31_60 += bal;
    else if (b === '61_90') byParty[key].bucket_61_90 += bal;
    else byParty[key].bucket_over_90 += bal;
  }

  return {
    buckets,
    byParty: Object.values(byParty).sort((a, b) => b.total - a.total),
  };
};

module.exports = {
  listPayables,
  recordPayment,
  getAgingSummary,
  poTotal,
  balanceDue,
};
