const db = require('../models');
const ApiError = require('../utils/apiError');

const { Op } = db.Sequelize;

const SOURCES = { quotation: 'Quotation', purchase_order: 'PurchaseOrder' };

const CERT_LABELS = {
  green_certificate: 'Green certificate',
  destruction_report_evidence: 'Destruction report with evidence',
  certificate_of_destruction: 'Certificate of destruction',
  certificate_of_data_destruction: 'Certificate of data destruction',
  carbon_footprint: 'Carbon footprint',
};

const bool = v => (v === undefined || v === null || v === '' ? null : v === true || v === 'true' || v === 1 || v === '1');
const str = (v, max) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim().slice(0, max));
const arr = v => (Array.isArray(v) ? v.map(String) : []);

const loadSource = async (tenantId, sourceType, sourceId) => {
  const model = SOURCES[sourceType];
  if (!model) throw ApiError.badRequest('Unknown request source');
  const row = await db[model].findOne({
    where: { id: sourceId, tenant_id: tenantId },
    include: [{ model: db.Deal, as: 'deal', required: false }],
  });
  if (!row) throw ApiError.notFound('Record not found');
  return row;
};

const PHOTO_LIMIT = 20;
const cleanPhotos = (v) => (Array.isArray(v)
  ? v.filter((p) => p && typeof p.url === 'string' && p.url.startsWith('/uploads/'))
    .slice(0, PHOTO_LIMIT)
    .map((p) => ({ url: p.url, name: String(p.name || '').slice(0, 200) }))
  : undefined);

/** The one pickup / delivery request of the deal this record belongs to (it may sit on a sibling quotation / order). */
const dealRequest = async (tenantId, source) => {
  if (!source?.deal_id) return null;
  const [qs, pos] = await Promise.all([
    db.Quotation.findAll({ where: { tenant_id: tenantId, deal_id: source.deal_id }, attributes: ['id', 'status'] }),
    db.PurchaseOrder.findAll({ where: { tenant_id: tenantId, deal_id: source.deal_id }, attributes: ['id', 'status'] }),
  ]);
  const conds = [];
  if (qs.length) conds.push({ source_type: 'quotation', source_id: qs.map((x) => x.id) });
  if (pos.length) conds.push({ source_type: 'purchase_order', source_id: pos.map((x) => x.id) });
  if (!conds.length) return null;
  const row = await db.PickupRequest.findOne({ where: { tenant_id: tenantId, [Op.or]: conds }, order: [['id', 'ASC']] });
  if (!row) return null;
  const owner = row.source_type === 'quotation' ? qs.find((x) => x.id === row.source_id) : pos.find((x) => x.id === row.source_id);
  return { row, ownerApproved: String(owner?.status || '').toLowerCase() === 'approved' };
};

/** A quotation / client purchase quotation cannot be approved (or sent for approval) without a pickup / delivery request. */
const assertReadyForApproval = async (tenantId, sourceType, sourceId, data) => {
  const source = await loadSource(tenantId, sourceType, sourceId);
  const own = await db.PickupRequest.findOne({ where: { tenant_id: tenantId, source_type: sourceType, source_id: sourceId } });
  const dealLevel = await dealRequest(tenantId, source);
  const provided = data && typeof data === 'object' && str(data.requestDate, 10);
  if (!provided && !own && !dealLevel) {
    throw ApiError.badRequest('Schedule a pickup or delivery request (with a date) before approving this quotation');
  }
};

/** Default values for the form, built from the deal, its company/contact, items, WDS and certificates. */
const prefill = async (tenantId, sourceType, sourceId, user = null) => {
  const source = await loadSource(tenantId, sourceType, sourceId);
  const existingRequest = await dealRequest(tenantId, source);
  if (existingRequest) return shape(existingRequest.row);
  const deal = source.deal || null;
  const out = {
    requestType: 'pickup',
    companyName: '', contactPerson: '', contactPhone: '', contactEmail: '',
    requestDate: source.requested_pickup_date || '', requestTime: '',
    locationType: '', locationAddress: '', gatePassRequired: null,
    serviceType: sourceType === 'purchase_order' ? 'purchase' : 'service',
    materialType: '', totalWeight: '', truckRequired: [], packingType: '',
    laborRequired: null, laborCount: null,
    wdsNumber: '', wdsFoodType: '', dmInspectionRequired: null,
    pickupNoteRequired: null, grnRequired: null,
    certificates: [], additionalNotes: source.pickup_request_note || '',
    requestedBy: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : '',
  };
  if (!deal) return out;

  const [company, contact, items, wds] = await Promise.all([
    deal.company_id ? db.Company.findByPk(deal.company_id) : null,
    deal.contact_id ? db.Contact.findByPk(deal.contact_id) : null,
    db.DealItem.findAll({ where: { deal_id: deal.id } }).catch(() => []),
    db.DealWds.findOne({ where: { deal_id: deal.id } }),
  ]);
  out.companyName = company?.company_name || '';
  if (contact) {
    out.contactPerson = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
    out.contactPhone = contact.mobile || contact.phone || '';
    out.contactEmail = contact.email || '';
  }
  if (deal.pickup_contact_name) out.contactPerson = deal.pickup_contact_name;
  if (deal.pickup_contact_number) out.contactPhone = deal.pickup_contact_number;
  out.locationAddress = deal.pickup_location || '';
  if (deal.location_type) {
    out.locationType = /free/i.test(deal.location_type) ? 'free_zone' : 'main_land';
  }
  const names = [];
  for (const i of items) {
    let n = i.notes;
    if (i.product_service_id) {
      const ps = await db.ProductService.findByPk(i.product_service_id, { attributes: ['name'] }).catch(() => null);
      if (ps?.name) n = ps.name;
    }
    if (n) names.push(n);
  }
  out.materialType = [...new Set(names)].join(', ').slice(0, 500);
  if (wds) {
    out.wdsNumber = wds.ref_no || '';
    out.totalWeight = wds.total_weight != null ? String(wds.total_weight) : '';
    if (!out.materialType && wds.waste_description) out.materialType = String(wds.waste_description).slice(0, 500);
  }
  if (!out.totalWeight && items.length) {
    const total = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    if (total) out.totalWeight = String(total);
  }
  if (deal.certificate_required) out.certificates = arr(deal.required_certificate_types);
  out.dmInspectionRequired = deal.dubai_municipality_inspection ? true : null;
  return out;
};

const shape = r => {
  if (!r) return null;
  const p = r.get ? r.get({ plain: true }) : r;
  return {
    id: p.id, sourceType: p.source_type, sourceId: p.source_id, requestType: p.request_type,
    companyName: p.company_name, contactPerson: p.contact_person, contactPhone: p.contact_phone, contactEmail: p.contact_email,
    requestDate: p.request_date, requestTime: p.request_time,
    locationType: p.location_type, locationAddress: p.location_address, gatePassRequired: p.gate_pass_required,
    serviceType: p.service_type, materialType: p.material_type, totalWeight: p.total_weight,
    truckRequired: p.truck_required || [], packingType: p.packing_type,
    laborRequired: p.labor_required, laborCount: p.labor_count,
    wdsNumber: p.wds_number, wdsFoodType: p.wds_food_type, dmInspectionRequired: p.dm_inspection_required,
    pickupNoteRequired: p.pickup_note_required, grnRequired: p.grn_required,
    photos: p.photos || [],
    certificates: p.certificates || [],
    certificateLabels: (p.certificates || []).map(c => CERT_LABELS[c] || c),
    additionalNotes: p.additional_notes, requestedBy: p.requested_by, createdAt: p.created_at, updatedAt: p.updated_at,
  };
};

const getBySource = async (tenantId, sourceType, sourceId) => {
  await loadSource(tenantId, sourceType, sourceId);
  const row = await db.PickupRequest.findOne({ where: { tenant_id: tenantId, source_type: sourceType, source_id: sourceId } });
  return shape(row);
};

/** Create or replace the request for a quotation / purchase order. Ignored when the body carries no request. */
const save = async (tenantId, sourceType, sourceId, data, userId = null) => {
  if (!data || typeof data !== 'object') return null;
  await loadSource(tenantId, sourceType, sourceId);
  const fields = {
    request_type: data.requestType === 'delivery' ? 'delivery' : 'pickup',
    company_name: str(data.companyName, 255),
    contact_person: str(data.contactPerson, 255),
    contact_phone: str(data.contactPhone, 100),
    contact_email: str(data.contactEmail, 255),
    request_date: str(data.requestDate, 10),
    request_time: str(data.requestTime, 20),
    location_type: ['main_land', 'free_zone'].includes(data.locationType) ? data.locationType : null,
    location_address: str(data.locationAddress, 500),
    gate_pass_required: bool(data.gatePassRequired),
    service_type: ['service', 'purchase', 'free_of_charge'].includes(data.serviceType) ? data.serviceType : null,
    material_type: str(data.materialType, 500),
    total_weight: str(data.totalWeight, 100),
    truck_required: arr(data.truckRequired),
    packing_type: ['unpacked', 'packed', 'palletized'].includes(data.packingType) ? data.packingType : null,
    labor_required: bool(data.laborRequired),
    labor_count: bool(data.laborRequired) && Number(data.laborCount) > 0 ? Math.floor(Number(data.laborCount)) : null,
    wds_number: str(data.wdsNumber, 100),
    wds_food_type: ['food', 'non_food'].includes(data.wdsFoodType) ? data.wdsFoodType : null,
    dm_inspection_required: bool(data.dmInspectionRequired),
    pickup_note_required: bool(data.pickupNoteRequired),
    grn_required: bool(data.grnRequired),
    certificates: arr(data.certificates),
    additional_notes: str(data.additionalNotes, 5000),
    requested_by: str(data.requestedBy, 255),
  };
  const photos = cleanPhotos(data.photos);
  if (photos !== undefined) fields.photos = photos;
  const where = { tenant_id: tenantId, source_type: sourceType, source_id: sourceId };
  // Only one request per deal: a request already made for another quotation / order of this deal moves here (or is refused once approved).
  const source = await loadSource(tenantId, sourceType, sourceId);
  const dealLevel = await dealRequest(tenantId, source);
  if (dealLevel && !(dealLevel.row.source_type === sourceType && Number(dealLevel.row.source_id) === Number(sourceId))) {
    if (dealLevel.ownerApproved) throw ApiError.badRequest('This deal already has a pickup / delivery request');
    await dealLevel.row.update({ source_type: sourceType, source_id: sourceId });
  }
  const existing = await db.PickupRequest.findOne({ where });
  if (existing) await existing.update(fields);
  else await db.PickupRequest.create({ ...where, ...fields, created_by: userId });
  return getBySource(tenantId, sourceType, sourceId);
};

module.exports = { prefill, getBySource, save, assertReadyForApproval, CERT_LABELS };
