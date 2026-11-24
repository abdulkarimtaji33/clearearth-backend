/**
 * Pickup report: every pickup task with what the driver filled in (quantity, condition, notes, photos),
 * the helpers who worked under the driver, and the GRN facility. Filterable, exportable to CSV (opens in
 * Excel) and each task has a printable pickup note.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const STATUS_LABEL = { not_started: 'Not started', in_progress: 'In progress', completed: 'Completed' };

function taskWhere(filters) {
  const { from, to, status, driverId, search } = filters;
  const where = { [Op.and]: [{ type_of_work: { [Op.like]: '%pickup%' } }] };
  if (status && STATUS_LABEL[status]) where.status = status;
  if (driverId) where.assigned_to = parseInt(driverId, 10);
  const date = {};
  if (from) date[Op.gte] = from;
  if (to) date[Op.lte] = to;
  if (from || to) where.start_date = date;
  if (search) {
    const s = `%${String(search).trim()}%`;
    where[Op.and].push({ [Op.or]: [{ notes: { [Op.like]: s } }, { type_of_work: { [Op.like]: s } }, { '$workOrder.title$': { [Op.like]: s } }, { '$workOrder.deal.deal_number$': { [Op.like]: s } }, { '$workOrder.deal.title$': { [Op.like]: s } }] });
  }
  return where;
}

const fullName = (u) => (u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : '');

function includesFor(tenantId, filters) {
  const woWhere = { tenant_id: tenantId };
  if (filters.dealId) woWhere.deal_id = parseInt(filters.dealId, 10);
  return [
    {
      model: db.WorkOrder, as: 'workOrder', required: true, where: woWhere, attributes: ['id', 'title', 'status', 'deal_id'],
      include: [{ model: db.Deal, as: 'deal', attributes: ['id', 'deal_number', 'title'], required: false, include: [{ model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false }] }],
    },
    { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
    { model: db.WorkOrderTaskAssignee, as: 'assigneeRows', attributes: ['user_id', 'role'], required: false, include: [{ model: db.User, as: 'user', attributes: ['id', 'first_name', 'last_name'], required: false }] },
    { model: db.WorkOrderTaskFile, as: 'files', attributes: ['id', 'image_url', 'original_name'], required: false },
  ];
}

const PENDING_NOTE = 'Pending (work order not completed)';

/** Note summary per task id, only for tasks whose work order is completed. */
async function noteMap(tenantId, tasks) {
  const ids = tasks.filter((t) => t.workOrder?.status === 'completed').map((t) => t.id);
  if (!ids.length) return new Map();
  const notes = await db.PickupNoteDetail.findAll({ where: { tenant_id: tenantId, task_id: { [Op.in]: ids } } });
  if (!notes.length) return new Map();
  const items = await db.PickupNoteItem.findAll({ where: { note_id: { [Op.in]: notes.map((n) => n.id) } } });
  const weight = new Map();
  items.forEach((i) => weight.set(i.note_id, (weight.get(i.note_id) || 0) + (Number(i.weight_kg) || 0)));
  return new Map(notes.map((n) => [n.task_id, { note_number: n.note_number || '', vehicle_no: n.vehicle_no || '', customer: n.customer_name || '', total_weight_kg: weight.get(n.id) || 0 }]));
}

async function toRow(t, grnByWo, notes = new Map()) {
  const done = t.workOrder?.status === 'completed';
  const nd = notes.get(t.id);
  const grn = grnByWo.get(t.work_order_id) || null;
  const helpers = (t.assigneeRows || []).filter((a) => a.role === 'helper').map((a) => fullName(a.user)).filter(Boolean);
  return {
    task_id: t.id,
    work_order_id: t.work_order_id,
    work_order: t.workOrder?.title || '',
    deal_number: t.workOrder?.deal?.deal_number || '',
    deal_title: t.workOrder?.deal?.title || '',
    client: t.workOrder?.deal?.company?.company_name || '',
    task: t.type_of_work || '',
    status: t.status,
    status_label: STATUS_LABEL[t.status] || t.status,
    pickup_date: t.start_date || null,
    completed_date: t.end_date || null,
    driver: fullName(t.assignedUser),
    helpers,
    quantity: t.pickup_quantity || '',
    uom: t.pickup_uom || '',
    condition: t.pickup_condition || '',
    driver_notes: t.notes || '',
    photos: (t.files || []).length,
    grn_number: grn?.grn_number || '',
    storage_facility: grn?.disposed_without_facility ? 'Disposed without coming to the facility' : (grn?.storageFacility?.name || ''),
    driver_comment: grn?.driver_comment || '',
    note_available: done,
    note_status: done ? (nd ? 'Available' : 'No note filled in') : PENDING_NOTE,
    note_number: done ? (nd?.note_number || '') : PENDING_NOTE,
    note_vehicle_no: done ? (nd?.vehicle_no || '') : '',
    note_customer: done ? (nd?.customer || '') : '',
    note_total_weight_kg: done && nd ? nd.total_weight_kg : null,
  };
}

async function grnMap(tenantId, woIds) {
  if (!woIds.length) return new Map();
  const grns = await db.Grn.findAll({
    where: { tenant_id: tenantId, work_order_id: { [Op.in]: woIds } },
    attributes: ['id', 'grn_number', 'work_order_id', 'driver_comment', 'disposed_without_facility'],
    include: [{ model: db.StorageFacility, as: 'storageFacility', attributes: ['id', 'name'], required: false }],
  });
  return new Map(grns.map((g) => [g.work_order_id, g]));
}

const list = async (tenantId, filters = {}) => {
  const { offset, limit } = filters;
  const { count, rows } = await db.WorkOrderTask.findAndCountAll({
    where: taskWhere(filters), include: includesFor(tenantId, filters), subQuery: false, distinct: true,
    order: [['start_date', 'DESC'], ['id', 'DESC']], offset, limit,
  });
  const map = await grnMap(tenantId, [...new Set(rows.map((r) => r.work_order_id))]);
  const notes = await noteMap(tenantId, rows);
  return { rows: await Promise.all(rows.map((r) => toRow(r, map, notes))), total: count };
};

const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of every row matching the filters (UTF-8 with BOM so Excel opens it correctly). */
const exportCsv = async (tenantId, filters = {}) => {
  const rows = await db.WorkOrderTask.findAll({
    where: taskWhere(filters), include: includesFor(tenantId, filters), subQuery: false,
    order: [['start_date', 'DESC'], ['id', 'DESC']],
  });
  const map = await grnMap(tenantId, [...new Set(rows.map((r) => r.work_order_id))]);
  const notes = await noteMap(tenantId, rows);
  const data = await Promise.all(rows.map((r) => toRow(r, map, notes)));
  const cols = [
    ['Pickup date', 'pickup_date'], ['Deal', 'deal_number'], ['Client', 'client'], ['Work order', 'work_order'], ['Task', 'task'],
    ['Status', 'status_label'], ['Driver', 'driver'], ['Helpers', 'helpers'], ['Quantity', 'quantity'], ['UOM', 'uom'],
    ['Condition', 'condition'], ['Driver notes', 'driver_notes'], ['Photos', 'photos'], ['GRN', 'grn_number'],
    ['Storage facility', 'storage_facility'], ['Driver comment', 'driver_comment'],
    ['Pickup note no.', 'note_number'], ['Vehicle', 'note_vehicle_no'], ['Note customer', 'note_customer'], ['Note total weight (kg)', 'note_total_weight_kg'],
  ];
  const lines = [cols.map((c) => csvCell(c[0])).join(',')];
  for (const r of data) lines.push(cols.map((c) => csvCell(r[c[1]])).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
};

const getNote = async (tenantId, taskId) => {
  const t = await db.WorkOrderTask.findOne({ where: { id: taskId }, include: includesFor(tenantId, {}) });
  if (!t) throw ApiError.notFound('Pickup task not found');
  const map = await grnMap(tenantId, [t.work_order_id]);
  if (t.workOrder?.status !== 'completed') throw ApiError.badRequest('The pick-up note is pending: it can be printed once the work order is completed');
  const row = await toRow(t, map, await noteMap(tenantId, [t]));
  row.files = (t.files || []).map((f) => f.get({ plain: true }));
  row.noteDetails = await require('./pickupNote.service').get(tenantId, taskId);
  return row;
};

module.exports = { list, exportCsv, getNote };
