/**
 * PDF Service - Converts HTML templates to PDF using Puppeteer
 */
const path = require('path');
const fs = require('fs');
const db = require('../models');
const { amountInWords } = require('../utils/numberToWords');

const DEFAULT_BANK_DETAILS = {
  beneficiary: 'Clear Earth Recycling LLC',
  bankName: 'Abu Dhabi Commercial Bank',
  branch: 'Al Riqqah Road',
  swift: 'ADCBAEAAXXX',
  accountAed: '128 8280 3820 001 [AED]',
  ibanAed: 'AE07 0030 0128 8280 3820 001 [AED]',
  accountUsd: '128 8280 3830 001 [USD]',
  ibanUsd: 'AE55 0030 0128 8280 3830 001 [USD]',
};

const CURRENCY_SYMBOLS = { AED: 'AED', USD: '$', EUR: '€', GBP: '£', SAR: 'SAR', KWD: 'KWD' };

let cachedLogoDataUri = null;
function getLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const logoPath = path.join(__dirname, '../templates/logo.png');
  const buf = fs.readFileSync(logoPath);
  cachedLogoDataUri = `data:image/png;base64,${buf.toString('base64')}`;
  return cachedLogoDataUri;
}

function getBankDetails(tenant) {
  const configured = tenant?.settings?.bankDetails;
  return { ...DEFAULT_BANK_DETAILS, ...(configured || {}) };
}

function formatMoneyWithSymbol(currency, amount) {
  const symbol = CURRENCY_SYMBOLS[String(currency).toUpperCase()] || String(currency).toUpperCase();
  return `${symbol}${formatNum(amount)}`;
}

function paymentTermsLabel(invoiceDateStr, dueDateStr) {
  if (!dueDateStr) return 'Immediate';
  const inv = new Date(`${invoiceDateStr}T00:00:00`);
  const due = new Date(`${dueDateStr}T00:00:00`);
  const days = Math.round((due - inv) / 86400000);
  if (days <= 0) return 'Immediate';
  return `Net ${days}`;
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

function isApprovedStatus(s) {
  return String(s || '').toLowerCase() === 'approved';
}

function resolvePdfAsApproved(recordApproved, options = {}, { allowOverride = true } = {}) {
  if (!allowOverride) return recordApproved;
  const variant = String(options.documentType || '').toLowerCase();
  if (variant === 'quotation' || variant === 'quote') return false;
  if (variant === 'order') return true;
  return recordApproved;
}

function getVat(tenant) {
  return tenant?.trn_number || tenant?.vat_registration_number || '-';
}

function formatDealType(dealType) {
  if (!dealType) return '-';
  const labels = {
    offer_to_charge: 'Offer to Charge',
    offer_to_purchase: 'Offer to Purchase',
    free_of_charge: 'Free of Charge',
  };
  return labels[dealType] || String(dealType).replace(/_/g, ' ');
}

function renderTemplate(templatePath, data) {
  let html = fs.readFileSync(templatePath, 'utf8');
  const keys = Object.keys(data).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const placeholder = `{{${key}}}`;
    const val = String(data[key] ?? '');
    html = html.split(placeholder).join(val);
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
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } });
    return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

async function generateQuotationPdf(quotationId, tenantId, options = {}) {
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
          {
            model: db.TermsAndConditions,
            as: 'termsList',
            through: { attributes: ['sort_order'] },
            attributes: ['id', 'title', 'content'],
            required: false,
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
  const isFoc = quotation.deal?.deal_type === 'free_of_charge';
  const vatPct = isFoc ? 0 : (parseFloat(quotation.deal?.vat_percentage) || 5) / 100;
  const currency = quotation.currency || 'AED';
  const dealType = formatDealType(quotation.deal?.deal_type);

  let itemsHtml = '';
  let subtotal = 0;
  let totalVat = 0;

  if (items.length > 0) {
    items.forEach((item, i) => {
      const qty = parseFloat(item.quantity) || 0;
      const unitPrice = isFoc ? 0 : (parseFloat(item.unit_price) || 0);
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
    const amount = isFoc ? 0 : (parseFloat(quotation.quotation_amount) || 0);
    const tax = amount * vatPct;
    const total = amount + tax;
    subtotal = amount;
    totalVat = tax;
    itemsHtml = `<tr>
      <td>1</td>
      <td>${(quotation.deal?.title || 'Service').replace(/</g, '&lt;')}</td>
      <td class="text-right">${formatNum(amount)}</td>
      <td class="text-right">1</td>
      <td class="text-right">${formatNum(amount)}</td>
      <td class="text-right">${formatNum(tax)} @${(vatPct * 100).toFixed(1)}%</td>
      <td class="text-right">${formatNum(total)}</td>
    </tr>`;
  }

  const totalAmount = formatNum(subtotal + totalVat);
  const approved = resolvePdfAsApproved(isApprovedStatus(quotation.status), options);
  const quoteNumber = approved ? `SO/SERV/${quotation.id}/1` : `QT/SERV/${quotation.id}/1`;
  const quoteDate = formatDate(quotation.quotation_date);
  const documentTitle = approved ? 'Service Order' : 'Service Quotation';
  const docMetaLine = approved
    ? `Order Number : ${quoteNumber} , Order Date : ${quoteDate} , Deal Type : ${dealType}`
    : `Quote Number : ${quoteNumber} , Quote Date : ${quoteDate} , Deal Type : ${dealType}`;
  const fromAddr = [tenant.address, tenant.city].filter(Boolean).join(', ') || '-';
  const toAddr = company ? [company.address, company.city].filter(Boolean).join(', ') || '-' : '-';

  const termsList = quotation.deal?.termsList || [];
  const termsHtml = termsList.length > 0
    ? termsList
        .sort((a, b) => (a.DealTerm?.sort_order ?? 0) - (b.DealTerm?.sort_order ?? 0))
        .map(t => `<p><strong>${(t.title || '').replace(/</g, '&lt;')}</strong><br>${(t.content || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
        .join('')
    : '<p>Payment terms: Immediate</p>';

  const html = renderTemplate(path.join(__dirname, '../templates/quotation.html'), {
    documentTitle,
    docMetaLine,
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
    dealType,
    termsHtml,
  });

  return htmlToPdf(html);
}

async function generatePurchaseOrderPdf(poId, tenantId, options = {}) {
  const po = await db.PurchaseOrder.findOne({
    where: { id: poId, tenant_id: tenantId },
    include: [
      { model: db.Company, as: 'company', required: false },
      { model: db.Supplier, as: 'supplier', required: false },
      {
        model: db.Deal,
        as: 'deal',
        attributes: ['id', 'is_rcm_applicable', 'vat_percentage', 'deal_type'],
        required: false,
        include: [
          {
            model: db.TermsAndConditions,
            as: 'termsList',
            through: { attributes: ['sort_order'] },
            attributes: ['id', 'title', 'content'],
            required: false,
          },
        ],
      },
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

  const party = po.company || po.supplier;
  const isFoc = po.deal?.deal_type === 'free_of_charge';
  const isRcm = !isFoc && (po.deal?.is_rcm_applicable || false);
  const vatPct = isFoc ? 0 : (isRcm ? 0 : (parseFloat(po.deal?.vat_percentage) || 5) / 100);
  const currency = 'AED';
  const dealType = formatDealType(po.deal?.deal_type);

  let itemsHtml = '';
  let subtotal = 0;
  let totalVat = 0;

  for (const [i, item] of (po.items || []).entries()) {
    const qty = parseFloat(item.quantity) || 0;
    const price = isFoc ? 0 : (parseFloat(item.price) || 0);
    const amount = qty * price;
    const vat = isRcm ? 0 : amount * vatPct;
    const total = amount + vat;
    subtotal += amount;
    totalVat += vat;
    const vatCell = isRcm
      ? `<td class="text-right">RCM</td>`
      : `<td class="text-right">${formatNum(vat)} @${(vatPct * 100).toFixed(1)}%</td>`;
    itemsHtml += `<tr>
      <td>${i + 1}</td>
      <td>${(item.productService?.name || item.item_description || '-').replace(/</g, '&lt;')}</td>
      <td class="text-right">${formatNum(price)}</td>
      <td class="text-right">${formatNum(qty)} Pcs</td>
      <td class="text-right">${formatNum(amount)}</td>
      ${vatCell}
      <td class="text-right">${formatNum(total)}</td>
    </tr>`;
  }

  const grandTotal = subtotal + totalVat;

  const termsList = po.deal?.termsList || [];
  const termsHtml = termsList.length > 0
    ? termsList
        .sort((a, b) => (a.DealTerm?.sort_order ?? 0) - (b.DealTerm?.sort_order ?? 0))
        .map(t => `<p><strong>${(t.title || '').replace(/</g, '&lt;')}</strong><br>${(t.content || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
        .join('')
    : '<p>Payment terms: Immediate</p>';

  const isBill = String(po.document_type).toLowerCase() === 'bill';
  const approved = resolvePdfAsApproved(isApprovedStatus(po.status), options, { allowOverride: !isBill });
  const y = new Date().getFullYear();
  const poNumber = isBill
    ? `PB/CE/${y}/${po.id}`
    : (approved ? `PO/CE/${y}/${po.id}` : `PQT/CE/${y}/${po.id}`);
  const poDate = formatDate(po.po_date);
  const documentTitle = isBill ? 'Purchase Bill' : (approved ? 'Purchase Order' : 'Purchase Quotation');
  const docRefLabel = isBill ? 'Bill' : (approved ? 'PO' : 'Quotation');
  const fromAddr = [tenant.address, tenant.city].filter(Boolean).join(', ') || '-';
  const toAddr = party ? [party.address, party.city].filter(Boolean).join(', ') || '-' : '-';

  const html = renderTemplate(path.join(__dirname, '../templates/purchase-order.html'), {
    documentTitle,
    docRefLabel,
    poNumber,
    poDate,
    dealType,
    fromCompany: tenant.company_name || 'Clear Earth Recycling LLC',
    fromEmail: tenant.email || '-',
    fromPhone: tenant.phone || '-',
    fromAddress: fromAddr,
    fromVat: getVat(tenant),
    toCompany: party?.company_name || '-',
    toEmail: party?.email || '-',
    toPhone: party?.phone || '-',
    toAddress: toAddr,
    toVat: party?.vat_number || '-',
    itemsHtml,
    currency,
    subtotal: formatNum(subtotal),
    totalVat: isRcm ? 'RCM (Reverse Charge — paid to Govt.)' : formatNum(totalVat),
    grandTotal: formatNum(grandTotal),
    rcmNote: isRcm ? 'Note: VAT is applicable under Reverse Charge Mechanism. The recipient is liable to pay VAT directly to the government.' : '',
    termsHtml,
  });

  return htmlToPdf(html);
}

async function generateTaxInvoicePdf(taxInvoiceId, tenantId) {
  const invoice = await db.TaxInvoice.findOne({
    where: { id: taxInvoiceId, tenant_id: tenantId },
    include: [
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoice',
        include: [
          {
            model: db.Deal,
            as: 'deal',
            include: [{ model: db.Company, as: 'company' }],
          },
        ],
      },
      {
        model: db.TaxInvoiceItem,
        as: 'items',
        separate: true,
        order: [['sort_order', 'ASC'], ['id', 'ASC']],
        include: [{ model: db.ProductService, as: 'productService' }],
      },
    ],
  });
  if (!invoice) return null;

  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) return null;

  const company = invoice.proformaInvoice?.deal?.company;
  const dealTitle = invoice.proformaInvoice?.deal?.title;
  const items = invoice.items || [];
  const currency = invoice.currency || 'AED';
  const vatPct = parseFloat(invoice.vat_percentage) || 0;
  const showTax = vatPct > 0.005;

  let subtotal = 0;
  let totalTax = 0;
  let totalQty = 0;
  let rowsHtml = '';

  items.forEach((item, i) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.unit_price) || 0;
    const taxable = qty * rate;
    const tax = showTax ? (taxable * vatPct) / 100 : 0;
    const amount = taxable + tax;
    subtotal += taxable;
    totalTax += tax;
    totalQty += qty;
    const desc = (item.description || item.productService?.name || '-').replace(/</g, '&lt;');
    rowsHtml += `<tr>
      <td>${i + 1}</td>
      <td>${desc}</td>
      <td class="text-right">${formatNum(qty)}</td>
      <td class="text-right">${formatNum(rate)}</td>
      <td class="text-right">${formatNum(taxable)}</td>
      ${showTax ? `<td class="text-right">${formatNum(tax)}<br>${vatPct.toFixed(2)}%</td>` : ''}
      <td class="text-right">${formatNum(amount)}</td>
    </tr>`;
  });

  const total = subtotal + totalTax;

  const headerCols = showTax
    ? '<th style="width:5%">#</th><th style="width:32%">Item &amp; Description</th><th style="width:10%">Qty</th><th style="width:12%">Rate</th><th style="width:15%">Taxable Amount</th><th style="width:11%">Tax</th><th style="width:15%">Amount</th>'
    : '<th style="width:5%">#</th><th style="width:37%">Item &amp; Description</th><th style="width:11%">Qty</th><th style="width:13%">Rate</th><th style="width:17%">Taxable Amount</th><th style="width:17%">Amount</th>';

  const subtotalRow = showTax
    ? `<tr class="subtotal-row"><td colspan="4">Sub Total</td><td class="text-right">${formatNum(subtotal)}</td><td class="text-right">${formatNum(totalTax)}</td><td class="text-right">${formatNum(total)}</td></tr>`
    : `<tr class="subtotal-row"><td colspan="4">Sub Total</td><td class="text-right">${formatNum(subtotal)}</td><td class="text-right">${formatNum(total)}</td></tr>`;

  const itemsTableHtml = `<table class="items-table">
<thead><tr>${headerCols}</tr></thead>
<tbody>${rowsHtml}${subtotalRow}</tbody>
</table>`;

  const projectLineHtml = dealTitle ? `<div class="project-line">${dealTitle.replace(/</g, '&lt;')}</div>` : '';

  const fromAddr = tenant.address || '-';
  const fromCity = [tenant.city, tenant.country].filter(Boolean).join(', ') || '-';
  const toAddr = company?.address || '-';
  const toCity = [company?.city, company?.country].filter(Boolean).join(', ') || '-';

  const bank = getBankDetails(tenant);

  const html = renderTemplate(path.join(__dirname, '../templates/tax-invoice.html'), {
    logoDataUri: getLogoDataUri(),
    fromCompany: tenant.company_name || 'Clear Earth Recycling LLC',
    fromAddress: fromAddr,
    fromCity,
    fromPhone: tenant.phone || '-',
    fromEmail: tenant.email || '-',
    fromVat: getVat(tenant),
    invoiceNumber: invoice.tax_invoice_number,
    toCompany: company?.company_name || '-',
    toAddress: toAddr,
    toCity,
    toVat: company?.vat_number || '-',
    invoiceDate: formatDate(invoice.invoice_date),
    paymentTerms: paymentTermsLabel(invoice.invoice_date, invoice.due_date),
    dueDate: invoice.due_date ? formatDate(invoice.due_date) : '-',
    refNo: invoice.reference_no || invoice.proformaInvoice?.deal?.deal_number || '-',
    projectLineHtml,
    itemsTableHtml,
    itemsInTotalLabel: `Items in Total ${formatNum(totalQty)}`,
    totalDisplay: formatMoneyWithSymbol(currency, total),
    amountInWords: amountInWords(total, currency),
    bankBeneficiary: bank.beneficiary,
    bankName: bank.bankName,
    bankBranch: bank.branch,
    bankSwift: bank.swift,
    bankAccountAed: bank.accountAed,
    bankIbanAed: bank.ibanAed,
    bankAccountUsd: bank.accountUsd,
    bankIbanUsd: bank.ibanUsd,
  });

  return htmlToPdf(html);
}

async function generateReceivableReceiptPdf(paymentTransactionId, tenantId) {
  const payment = await db.PaymentTransaction.findOne({
    where: { id: paymentTransactionId, tenant_id: tenantId, source_type: 'receivable' },
  });
  if (!payment) return null;

  const invoice = await db.TaxInvoice.findOne({
    where: { id: payment.source_id, tenant_id: tenantId },
    include: [
      {
        model: db.ProformaInvoice,
        as: 'proformaInvoice',
        include: [
          { model: db.Deal, as: 'deal', include: [{ model: db.Company, as: 'company' }] },
        ],
      },
    ],
  });
  if (!invoice) return null;

  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) return null;

  const company = invoice.proformaInvoice?.deal?.company;
  const currency = invoice.currency || 'AED';
  const amount = parseFloat(payment.amount) || 0;

  const fromAddr = tenant.address || '-';
  const fromCity = [tenant.city, tenant.country].filter(Boolean).join(', ') || '-';
  const receivedFromAddr = company?.address || '-';
  const receivedFromCity = [company?.city, company?.country].filter(Boolean).join(', ') || '-';

  const html = renderTemplate(path.join(__dirname, '../templates/ar-receipt.html'), {
    logoDataUri: getLogoDataUri(),
    fromCompany: tenant.company_name || 'Clear Earth Recycling LLC',
    fromAddress: fromAddr,
    fromCity,
    fromVat: getVat(tenant),
    fromEmail: tenant.email || '-',
    receiptNumber: payment.receipt_number || String(payment.id).padStart(7, '0'),
    receiptDate: formatDate(payment.paid_at),
    refNo: invoice.tax_invoice_number,
    amountDisplay: formatMoneyWithSymbol(currency, amount),
    amountInWords: amountInWords(amount, currency),
    receivedFromName: payment.received_from || company?.company_name || '-',
    receivedFromAddress: receivedFromAddr,
    receivedFromCity,
    invoiceNumber: invoice.tax_invoice_number,
    invoiceDate: formatDate(invoice.invoice_date),
    invoiceAmountDisplay: formatMoneyWithSymbol(currency, parseFloat(invoice.total) || 0),
  });

  return htmlToPdf(html);
}

async function generateStatementOfAccountPdf(tenantId, companyId, options = {}) {
  const receivablesService = require('./receivables.service');
  const statement = await receivablesService.getStatementOfAccount(tenantId, companyId, options);
  if (!statement) return null;

  const tenant = await db.Tenant.findByPk(tenantId);
  if (!tenant) return null;

  const { company, currency, openingBalance, transactions, balanceDue, aging, dateFrom, dateTo } = statement;

  let rowsHtml = '';
  if (Math.abs(openingBalance) > 0.005 || transactions.length === 0) {
    rowsHtml += `<tr class="opening-row"><td>${formatDate(dateFrom)}</td><td colspan="4">***Opening Balance***</td><td class="text-right">${formatNum(openingBalance)}</td></tr>`;
  }
  transactions.forEach((t) => {
    const details = String(t.details || '').replace(/</g, '&lt;').replace(/\n/g, '<br>')
      + (t.dueDate ? ` - due on ${formatDate(t.dueDate)}` : '');
    rowsHtml += `<tr>
      <td>${formatDate(t.date)}</td>
      <td>${t.docType}</td>
      <td>${details}</td>
      <td class="text-right">${t.amount ? formatNum(t.amount) : ''}</td>
      <td class="text-right">${t.receipts ? formatNum(t.receipts) : ''}</td>
      <td class="text-right">${formatNum(t.balance)}</td>
    </tr>`;
  });

  const fromAddr = tenant.address || '-';
  const fromCity = [tenant.city, tenant.country].filter(Boolean).join(', ') || '-';
  const toAddr = company.address || '-';
  const toCity = [company.city, company.country].filter(Boolean).join(', ') || '-';

  const html = renderTemplate(path.join(__dirname, '../templates/statement-of-account.html'), {
    logoDataUri: getLogoDataUri(),
    fromCompany: tenant.company_name || 'Clear Earth Recycling LLC',
    fromAddress: fromAddr,
    fromCity,
    fromVat: getVat(tenant),
    fromEmail: tenant.email || '-',
    toCompany: company.company_name || '-',
    toAddress: toAddr,
    toCity,
    toVat: company.vat_number || '-',
    dateFrom: formatDate(dateFrom),
    dateTo: formatDate(dateTo),
    transactionRowsHtml: rowsHtml,
    balanceDueDisplay: formatMoneyWithSymbol(currency, balanceDue),
    agingCurrent: formatNum(aging.current),
    aging1_30: formatNum(aging.bucket_1_30),
    aging31_60: formatNum(aging.bucket_31_60),
    aging61_90: formatNum(aging.bucket_61_90),
    agingOver90: formatNum(aging.bucket_over_90),
    agingTotal: formatNum(aging.current + aging.bucket_1_30 + aging.bucket_31_60 + aging.bucket_61_90 + aging.bucket_over_90),
  });

  return htmlToPdf(html);
}

module.exports = {
  generateQuotationPdf,
  generatePurchaseOrderPdf,
  generateTaxInvoicePdf,
  generateReceivableReceiptPdf,
  generateStatementOfAccountPdf,
};
