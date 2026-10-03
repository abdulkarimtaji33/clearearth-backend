/**
 * Employee Information PDF (HRM) — a single, all-in-one PDF per employee covering
 * their full profile: photo, personal/contact info, job details, compensation
 * summary (subject to salary_visible_to_employee for self-service callers), bank
 * details, emergency contacts, qualifications/skills/certifications, dependents,
 * and the 4 identity documents' recorded numbers/dates (not the files themselves).
 *
 * This is a NEW, standalone file — it deliberately does not modify pdf.service.js
 * (owned by another concurrent change) but follows the same rendering approach:
 * an HTML template string rendered to PDF via Puppeteer, with the same logo/company
 * header style. Puppeteer loading and a few formatting helpers are duplicated here
 * (a few lines) rather than importing from pdf.service.js, since that file exports
 * no shared helpers.
 */
const path = require('path');
const fs = require('fs');
const db = require('../models');
const ApiError = require('../utils/apiError');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/</g, '&lt;');
}

function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatNum(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function val(v) {
  if (v === null || v === undefined || v === '') return '-';
  return escapeHtml(v);
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

function getPhotoDataUri(profilePhotoRelativePath) {
  if (!profilePhotoRelativePath) return '';
  try {
    const config = require('../config');
    const uploadRoot = config.upload.path;
    const absolute = path.resolve(uploadRoot, profilePhotoRelativePath);
    if (!absolute.startsWith(path.resolve(uploadRoot))) return '';
    const ext = path.extname(absolute).toLowerCase();
    const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }[ext];
    if (!mime) return '';
    return `data:${mime};base64,${fs.readFileSync(absolute).toString('base64')}`;
  } catch (e) {
    return '';
  }
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
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16mm', right: '14mm', bottom: '16mm', left: '14mm' } });
    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}


/**
 * @param {number} tenantId
 * @param {number} employeeId
 * @param {{ includeCompensation?: boolean }} [options] includeCompensation defaults to true
 *   (HR viewing any employee always sees it); self-service callers pass the employee's
 *   own salary_visible_to_employee flag in here.
 */
async function generateEmployeeInfoPdf(tenantId, employeeId, options = {}) {
  const includeCompensation = options.includeCompensation !== false;

  const employee = await db.Employee.findOne({
    where: { id: employeeId, tenant_id: tenantId },
    include: [
      { model: db.Department, as: 'department', attributes: ['id', 'name'], required: false },
      { model: db.Designation, as: 'designation', attributes: ['id', 'display_name'], required: false },
      { model: db.Employee, as: 'manager', attributes: ['id', 'first_name', 'last_name'], required: false },
      { model: db.WorkLocation, as: 'workLocation', attributes: ['id', 'name'], required: false },
      { model: db.EmployeeEmergencyContact, as: 'emergencyContacts', required: false },
      { model: db.EmployeeDependent, as: 'dependents', required: false },
      { model: db.EmployeeQualification, as: 'qualifications', required: false },
      { model: db.EmployeeSkill, as: 'skills', required: false },
      { model: db.EmployeeCertification, as: 'certifications', required: false },
      {
        model: db.EmployeeDocument, as: 'documents', required: false,
        include: [{ model: db.DocumentType, as: 'documentType', attributes: ['id', 'name'], required: false }],
      },
    ],
  });
  if (!employee) throw ApiError.notFound('Employee not found');

  const tenant = await db.Tenant.findByPk(tenantId);

  let activeSalaryStructure = null;
  if (includeCompensation) {
    const salaryStructureService = require('./salaryStructure.service');
    activeSalaryStructure = await salaryStructureService.getActive(tenantId, employeeId);
  }

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  const photoHtml = (() => {
    const uri = getPhotoDataUri(employee.profile_photo);
    return uri ? `<img class="photo" src="${uri}" />` : '<div class="photo photo-placeholder"></div>';
  })();

  // -- Identity documents: number, issue and expiry come from the employee record --
  const identityRows = [
    ['Passport', employee.passport_number, employee.passport_issue_date, employee.passport_expiry_date],
    ['Emirates ID', employee.emirates_id_number, employee.emirates_id_issue_date, employee.emirates_id_expiry_date],
    ['UAE Visa', employee.visa_number, employee.visa_issue_date, employee.visa_expiry_date],
    ['Labour Card', employee.labour_card_no, employee.labour_card_issue_date, employee.labour_card_expiry_date],
  ];
  const identityDocsHtml = identityRows.map(([name, number, issue, expiry]) => `<tr>
      <td>${escapeHtml(name)}</td>
      <td>${val(number)}</td>
      <td>${formatDate(issue)}</td>
      <td>${formatDate(expiry)}</td>
    </tr>`).join('');

  const emergencyContactsHtml = (employee.emergencyContacts || []).length
    ? (employee.emergencyContacts || []).map((c) => `<tr>
        <td>${val(c.name)}</td><td>${val(c.relationship)}</td><td>${val(c.phone)}</td><td>${val(c.email)}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="muted">None recorded</td></tr>';

  const dependentsHtml = (employee.dependents || []).length
    ? (employee.dependents || []).map((d) => `<tr>
        <td>${val(d.name)}</td><td>${val(d.relationship)}</td><td>${formatDate(d.date_of_birth)}</td><td>${val(d.id_number)}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="muted">None recorded</td></tr>';

  const qualificationsList = (employee.qualifications || []).length
    ? (employee.qualifications || []).map((q) => `<li>${val(q.degree)}${q.institution ? ` — ${val(q.institution)}` : ''}${q.year ? ` (${val(q.year)})` : ''}${q.grade ? `, Grade: ${val(q.grade)}` : ''}</li>`).join('')
    : '<li class="muted">None recorded</li>';

  const skillsList = (employee.skills || []).length
    ? (employee.skills || []).map((s) => `<li>${val(s.skill_name)}${s.proficiency_level ? ` (${val(s.proficiency_level)})` : ''}</li>`).join('')
    : '<li class="muted">None recorded</li>';

  const certificationsList = (employee.certifications || []).length
    ? (employee.certifications || []).map((c) => `<li>${val(c.name)}${c.issuer ? ` — ${val(c.issuer)}` : ''}${c.expiry_date ? `, expires ${formatDate(c.expiry_date)}` : ''}</li>`).join('')
    : '<li class="muted">None recorded</li>';

  const compensationSectionHtml = includeCompensation
    ? (activeSalaryStructure
      ? `<table class="kv-table">
          <tr><td>Basic Salary</td><td>${formatNum(activeSalaryStructure.basic_salary)} ${escapeHtml(activeSalaryStructure.currency || 'AED')}</td></tr>
          <tr><td>Housing Allowance</td><td>${formatNum(activeSalaryStructure.housing_allowance)}</td></tr>
          <tr><td>Supplement Allowance</td><td>${formatNum(activeSalaryStructure.other_allowance)}</td></tr>
          <tr class="total-row"><td>Total Amount</td><td>${formatNum(
        (parseFloat(activeSalaryStructure.basic_salary) || 0)
            + (parseFloat(activeSalaryStructure.housing_allowance) || 0)
            + (parseFloat(activeSalaryStructure.transport_allowance) || 0)
            + (parseFloat(activeSalaryStructure.other_allowance) || 0)
      )}</td></tr>
        </table>`
      : '<p class="muted">No active salary structure on record.</p>')
    : '<p class="muted">Compensation details are not visible to you. Contact HR for details.</p>';

  const html = `
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #222; margin: 0; padding: 0; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a7a4c; padding-bottom: 12px; margin-bottom: 18px; }
      .title { font-size: 18px; font-weight: bold; color: #1a7a4c; }
      .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
      .profile-row { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
      .photo { width: 72px; height: 72px; border-radius: 6px; object-fit: cover; border: 1px solid #ddd; }
      .photo-placeholder { background: #f2f6f4; }
      .name { font-size: 16px; font-weight: bold; }
      .code { color: #666; font-size: 11px; }
      section { margin-bottom: 16px; page-break-inside: avoid; }
      h2 { font-size: 13px; color: #1a7a4c; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin: 0 0 8px; }
      table { width: 100%; border-collapse: collapse; }
      td, th { padding: 5px 7px; border: 1px solid #ddd; font-size: 10.5px; text-align: left; }
      th { background: #f2f6f4; }
      .kv-table td:first-child { font-weight: bold; width: 45%; background: #fafafa; }
      .total-row td { font-weight: bold; background: #f8faf9; }
      ul { margin: 4px 0; padding-left: 18px; }
      li { margin-bottom: 2px; }
      .muted { color: #999; font-style: italic; }
      .grid2 { display: flex; gap: 24px; }
      .grid2 > div { flex: 1; }
      .footer-note { margin-top: 24px; font-size: 9px; color: #888; }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${getLogoDataUri()}" style="height:42px;" />
      <div style="text-align:right;">
        <div class="title">Employee Information</div>
        <div class="subtitle">${escapeHtml(tenant?.company_name || 'Clear Earth Recycling LLC')}</div>
      </div>
    </div>

    <div class="profile-row">
      ${photoHtml}
      <div>
        <div class="name">${escapeHtml(fullName) || '-'}</div>
        <div class="code">${val(employee.employee_code)} &middot; ${val(employee.designation?.display_name)}</div>
      </div>
    </div>

    <section>
      <h2>Personal &amp; Basic Information</h2>
      <div class="grid2">
        <div>
          <table class="kv-table">
            <tr><td>Gender</td><td>${val(employee.gender)}</td></tr>
            <tr><td>Date of Birth</td><td>${formatDate(employee.date_of_birth)}</td></tr>
            <tr><td>Nationality</td><td>${val(employee.nationality)}</td></tr>
            <tr><td>Marital Status</td><td>${val(employee.marital_status)}</td></tr>
          </table>
        </div>
        <div>
          <table class="kv-table">
            <tr><td>Blood Group</td><td>${val(employee.blood_group)}</td></tr>
            <tr><td>Religion</td><td>${val(employee.religion)}</td></tr>
            <tr><td>National ID</td><td>${val(employee.national_id)}</td></tr>
            <tr><td>Passport Number</td><td>${val(employee.passport_number)}</td></tr>
          </table>
        </div>
      </div>
    </section>

    <section>
      <h2>Contact &amp; Address</h2>
      <div class="grid2">
        <div>
          <table class="kv-table">
            <tr><td>Personal Email</td><td>${val(employee.personal_email || employee.email)}</td></tr>
            <tr><td>Work Email</td><td>${val(employee.work_email)}</td></tr>
            <tr><td>Personal Phone</td><td>${val(employee.personal_phone || employee.phone)}</td></tr>
            <tr><td>Work Phone</td><td>${val(employee.work_phone)}</td></tr>
          </table>
        </div>
        <div>
          <table class="kv-table">
            <tr><td>Current Address</td><td>${val([employee.current_address_line1, employee.current_address_city, employee.current_address_emirate, employee.current_address_country].filter(Boolean).join(', ') || null)}</td></tr>
            <tr><td>Permanent Address</td><td>${val([employee.permanent_address_line1, employee.permanent_address_city, employee.permanent_address_emirate, employee.permanent_address_country].filter(Boolean).join(', ') || null)}</td></tr>
          </table>
        </div>
      </div>
    </section>

    <section>
      <h2>Job Details</h2>
      <table class="kv-table">
        <tr><td>Department</td><td>${val(employee.department?.name)}</td></tr>
        <tr><td>Designation</td><td>${val(employee.designation?.display_name)}</td></tr>
        <tr><td>Reporting Manager</td><td>${val(employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : null)}</td></tr>
        <tr><td>Work Location</td><td>${val(employee.workLocation?.name)}</td></tr>
        <tr><td>Employment Type</td><td>${val(employee.employment_type)}</td></tr>
        <tr><td>Employment Status</td><td>${val(employee.employment_status)}</td></tr>
        <tr><td>Date of Joining</td><td>${formatDate(employee.date_of_joining)}</td></tr>
      </table>
    </section>

    <section>
      <h2>Compensation Summary</h2>
      ${compensationSectionHtml}
    </section>

    <section>
      <h2>Bank Details</h2>
      <table class="kv-table">
        <tr><td>Bank Name</td><td>${val(employee.bank_name)}</td></tr>
        <tr><td>Account Number</td><td>${val(employee.bank_account_number)}</td></tr>
        <tr><td>IBAN</td><td>${val(employee.bank_iban)}</td></tr>
      </table>
    </section>

    <section>
      <h2>Emergency Contacts</h2>
      <table>
        <tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Email</th></tr>
        ${emergencyContactsHtml}
      </table>
    </section>

    <section>
      <h2>Dependents</h2>
      <table>
        <tr><th>Name</th><th>Relationship</th><th>Date of Birth</th><th>ID Number</th></tr>
        ${dependentsHtml}
      </table>
    </section>

    <section>
      <h2>Qualifications, Skills &amp; Certifications</h2>
      <div class="grid2">
        <div><strong>Qualifications</strong><ul>${qualificationsList}</ul></div>
        <div><strong>Skills</strong><ul>${skillsList}</ul></div>
        <div><strong>Certifications</strong><ul>${certificationsList}</ul></div>
      </div>
    </section>

    <section>
      <h2>Identity &amp; Compliance Documents</h2>
      <table>
        <tr><th>Document</th><th>Document Number</th><th>Issue Date</th><th>Expiry Date</th></tr>
        ${identityDocsHtml}
      </table>
    </section>

    <p class="footer-note">Generated on ${formatDate(new Date())}. This document contains recorded document numbers/dates only — attached files are not included.</p>
  </body>
  </html>`;

  return htmlToPdf(html);
}

module.exports = { generateEmployeeInfoPdf };
