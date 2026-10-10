/**
 * Inspection Report PDF Service - Converts a deal's inspection report to PDF using Puppeteer.
 * Follows the same HTML-to-PDF pattern as pdf.service.js (logo data URI, escapeHtml/formatDate
 * helpers, simple inline-styled document) rather than a shared template file, since the
 * inspection report is a single self-contained document.
 */
const path = require('path');
const fs = require('fs');
const db = require('../models');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}

let cachedLogoDataUri = null;
function getLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const logoPath = path.join(__dirname, '../templates/logo.png');
    const buf = fs.readFileSync(logoPath);
    cachedLogoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  } catch (e) {
    cachedLogoDataUri = '';
  }
  return cachedLogoDataUri;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/</g, '&lt;');
}

function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatNum(n) {
  if (n == null || n === '') return '-';
  const num = parseFloat(n);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function titleCase(value) {
  if (!value) return '-';
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function personFullName(person) {
  if (!person) return null;
  return `${person.first_name || ''} ${person.last_name || ''}`.trim() || null;
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
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '18mm', right: '15mm', bottom: '18mm', left: '15mm' } });
    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Generates the inspection report PDF for a deal. Returns null when the deal or its
 * inspection report cannot be found, so the controller can respond with 404.
 */
async function generateInspectionReportPdf(dealId, tenantId) {
  const deal = await db.Deal.findOne({
    where: { id: dealId, tenant_id: tenantId },
    include: [
      { model: db.Company, as: 'company', attributes: ['id', 'company_name'], required: false },
      { model: db.Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name'], required: false },
      {
        model: db.DealInspectionReport,
        as: 'inspectionReport',
        include: [
          { model: db.User, as: 'inspector', attributes: ['id', 'first_name', 'last_name'], required: false },
          { model: db.User, as: 'approvedBy', attributes: ['id', 'first_name', 'last_name'], required: false },
        ],
        required: false,
      },
    ],
  });
  if (!deal || !deal.inspectionReport) return null;

  const tenant = await db.Tenant.findByPk(tenantId);
  const report = deal.inspectionReport;

  const clientName = deal.company?.company_name || personFullName(deal.contact) || '-';
  const inspectorName = personFullName(report.inspector) || '-';
  const approvedByName = personFullName(report.approvedBy);

  const images = Array.isArray(report.images) ? report.images : [];
  let imagesHtml = '<div class="muted">No images attached.</div>';
  if (images.length > 0) {
    const items = images.map((p) => {
      const name = String(p).split('/').pop();
      return `<li>${escapeHtml(name)}</li>`;
    }).join('');
    imagesHtml = `<div class="images-count">${images.length} image${images.length === 1 ? '' : 's'} attached (view in the deal for full-size images):</div><ul class="images-list">${items}</ul>`;
  }

  const html = `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #222; margin: 0; padding: 0; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a7a4c; padding-bottom: 14px; margin-bottom: 18px; }
      .header img { height: 46px; }
      .title { font-size: 19px; font-weight: bold; color: #1a7a4c; text-align: right; }
      .subtitle { font-size: 11px; color: #666; text-align: right; margin-top: 2px; }
      .section { margin-bottom: 18px; }
      .section-title { font-size: 12.5px; font-weight: bold; color: #1a7a4c; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
      table.kv { width: 100%; border-collapse: collapse; }
      table.kv td { padding: 6px 8px; border: 1px solid #e0e0e0; font-size: 12px; vertical-align: top; }
      table.kv td.label { width: 34%; font-weight: bold; background: #f7faf8; color: #444; }
      .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10.5px; font-weight: bold; }
      .status-approved { background: #e3f6ea; color: #1a7a4c; }
      .status-pending { background: #fff3e0; color: #a35b00; }
      .muted { color: #888; font-style: italic; }
      .images-count { margin-bottom: 6px; font-weight: bold; }
      .images-list { margin: 0; padding-left: 18px; font-size: 11.5px; color: #444; }
      .notes-box { border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px; background: #fafafa; white-space: pre-wrap; font-size: 12px; min-height: 20px; }
      .footer { margin-top: 28px; font-size: 9.5px; color: #999; text-align: center; }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${getLogoDataUri()}" />
      <div>
        <div class="title">INSPECTION REPORT</div>
        <div class="subtitle">${escapeHtml(tenant?.company_name || 'Clear Earth Recycling LLC')}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Deal Information</div>
      <table class="kv">
        <tr><td class="label">Deal Number</td><td>${escapeHtml(deal.deal_number || '-')}</td></tr>
        <tr><td class="label">Deal Title</td><td>${escapeHtml(deal.title || '-')}</td></tr>
        <tr><td class="label">Client</td><td>${escapeHtml(clientName)}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Inspection Details</div>
      <table class="kv">
        <tr><td class="label">Inspection Date &amp; Time</td><td>${escapeHtml(formatDateTime(report.inspection_datetime))}</td></tr>
        <tr><td class="label">Inspector</td><td>${escapeHtml(inspectorName)}</td></tr>
        <tr><td class="label">Approximate Weight</td><td>${report.approximate_weight != null ? `${formatNum(report.approximate_weight)} ${escapeHtml(report.weight_uom || '')}` : '-'}</td></tr>
        <tr><td class="label">Cargo Packing Type</td><td>${escapeHtml(titleCase(report.cargo_type))}</td></tr>
        <tr><td class="label">Transportation Arrangement</td><td>${escapeHtml(titleCase(report.transportation_arrangement))}</td></tr>
        <tr><td class="label">Approximate Value</td><td>${report.approximate_value != null ? formatNum(report.approximate_value) : '-'}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Approval</div>
      <table class="kv">
        <tr>
          <td class="label">Status</td>
          <td>
            ${approvedByName
              ? `<span class="status-badge status-approved">Approved</span>`
              : `<span class="status-badge status-pending">Pending Approval</span>`}
          </td>
        </tr>
        ${approvedByName ? `<tr><td class="label">Approved By</td><td>${escapeHtml(approvedByName)}</td></tr>` : ''}
      </table>
    </div>

    <div class="section">
      <div class="section-title">Images</div>
      ${imagesHtml}
    </div>

    <div class="section">
      <div class="section-title">Notes</div>
      <div class="notes-box">${report.notes ? escapeHtml(report.notes).replace(/\n/g, '<br>') : '<span class="muted">No notes.</span>'}</div>
    </div>

    <div class="footer">Generated on ${formatDate(new Date())}</div>
  </body>
  </html>`;

  return htmlToPdf(html);
}

module.exports = {
  generateInspectionReportPdf,
};
