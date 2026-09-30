/**
 * HR Forms PDF Service — IT Asset Form, Salary Certificate, Salary Slip,
 * Handover Form.
 *
 * Deliberately a separate file from pdf.service.js / employeePdf.service.js:
 * it follows the same HTML-template-to-PDF (Puppeteer) approach and visual
 * style used elsewhere in this project (company header with logo, clean
 * table styling) but is self-contained so it doesn't collide with
 * concurrent work on those files.
 */
const path = require('path');
const fs = require('fs');
const db = require('../models');
const { amountInWords } = require('../utils/numberToWords');
const salaryStructureService = require('./salaryStructure.service');
const ApiError = require('../utils/apiError');

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
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatNum(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function employeeFullName(employee) {
  return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
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

/** Shared page shell — header (logo + tenant name) and base styles, matching the visual
 * style used by generatePayslipPdf in pdf.service.js (green accent, clean tables). */
function renderShell({ tenant, title, bodyHtml }) {
  let logoHtml = '';
  try {
    const uri = getLogoDataUri();
    if (uri) logoHtml = `<img src="${uri}" style="height:48px;" />`;
  } catch (e) {
    logoHtml = '';
  }
  const companyName = escapeHtml(tenant?.company_name || 'Clear Earth Recycling LLC');
  const companyAddr = [tenant?.address, tenant?.city].filter(Boolean).join(', ');

  return `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; color: #222; margin: 0; padding: 0; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a7a4c; padding-bottom: 12px; margin-bottom: 20px; }
      .company-block { text-align: right; }
      .company-name { font-weight: bold; font-size: 13px; color: #1a7a4c; }
      .company-addr { font-size: 10px; color: #666; }
      .title { font-size: 18px; font-weight: bold; color: #1a7a4c; margin: 4px 0 20px; text-transform: uppercase; letter-spacing: 0.5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      td, th { padding: 6px 8px; border: 1px solid #ddd; font-size: 12px; }
      th { background: #f2f6f4; text-align: left; }
      .totals-row td { font-weight: bold; background: #f8faf9; }
      .meta { margin-bottom: 16px; }
      .meta div { margin-bottom: 4px; }
      .meta strong { display: inline-block; min-width: 140px; }
      .note { margin-top: 16px; font-size: 11px; color: #666; font-style: italic; }
      .sig-block { margin-top: 56px; }
      .sig-line { display: flex; justify-content: space-between; margin-top: 40px; }
      .sig-item { width: 45%; border-top: 1px solid #333; padding-top: 6px; font-size: 11px; }
      .checklist { margin-top: 8px; }
      .checklist-item { display: flex; align-items: center; margin-bottom: 8px; font-size: 12px; }
      .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #333; margin-right: 10px; flex-shrink: 0; }
      p.footer-note { margin-top: 24px; font-size: 10px; color: #888; }
    </style>
  </head>
  <body>
    <div class="header">
      <div>${logoHtml}</div>
      <div class="company-block">
        <div class="company-name">${companyName}</div>
        <div class="company-addr">${escapeHtml(companyAddr)}</div>
      </div>
    </div>
    <div class="title">${escapeHtml(title)}</div>
    ${bodyHtml}
    <p class="footer-note">Generated on ${formatDate(new Date())}</p>
  </body>
  </html>`;
}

async function loadEmployee(employeeId, tenantId) {
  const employee = await db.Employee.findOne({
    where: { id: employeeId, tenant_id: tenantId },
    include: [
      { model: db.Department, as: 'department', required: false },
      { model: db.Designation, as: 'designation', required: false },
    ],
  });
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
}

// ---------------------------------------------------------------------------
// 10a. IT Asset Form
// ---------------------------------------------------------------------------
async function generateAssetFormPdf(employeeId, tenantId) {
  const employee = await loadEmployee(employeeId, tenantId);
  const tenant = await db.Tenant.findByPk(tenantId);

  const assets = await db.EmployeeAsset.findAll({
    where: { tenant_id: tenantId, employee_id: employeeId, status: 'assigned' },
    order: [['assigned_date', 'DESC'], ['id', 'DESC']],
  });

  let rowsHtml = '';
  assets.forEach((a) => {
    rowsHtml += `<tr>
      <td>${escapeHtml(a.asset_type || '-')}</td>
      <td>${escapeHtml(a.asset_name || '-')}</td>
      <td>${escapeHtml(a.serial_number || '-')}</td>
      <td>${formatDate(a.assigned_date) || '-'}</td>
    </tr>`;
  });
  if (!rowsHtml) rowsHtml = '<tr><td colspan="4" style="text-align:center;color:#888;">No assets currently assigned</td></tr>';

  const bodyHtml = `
    <div class="meta">
      <div><strong>Employee Name:</strong> ${escapeHtml(employeeFullName(employee))}</div>
      <div><strong>Employee Code:</strong> ${escapeHtml(employee.employee_code)}</div>
      <div><strong>Department:</strong> ${escapeHtml(employee.department?.name || '-')}</div>
      <div><strong>Designation:</strong> ${escapeHtml(employee.designation?.display_name || '-')}</div>
    </div>
    <table>
      <tr><th>Asset Type</th><th>Asset Name / Description</th><th>Serial Number</th><th>Assigned Date</th></tr>
      ${rowsHtml}
    </table>
    <div class="sig-block">
      <p>I acknowledge receipt of the above listed company asset(s) in good working condition and agree to return them upon request or upon separation from the company.</p>
      <div class="sig-line">
        <div class="sig-item">Employee Signature: ______________________&nbsp;&nbsp;&nbsp; Date: ____________</div>
        <div class="sig-item">IT/HR Signature: ______________________&nbsp;&nbsp;&nbsp; Date: ____________</div>
      </div>
    </div>
  `;

  const html = renderShell({ tenant, title: 'IT Asset Form', bodyHtml });
  return htmlToPdf(html);
}

// ---------------------------------------------------------------------------
// 10b. Salary Certificate
// ---------------------------------------------------------------------------
async function generateSalaryCertificatePdf(employeeId, tenantId) {
  const employee = await loadEmployee(employeeId, tenantId);
  const tenant = await db.Tenant.findByPk(tenantId);

  const structure = await salaryStructureService.getActive(tenantId, employeeId);
  if (!structure) {
    throw ApiError.badRequest('No active salary structure — cannot generate a salary certificate');
  }

  const gross = (parseFloat(structure.basic_salary) || 0)
    + (parseFloat(structure.housing_allowance) || 0)
    + (parseFloat(structure.transport_allowance) || 0)
    + (parseFloat(structure.other_allowance) || 0);
  const currency = structure.currency || 'AED';

  const today = formatDate(new Date());

  const bodyHtml = `
    <div style="margin-bottom:16px;">${today}</div>
    <div style="font-weight:bold; margin-bottom:16px;">TO WHOM IT MAY CONCERN</div>
    <p style="line-height:1.8;">
      This is to certify that <strong>${escapeHtml(employeeFullName(employee))}</strong>
      (Employee Code: <strong>${escapeHtml(employee.employee_code)}</strong>) is a
      ${escapeHtml(employee.employment_status === 'active' ? 'current, active' : (employee.employment_status || '').replace(/_/g, ' '))}
      employee of ${escapeHtml(tenant?.company_name || 'Clear Earth Recycling LLC')}, working as
      <strong>${escapeHtml(employee.designation?.display_name || '-')}</strong> in the
      <strong>${escapeHtml(employee.department?.name || '-')}</strong> department, since
      <strong>${formatDate(employee.date_of_joining) || '-'}</strong>.
    </p>
    <p style="line-height:1.8;">
      The employee's current monthly gross salary is
      <strong>${currency} ${formatNum(gross)}</strong>
      (${escapeHtml(amountInWords(gross, currency))} only), comprising of Basic Salary of
      ${currency} ${formatNum(structure.basic_salary)} and total allowances of
      ${currency} ${formatNum(gross - (parseFloat(structure.basic_salary) || 0))}.
    </p>
    <p style="line-height:1.8;">
      This certificate is issued upon the employee's request for whatever purpose it may serve them best.
    </p>
    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-item">HR / Management Signature: ______________________</div>
        <div class="sig-item">Date: ____________</div>
      </div>
    </div>
  `;

  const html = renderShell({ tenant, title: 'Salary Certificate', bodyHtml });
  return htmlToPdf(html);
}

// ---------------------------------------------------------------------------
// 10c. Salary Slip (standalone, on-demand)
// ---------------------------------------------------------------------------
async function generateSalarySlipPdf(employeeId, tenantId) {
  const employee = await loadEmployee(employeeId, tenantId);
  const tenant = await db.Tenant.findByPk(tenantId);

  const structure = await salaryStructureService.getActive(tenantId, employeeId);
  if (!structure) {
    throw ApiError.badRequest('No active salary structure — cannot generate a salary slip');
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const periodLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const currency = structure.currency || 'AED';

  const basic = parseFloat(structure.basic_salary) || 0;
  const housing = parseFloat(structure.housing_allowance) || 0;
  const supplement = parseFloat(structure.other_allowance) || 0;
  const gross = basic + housing + (parseFloat(structure.transport_allowance) || 0) + supplement;

  const bodyHtml = `
    <div class="meta">
      <div><strong>Employee Name:</strong> ${escapeHtml(employeeFullName(employee))}</div>
      <div><strong>Employee Code:</strong> ${escapeHtml(employee.employee_code)}</div>
      <div><strong>Department:</strong> ${escapeHtml(employee.department?.name || '-')}</div>
      <div><strong>Designation:</strong> ${escapeHtml(employee.designation?.display_name || '-')}</div>
      <div><strong>Period:</strong> ${escapeHtml(periodLabel)}</div>
    </div>
    <table>
      <tr><th>Component</th><th style="text-align:right;">Amount (${currency})</th></tr>
      <tr><td>Basic Salary</td><td style="text-align:right;">${formatNum(basic)}</td></tr>
      <tr><td>Housing Allowance</td><td style="text-align:right;">${formatNum(housing)}</td></tr>
      <tr><td>Supplement Allowance</td><td style="text-align:right;">${formatNum(supplement)}</td></tr>
      ${parseFloat(structure.transport_allowance) ? `<tr><td>Transport Allowance</td><td style="text-align:right;">${formatNum(structure.transport_allowance)}</td></tr>` : ''}
      <tr class="totals-row"><td>Gross Total</td><td style="text-align:right;">${formatNum(gross)}</td></tr>
    </table>
    <div class="note">This is a current salary summary, not an official payslip for a specific pay period.</div>
  `;

  const html = renderShell({ tenant, title: 'Current Salary Slip', bodyHtml });
  return htmlToPdf(html);
}

// ---------------------------------------------------------------------------
// 10d. Handover Form
// ---------------------------------------------------------------------------
async function generateHandoverFormPdf(employeeId, tenantId) {
  const employee = await loadEmployee(employeeId, tenantId);
  const tenant = await db.Tenant.findByPk(tenantId);

  const assets = await db.EmployeeAsset.findAll({
    where: { tenant_id: tenantId, employee_id: employeeId },
    order: [['id', 'DESC']],
  });

  let rowsHtml = '';
  assets.forEach((a) => {
    rowsHtml += `<tr>
      <td>${escapeHtml(a.asset_type || '-')}</td>
      <td>${escapeHtml(a.asset_name || '-')}</td>
      <td>${escapeHtml(a.serial_number || '-')}</td>
      <td>${escapeHtml(a.status === 'returned' ? 'Returned' : 'Assigned')}</td>
    </tr>`;
  });
  if (!rowsHtml) rowsHtml = '<tr><td colspan="4" style="text-align:center;color:#888;">No assets on record</td></tr>';

  const checklistItems = [
    'Company ID Card',
    'Laptop / Equipment',
    'Access Cards',
    'Company Documents',
    'Outstanding Dues Cleared',
  ];
  const checklistHtml = checklistItems.map((item) => `
    <div class="checklist-item"><span class="checkbox"></span>${escapeHtml(item)}</div>
  `).join('');

  const bodyHtml = `
    <div class="meta">
      <div><strong>Employee Name:</strong> ${escapeHtml(employeeFullName(employee))}</div>
      <div><strong>Employee Code:</strong> ${escapeHtml(employee.employee_code)}</div>
      <div><strong>Department:</strong> ${escapeHtml(employee.department?.name || '-')}</div>
      <div><strong>Exit Date:</strong> ${formatDate(employee.date_of_exit) || '____________ (to be filled)'}</div>
    </div>

    <div style="font-weight:bold; margin-top:16px; margin-bottom:4px;">Assets on Record</div>
    <table>
      <tr><th>Asset Type</th><th>Asset Name / Description</th><th>Serial Number</th><th>Status</th></tr>
      ${rowsHtml}
    </table>

    <div style="font-weight:bold; margin-top:20px; margin-bottom:4px;">Handover Checklist</div>
    <div class="checklist">${checklistHtml}</div>

    <div class="sig-block">
      <div class="sig-line">
        <div class="sig-item">Employee Signature / Date: ______________________</div>
        <div class="sig-item">HR Signature / Date: ______________________</div>
      </div>
      <div class="sig-line">
        <div class="sig-item">IT/Admin Signature / Date: ______________________</div>
        <div class="sig-item"></div>
      </div>
    </div>
  `;

  const html = renderShell({ tenant, title: 'Handover Form', bodyHtml });
  return htmlToPdf(html);
}

module.exports = {
  generateAssetFormPdf,
  generateSalaryCertificatePdf,
  generateSalarySlipPdf,
  generateHandoverFormPdf,
};
