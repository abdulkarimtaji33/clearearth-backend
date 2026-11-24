/**
 * Pick-up note details for one pickup task: the paper note's header fields (note number, vehicle, reference,
 * pick-up type, service), customer details, item lines (description, unit, weight), special request and a
 * free-text note. Pre-filled from the task and its deal until the driver saves it.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');

const str = (v, max) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim().slice(0, max));
const num = v => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const nextNoteNumber = async (tenantId) => {
  const [rows] = await db.sequelize.query(
    'SELECT MAX(CAST(note_number AS UNSIGNED)) AS m FROM pickup_note_details WHERE tenant_id = ? AND note_number REGEXP \'^[0-9]+$\'',
    { replacements: [tenantId] }
  );
  return String((Number(rows?.[0]?.m) || 0) + 1);
};

const shape = (d, items) => ({
  noteNumber: d.note_number || '',
  pickupDate: d.pickup_date || '',
  vehicleNo: d.vehicle_no || '',
  referenceNo: d.reference_no || '',
  pickupType: d.pickup_type || '',
  serviceType: d.service_type || '',
  serviceOffered: d.service_offered || '',
  customerName: d.customer_name || '',
  customerAddress: d.customer_address || '',
  contactPerson: d.contact_person || '',
  contactNo: d.contact_no || '',
  email: d.email || '',
  specialRequest: d.special_request || '',
  freeNote: d.free_note || '',
  items: items.map(i => ({ description: i.description || '', unit: i.unit || '', weightKg: i.weight_kg == null ? '' : String(i.weight_kg) })),
  saved: !!d.id,
});

const loadTask = async (tenantId, taskId) => db.WorkOrderTask.findOne({
  where: { id: taskId },
  include: [{
    model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId },
    include: [{ model: db.Deal, as: 'deal', required: false, include: [{ model: db.Company, as: 'company', required: false }, { model: db.Contact, as: 'contact', required: false }] }],
  }],
});

/** Saved note details, or defaults built from the task and deal. Returns null when the task does not exist. */
const get = async (tenantId, taskId) => {
  const task = await loadTask(tenantId, taskId);
  if (!task) return null;
  const saved = await db.PickupNoteDetail.findOne({ where: { tenant_id: tenantId, task_id: taskId } });
  if (saved) {
    const items = await db.PickupNoteItem.findAll({ where: { note_id: saved.id }, order: [['sort_order', 'ASC'], ['id', 'ASC']] });
    return shape(saved, items);
  }
  const deal = task.workOrder?.deal;
  const company = deal?.company;
  const contact = deal?.contact;
  const contactName = deal?.pickup_contact_name || (contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : '');
  return shape({
    pickup_date: task.start_date || null,
    reference_no: deal?.deal_number || '',
    customer_name: company?.company_name || '',
    customer_address: [company?.address, company?.city, company?.country].filter(Boolean).join(', '),
    contact_person: contactName,
    contact_no: deal?.pickup_contact_number || contact?.mobile || contact?.phone || '',
    email: contact?.email || '',
    service_offered: task.type_of_work || '',
  }, []);
};

/** Create or replace the note details. Assigns the next note number on first save when none is given. */
const save = async (tenantId, taskId, data = {}, transaction = null) => {
  const task = await loadTask(tenantId, taskId);
  if (!task || !data || typeof data !== 'object') return null;
  const fields = {
    pickup_date: str(data.pickupDate, 10),
    vehicle_no: str(data.vehicleNo, 50),
    reference_no: str(data.referenceNo, 100),
    pickup_type: ['corporate', 'individual'].includes(String(data.pickupType || '').toLowerCase()) ? String(data.pickupType).toLowerCase() : null,
    service_type: str(data.serviceType, 100),
    service_offered: str(data.serviceOffered, 1000),
    customer_name: str(data.customerName, 255),
    customer_address: str(data.customerAddress, 500),
    contact_person: str(data.contactPerson, 255),
    contact_no: str(data.contactNo, 100),
    email: str(data.email, 255),
    special_request: str(data.specialRequest, 5000),
    free_note: str(data.freeNote, 5000),
  };
  const where = { tenant_id: tenantId, task_id: taskId };
  let row = await db.PickupNoteDetail.findOne({ where, transaction });
  const givenNumber = str(data.noteNumber, 50);
  if (row) {
    await row.update({ ...fields, note_number: givenNumber || row.note_number || await nextNoteNumber(tenantId) }, { transaction });
  } else {
    row = await db.PickupNoteDetail.create({ ...where, ...fields, note_number: givenNumber || await nextNoteNumber(tenantId) }, { transaction });
  }
  if (Array.isArray(data.items)) {
    await db.PickupNoteItem.destroy({ where: { note_id: row.id }, transaction });
    const lines = data.items
      .map((i, idx) => ({ note_id: row.id, sort_order: idx, description: str(i.description, 500), unit: str(i.unit, 30), weight_kg: num(i.weightKg) }))
      .filter(l => l.description || l.weight_kg != null);
    if (lines.length) await db.PickupNoteItem.bulkCreate(lines, { transaction });
  }
  return get(tenantId, taskId);
};

/** Task of the given work order (tenant-scoped); throws ApiError when it does not belong. */
const taskOfWorkOrder = async (tenantId, workOrderId, taskId) => {
  const task = await db.WorkOrderTask.findOne({
    where: { id: taskId, work_order_id: workOrderId },
    include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'status'] }],
  });
  if (!task) throw ApiError.notFound('Pickup task not found in this work order');
  if (!/pickup/i.test(task.type_of_work || '')) throw ApiError.badRequest('This task is not a pickup task');
  return task;
};

const LOCKED = ['completed', 'cancelled'];

/** Operations view: the note plus whether it can still be edited (only until the work order is completed). */
const getForWorkOrder = async (tenantId, workOrderId, taskId) => {
  const task = await taskOfWorkOrder(tenantId, workOrderId, taskId);
  const note = await get(tenantId, taskId);
  return { note, workOrderStatus: task.workOrder.status, editable: !LOCKED.includes(task.workOrder.status) };
};

const saveForWorkOrder = async (tenantId, workOrderId, taskId, data) => {
  const task = await taskOfWorkOrder(tenantId, workOrderId, taskId);
  if (LOCKED.includes(task.workOrder.status)) throw ApiError.badRequest('The work order is closed, so the pick-up note can no longer be edited');
  const note = await save(tenantId, taskId, data);
  return { note, workOrderStatus: task.workOrder.status, editable: true };
};

module.exports = { get, save, getForWorkOrder, saveForWorkOrder };
