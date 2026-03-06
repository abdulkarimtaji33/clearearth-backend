/**
 * PDF Service - Converts HTML templates to PDF using Puppeteer
 */
const path = require('path');
const fs = require('fs');
const db = require('../models');

function getLogoImg() {
  const logoPath = path.join(__dirname, '../templates/logo.png');
  try {
    const buf = fs.readFileSync(logoPath);
    const base64 = buf.toString('base64');
    return `<img src="data:image/png;base64,${base64}" class="logo" alt="Logo" />`;
  } catch {
    return '<img src="" class="logo" alt="Logo" />';
  }
}

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatNum(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getVat(tenant) {
  return tenant?.trn_number || tenant?.vat_registration_number || '-';
}

function renderTemplate(templatePath, data) {
  let html = fs.readFileSync(templatePath, 'utf8');
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  }
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
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

async function generateQuotationPdf(quotationId, tenantId) {
  const quotation = await db.Quotation.findOne({
    where: { id: quotationId, tenant_id: tenantId },
    include: [
      {
        model: db.Deal,
        as: 'deal',
        include: [
          { model: db.Company, as: 'company' },
          {
            model: db.DealItem,
            as: 'items',
            include: [{ model: db.ProductService, as: 'productService' }],
            order: [['id', 'ASC']],
          },
        ],
      },
    ],
  });
  if (!quotation) return null;

  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) return null;

  const company = quotation.deal?.company;
  const items = quotation.deal?.items || [];
  const vatPct = (parseFloat(quotation.deal?.vat_percentage) || 5) / 100;
  const currency = quotation.currency || 'AED';

  let itemsHtml = '';
  let subtotal = 0;
  let totalVat = 0;

  if (items.length > 0) {
    items.forEach((item, i) => {
      const qty = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const amount = qty * unitPrice;
      const tax = amount * vatPct;
      const total = amount + tax;
      subtotal += amount;
      totalVat += tax;
      itemsHtml += `<tr>
        <td>${i + 1}</td>
        <td>${(item.productService?.name || item.notes || '-').replace(/</g, '&lt;')}</td>
        <td class="text-right">${formatNum(unitPrice)}</td>
        <td class="text-right">${formatNum(qty)}</td>
        <td class="text-right">${formatNum(amount)}</td>
        <td class="text-right">${formatNum(tax)} @${(vatPct * 100).toFixed(1)}%</td>
        <td class="text-right">${formatNum(total)}</td>
      </tr>`;
    });
  } else {
    const amount = parseFloat(quotation.quotation_amount) || 0;
    const tax = amount * 0.05;
    const total = amount + tax;
    subtotal = amount;
    totalVat = tax;
    itemsHtml = `<tr>
      <td>1</td>
      <td>${(quotation.deal?.title || 'Service').replace(/</g, '&lt;')}</td>
      <td class="text-right">${formatNum(amount)}</td>
      <td class="text-right">1</td>
      <td class="text-right">${formatNum(amount)}</td>
      <td class="text-right">${formatNum(tax)} @5.0%</td>
      <td class="text-right">${formatNum(total)}</td>
    </tr>`;
  }

  const totalAmount = formatNum(subtotal + totalVat);
  const quoteNumber = `QT/SERV/${quotation.id}/1`;
  const quoteDate = formatDate(quotation.quotation_date);
  const fromAddr = [tenant.address, tenant.city].filter(Boolean).join(', ') || '-';
  const toAddr = company ? [company.address, company.city].filter(Boolean).join(', ') || '-' : '-';

  const html = renderTemplate(path.join(__dirname, '../templates/quotation.html'), {
    logoImg: getLogoImg(),
    quoteNumber,
    quoteDate,
    fromCompany: tenant.company_name || 'Clear Earth Recycling LLC',
    fromEmail: tenant.email || '-',
    fromPhone: tenant.phone || '-',
    fromAddress: fromAddr,
    fromVat: getVat(tenant),
    toCompany: company?.company_name || '-',
    toEmail: company?.email || '-',
    toPhone: company?.phone || '-',
    toAddress: toAddr,
    toVat: company?.vat_number || '-',
    itemsHtml,
    currency,
    totalAmount,
  });

  return htmlToPdf(html);
}

async function generatePurchaseOrderPdf(poId, tenantId) {
  const po = await db.PurchaseOrder.findOne({
    where: { id: poId, tenant_id: tenantId },
    include: [
      { model: db.Supplier, as: 'supplier' },
      {
        model: db.PurchaseOrderItem,
        as: 'items',
        include: [{ model: db.ProductService, as: 'productService' }],
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
      },
    ],
  });
  if (!po) return null;

  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) return null;

  const supplier = po.supplier;
  const vatPct = 0.05;
  const currency = 'AED';

  let itemsHtml = '';
  let subtotal = 0;
  let totalVat = 0;

  for (const [i, item] of (po.items || []).entries()) {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    const amount = qty * price;
    const vat = amount * vatPct;
    const total = amount + vat;
    subtotal += amount;
    totalVat += vat;
    itemsHtml += `<tr>
      <td>${i + 1}</td>
      <td>${(item.productService?.name || item.item_description || '-').replace(/</g, '&lt;')}</td>
      <td class="text-right">${formatNum(price)}</td>
      <td class="text-right">${formatNum(qty)} Pcs</td>
      <td class="text-right">${formatNum(amount)}</td>
      <td class="text-right">${formatNum(vat)} @5.0%</td>
      <td class="text-right">${formatNum(total)}</td>
    </tr>`;
  }

  const grandTotal = subtotal + totalVat;
  const poNumber = `PO/CE/${new Date().getFullYear()}/${po.id}`;
  const poDate = formatDate(po.po_date);
  const fromAddr = [tenant.address, tenant.city].filter(Boolean).join(', ') || '-';
  const toAddr = supplier ? [supplier.address, supplier.city].filter(Boolean).join(', ') || '-' : '-';

  const html = renderTemplate(path.join(__dirname, '../templates/purchase-order.html'), {
    logoImg: getLogoImg(),
    poNumber,
    poDate,
    fromCompany: tenant.company_name || 'Clear Earth Recycling LLC',
    fromEmail: tenant.email || '-',
    fromPhone: tenant.phone || '-',
    fromAddress: fromAddr,
    fromVat: getVat(tenant),
    toCompany: supplier?.company_name || '-',
    toEmail: supplier?.email || '-',
    toPhone: supplier?.phone || '-',
    toAddress: toAddr,
    toVat: supplier?.vat_number || '-',
    itemsHtml,
    currency,
    subtotal: formatNum(subtotal),
    totalVat: formatNum(totalVat),
    grandTotal: formatNum(grandTotal),
  });

  return htmlToPdf(html);
}

module.exports = { generateQuotationPdf, generatePurchaseOrderPdf };
