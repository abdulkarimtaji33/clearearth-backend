/**
 * Certificate PDF generation service — new additive file, kept separate from
 * pdf.service.js (per this project's established low-risk-change pattern),
 * but following the exact same Puppeteer/HTML-render approach.
 */
const path = require('path');
const fs = require('fs');
const db = require('../models');
const config = require('../config');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}

let cachedLogoDataUri = null;
function getLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const logoPath = path.join(__dirname, '../templates/logo.png');
  const buf = fs.readFileSync(logoPath);
  cachedLogoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  return cachedLogoDataUri;
}

const IMAGE_MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

/** Inline an uploaded attachment (stored under UPLOAD_PATH) as a base64 data URI for Puppeteer rendering. */
function fileToDataUri(relativeOrUrlPath) {
  if (!relativeOrUrlPath) return '';
  try {
    const cleaned = String(relativeOrUrlPath).replace(/^\/?uploads\//, '');
    const uploadRoot = config.upload.path;
    const absolute = path.resolve(uploadRoot, cleaned);
    if (!absolute.startsWith(path.resolve(uploadRoot))) return '';
    const mime = IMAGE_MIME_BY_EXT[path.extname(absolute).toLowerCase()] || 'image/jpeg';
    if (!fs.existsSync(absolute)) return '';
    return `data:${mime};base64,${fs.readFileSync(absolute).toString('base64')}`;
  } catch (e) {
    return '';
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMonthYear(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatNum(n) {
  const num = parseFloat(n);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function renderTemplate(templatePath, data) {
  let html = fs.readFileSync(templatePath, 'utf8');
  const keys = Object.keys(data).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const placeholder = `{{${key}}}`;
    const val = String(data[key] ?? '');
    html = html.split(placeholder).join(val);
  }
  html = html.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');
  return html;
}

async function htmlToPdf(html) {
  if (!puppeteer) {
    throw new Error('Puppeteer not installed. Run: npm install puppeteer');
  }
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function buildCompanyAddress(request) {
  // Certificate requests capture only a free-text company name / material details —
  // there is no dedicated address field, so fall back to material/waste details as a
  // best-effort descriptor line when nothing more specific is available.
  return request.material_waste_details ? '' : '';
}

async function loadCertificateWithContext(tenantId, certificateId) {
  const certificate = await db.Certificate.findOne({
    where: { id: certificateId, tenant_id: tenantId },
    include: [
      {
        model: db.CertificateRequest,
        as: 'request',
        include: [
          { model: db.MaterialType, as: 'materialType', required: false },
          { model: db.CertificateRequestAttachment, as: 'attachments', separate: true },
        ],
      },
      { model: db.CertificateItem, as: 'items', separate: true, order: [['sl_no', 'ASC'], ['id', 'ASC']] },
    ],
  });
  if (!certificate) throw new Error('Certificate not found');
  const tenant = await db.Tenant.findByPk(tenantId);
  return { certificate, request: certificate.request, tenant };
}

function buildItemRowsHtml(items, { qtyUnit = null, itemized = false } = {}) {
  if (!items || !items.length) {
    return '<tr><td colspan="6" style="text-align:center;color:#999;">No items recorded</td></tr>';
  }
  return items
    .map((it, idx) => {
      if (itemized) {
        return `<tr>
          <td>${it.sl_no || idx + 1}</td>
          <td>${escapeHtml(it.description)}</td>
          <td>${escapeHtml(it.manufacturer || '-')}</td>
          <td>${escapeHtml(it.model_no || '-')}</td>
          <td>${escapeHtml(it.serial_no || '-')}</td>
          <td>${formatNum(it.qty)}</td>
        </tr>`;
      }
      return `<tr>
        <td>${it.sl_no || idx + 1}</td>
        <td>${escapeHtml(it.description)}</td>
        <td>${formatNum(it.qty)}${qtyUnit ? ` ${qtyUnit}` : ''}</td>
      </tr>`;
    })
    .join('');
}

async function generateGreenCertificate(certificate, request, tenant) {
  const html = renderTemplate(path.join(__dirname, '../templates/green-certificate.html'), {
    logoDataUri: getLogoDataUri(),
    certNo: certificate.certificate_number,
    tonsValue: formatNum(request.total_weight_quantity),
    wasteType: escapeHtml(request.material_waste_details),
    companyName: escapeHtml(request.company_name),
    companyAddress: escapeHtml(buildCompanyAddress(request)),
    monthYear: formatMonthYear(request.collection_date),
    collectionDate: formatDate(request.collection_date),
    certificationDate: formatDate(certificate.issued_date),
  });
  return htmlToPdf(html);
}

async function generateCertificateOfDestruction(certificate, request, tenant) {
  const items = certificate.items?.length
    ? certificate.items
    : [{ sl_no: 1, description: request.material_waste_details, qty: request.total_weight_quantity, unit: 'tons' }];
  const html = renderTemplate(path.join(__dirname, '../templates/certificate-of-destruction.html'), {
    logoDataUri: getLogoDataUri(),
    certNo: certificate.certificate_number,
    companyName: escapeHtml(request.company_name),
    companyAddress: escapeHtml(buildCompanyAddress(request)),
    material: escapeHtml(request.material_waste_details),
    units: '',
    totalTons: formatNum(request.total_weight_quantity),
    collectionDate: formatDate(request.collection_date),
    certificationDate: formatDate(certificate.issued_date),
    itemRowsHtml: buildItemRowsHtml(items, { qtyUnit: 'Tons' }),
  });
  return htmlToPdf(html);
}

async function generateCertificateOfDataDestruction(certificate, request, tenant) {
  const items = certificate.items?.length
    ? certificate.items
    : [{ sl_no: 1, description: request.material_waste_details, qty: request.total_weight_quantity, unit: 'nos' }];
  const totalUnits = items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0), 0);
  const html = renderTemplate(path.join(__dirname, '../templates/certificate-of-data-destruction.html'), {
    logoDataUri: getLogoDataUri(),
    certNo: certificate.certificate_number,
    companyName: escapeHtml(request.company_name),
    companyAddress: escapeHtml(buildCompanyAddress(request)),
    material: escapeHtml(request.material_waste_details),
    units: '',
    totalUnits: formatNum(totalUnits || request.total_weight_quantity),
    collectionDate: formatDate(request.collection_date),
    certificationDate: formatDate(certificate.issued_date),
    itemRowsHtml: buildItemRowsHtml(items, { qtyUnit: 'Nos' }),
  });
  return htmlToPdf(html);
}

async function generateCarbonFootprintReport(certificate, request, tenant) {
  const companyLogoHtml = `<div class="co-fallback">${escapeHtml(request.company_name)}</div>`;
  const html = renderTemplate(path.join(__dirname, '../templates/carbon-footprint-report.html'), {
    logoDataUri: getLogoDataUri(),
    companyLogoHtml,
    companyName: escapeHtml(request.company_name),
    totalTons: formatNum(request.total_weight_quantity),
    co2SavedNos: formatNum(certificate.co2_saved),
    litersSaved: formatNum(certificate.liters_saved),
    kgSaved: formatNum(certificate.kg_saved),
  });
  return htmlToPdf(html);
}

function buildEvidenceAppendixHtml(photos) {
  if (!photos.length) return '';
  const items = photos
    .map((p) => `<div class="evidence-item">
      <img src="${fileToDataUri(p.file_path)}" alt="Evidence" />
      <div class="evidence-caption">${escapeHtml((p.photo_stage || 'other').replace(/_/g, ' '))}</div>
    </div>`)
    .join('');
  return `<div class="evidence-page">
    <div class="evidence-title">Supporting Evidence</div>
    <div class="evidence-grid">${items}</div>
  </div>`;
}

async function generateDisposalReportItemized(certificate, request, tenant) {
  const items = certificate.items?.length
    ? certificate.items
    : [{ sl_no: 1, description: request.material_waste_details, qty: request.total_weight_quantity, manufacturer: null, model_no: null, serial_no: null }];
  const totalWeightKg = parseFloat(request.total_weight_quantity) * 1000;
  const photos = (request.attachments || []).filter((a) => a.file_type === 'destruction_photo');

  const html = renderTemplate(path.join(__dirname, '../templates/disposal-report-itemized.html'), {
    logoDataUri: getLogoDataUri(),
    certNo: certificate.certificate_number,
    toCompany: 'Clear Earth Recycling LLC',
    toAddress: '#03B, Phase 1, Block B, Dubai Industrial City, Dubai, UAE',
    fromCompany: escapeHtml(request.company_name),
    fromAddress: escapeHtml(buildCompanyAddress(request) || request.contact_person),
    fromContact: escapeHtml(`${request.contact_person} | ${request.contact_no} | ${request.contact_email}`),
    totalWeightKg: formatNum(totalWeightKg),
    itemRowsHtml: buildItemRowsHtml(items, { itemized: true }),
    issuedDate: formatDate(certificate.issued_date),
    evidenceAppendixHtml: buildEvidenceAppendixHtml(photos),
  });
  return htmlToPdf(html);
}

function buildPhotoPagesHtml(photos) {
  if (!photos.length) return '';
  // Group consecutive photos of the same stage into pairs (2-per-page), otherwise 1-per-page.
  const stageLabels = {
    arrival: 'MONITORING PHOTOS | ARRIVAL OF THE MATERIALS',
    destruction_in_progress: 'MONITORING PHOTOS | DESTRUCTION IN PROGRESS',
    other: 'MONITORING PHOTOS',
  };
  const pages = [];
  let i = 0;
  while (i < photos.length) {
    const current = photos[i];
    const next = photos[i + 1];
    if (next && next.photo_stage === current.photo_stage) {
      pages.push({ stage: current.photo_stage, photos: [current, next] });
      i += 2;
    } else {
      pages.push({ stage: current.photo_stage, photos: [current] });
      i += 1;
    }
  }
  return pages
    .map((pg) => {
      const label = stageLabels[pg.stage] || stageLabels.other;
      const gridClass = pg.photos.length === 2 ? 'photo-grid-2' : 'photo-grid-1';
      const imgs = pg.photos.map((p) => `<img src="${fileToDataUri(p.file_path)}" alt="Destruction photo" />`).join('');
      return `<div class="photo-page">
        <div class="doc-title">DESTRUCTION PICTURES</div>
        <div class="stage-label">${escapeHtml(label)}</div>
        <div class="${gridClass}">${imgs}</div>
      </div>`;
    })
    .join('');
}

async function generateDisposalReportPhotos(certificate, request, tenant) {
  const photos = (request.attachments || []).filter((a) => a.file_type === 'destruction_photo').sort((a, b) => {
    const order = { arrival: 0, destruction_in_progress: 1, other: 2 };
    return (order[a.photo_stage] ?? 2) - (order[b.photo_stage] ?? 2) || a.id - b.id;
  });

  const sourceLine = [
    request.wds_ref_no ? `${request.wds_ref_no}` : null,
    request.doc_ref ? `DOC Ref: ${request.doc_ref}` : null,
    request.req_no ? `Req No.: ${request.req_no}` : null,
    request.boe_no ? `BOE No.: ${request.boe_no}` : null,
    request.barcode ? `Barcode: ${request.barcode}` : null,
  ].filter(Boolean).join(' | ');

  const html = renderTemplate(path.join(__dirname, '../templates/disposal-report-photos.html'), {
    logoDataUri: getLogoDataUri(),
    certNo: certificate.certificate_number,
    companyName: escapeHtml(request.company_name),
    wasteLocation: escapeHtml(buildCompanyAddress(request) || '-'),
    itemDescription: escapeHtml(request.material_waste_details),
    clientContact: escapeHtml(`${request.contact_person} | ${request.contact_no} | ${request.contact_email}`),
    sourceLine: escapeHtml(sourceLine || '-'),
    collectionDate: formatDate(request.collection_date),
    destructionDate: formatDate(certificate.issued_date),
    totalQuantity: `${formatNum(request.total_weight_quantity)} Tons`,
    photoPagesHtml: buildPhotoPagesHtml(photos),
  });
  return htmlToPdf(html);
}

async function generateDestructionReportEvidence(certificate, request, tenant) {
  if (request.destruction_report_variant === 'bulk_material') {
    return generateDisposalReportPhotos(certificate, request, tenant);
  }
  return generateDisposalReportItemized(certificate, request, tenant);
}

const GENERATORS = {
  green_certificate: generateGreenCertificate,
  certificate_of_destruction: generateCertificateOfDestruction,
  certificate_of_data_destruction: generateCertificateOfDataDestruction,
  carbon_footprint: generateCarbonFootprintReport,
  destruction_report_evidence: generateDestructionReportEvidence,
};

async function generateCertificatePdf(tenantId, certificateId) {
  const { certificate, request, tenant } = await loadCertificateWithContext(tenantId, certificateId);
  const generator = GENERATORS[certificate.type];
  if (!generator) throw new Error(`No PDF generator for certificate type: ${certificate.type}`);
  return generator(certificate, request, tenant);
}

module.exports = {
  generateCertificatePdf,
  // Exported individually for targeted testing.
  generateGreenCertificate,
  generateCertificateOfDestruction,
  generateCertificateOfDataDestruction,
  generateCarbonFootprintReport,
  generateDisposalReportItemized,
  generateDisposalReportPhotos,
};
