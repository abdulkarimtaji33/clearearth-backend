const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateInvoiceNumber, calculateVAT } = require('../utils/helpers');
const { Op } = db.Sequelize;
const { INVOICE_STATUS, INVOICE_TYPE, VAT_TYPE } = require('../constants');

const getAll = async (tenantId, filters) => {
  const { offset, limit, search, status, invoiceType, clientId, startDate, endDate } = filters;
  const where = { tenant_id: tenantId };

  if (search) where.invoice_number = { [Op.like]: `%${search}%` };
  if (status) where.status = status;
  if (invoiceType) where.invoice_type = invoiceType;
  if (clientId) where.client_id = clientId;
  if (startDate && endDate) {
    where.invoice_date = { [Op.between]: [startDate, endDate] };
  }

  const { count, rows } = await db.Invoice.findAndCountAll({
    where,
    include: [
      { model: db.Client, as: 'client', attributes: ['id', 'company_name', 'email'] },
      { model: db.Deal, as: 'deal', attributes: ['id', 'deal_number', 'title'] },
      { model: db.InvoiceLine, as: 'lines' },
    ],
    offset,
    limit,
    order: [['invoice_date', 'DESC']],
  });

  return { invoices: rows, total: count };
};

const getById = async (tenantId, invoiceId) => {
  const invoice = await db.Invoice.findOne({
    where: { id: invoiceId, tenant_id: tenantId },
    include: [
      { model: db.Client, as: 'client' },
      { model: db.Vendor, as: 'vendor' },
      { model: db.Deal, as: 'deal' },
      { model: db.Lot, as: 'lot' },
      {
        model: db.InvoiceLine,
        as: 'lines',
        include: [
          { model: db.Product, as: 'product' },
          { model: db.Service, as: 'service' },
        ],
      },
      { model: db.Payment, as: 'payments' },
    ],
  });

  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
};

const create = async (tenantId, userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    // Get next sequence number for invoice
    const lastInvoice = await db.Invoice.findOne({
      where: { tenant_id: tenantId },
      order: [['created_at', 'DESC']],
      transaction,
    });

    const sequence = lastInvoice ? parseInt(lastInvoice.invoice_number.split('-').pop()) + 1 : 1;
    const invoiceNumber = generateInvoiceNumber(tenantId, new Date().getFullYear(), sequence);

    // Calculate totals from lines
    let subtotal = 0;
    const lines = data.lines || [];

    for (const line of lines) {
      const lineSubtotal = parseFloat(line.quantity) * parseFloat(line.unitPrice);
      subtotal += lineSubtotal;
    }

    // Calculate VAT
    let vatAmount = 0;
    const vatType = data.vatType || VAT_TYPE.STANDARD;
    const vatRate = data.vatRate !== undefined ? data.vatRate : 5;

    if (vatType === VAT_TYPE.STANDARD) {
      vatAmount = calculateVAT(subtotal, vatRate / 100);
    } else if (vatType === VAT_TYPE.ZERO_RATED) {
      vatAmount = 0;
      if (!data.customsExitCertificate) {
        throw ApiError.badRequest('Customs exit certificate required for zero-rated export');
      }
    }

    const totalAmount = subtotal + vatAmount;

    // Create invoice
    const invoice = await db.Invoice.create(
      {
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        invoice_type: data.invoiceType || INVOICE_TYPE.TAX_INVOICE,
        client_id: data.clientId,
        vendor_id: data.vendorId,
        deal_id: data.dealId,
        lot_id: data.lotId,
        invoice_date: data.invoiceDate || new Date(),
        due_date: data.dueDate,
        reference_number: data.referenceNumber,
        currency: data.currency || 'AED',
        exchange_rate: data.exchangeRate || 1,
        subtotal,
        vat_type: vatType,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        balance_amount: totalAmount,
        customs_exit_certificate: data.customsExitCertificate,
        reverse_charge_notes: data.reverseChargeNotes,
        payment_terms: data.paymentTerms,
        notes: data.notes,
        status: INVOICE_STATUS.DRAFT,
        created_by: userId,
      },
      { transaction }
    );

    // Create invoice lines
    for (const line of lines) {
      const lineSubtotal = parseFloat(line.quantity) * parseFloat(line.unitPrice);
      const lineTaxRate = line.taxRate !== undefined ? line.taxRate : vatRate;
      const lineTaxAmount = vatType === VAT_TYPE.STANDARD ? calculateVAT(lineSubtotal, lineTaxRate / 100) : 0;

      await db.InvoiceLine.create(
        {
          tenant_id: tenantId,
          invoice_id: invoice.id,
          product_id: line.productId,
          service_id: line.serviceId,
          description: line.description,
          quantity: line.quantity,
          unit_of_measure: line.unitOfMeasure,
          unit_price: line.unitPrice,
          subtotal: lineSubtotal,
          tax_rate: lineTaxRate,
          tax_amount: lineTaxAmount,
          total_amount: lineSubtotal + lineTaxAmount,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return await getById(tenantId, invoice.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const update = async (tenantId, invoiceId, data) => {
  const invoice = await db.Invoice.findOne({ where: { id: invoiceId, tenant_id: tenantId } });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  if (invoice.status !== INVOICE_STATUS.DRAFT) {
    throw ApiError.badRequest('Only draft invoices can be updated');
  }

  await invoice.update({
    invoice_date: data.invoiceDate || invoice.invoice_date,
    due_date: data.dueDate || invoice.due_date,
    reference_number: data.referenceNumber || invoice.reference_number,
    payment_terms: data.paymentTerms || invoice.payment_terms,
    notes: data.notes || invoice.notes,
  });

  return await getById(tenantId, invoiceId);
};

const approve = async (tenantId, invoiceId, userId) => {
  const invoice = await db.Invoice.findOne({ where: { id: invoiceId, tenant_id: tenantId } });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  if (invoice.status !== INVOICE_STATUS.DRAFT && invoice.status !== INVOICE_STATUS.PENDING) {
    throw ApiError.badRequest('Only draft or pending invoices can be approved');
  }

  await invoice.update({
    status: INVOICE_STATUS.APPROVED,
    approved_by: userId,
    approved_at: new Date(),
  });

  // TODO: Create journal entry for invoice

  return await getById(tenantId, invoiceId);
};

const recordPayment = async (tenantId, invoiceId, userId, paymentData) => {
  const transaction = await db.sequelize.transaction();

  try {
    const invoice = await db.Invoice.findOne({
      where: { id: invoiceId, tenant_id: tenantId },
      transaction,
    });

    if (!invoice) throw ApiError.notFound('Invoice not found');

    const paymentAmount = parseFloat(paymentData.amount);

    if (paymentAmount > parseFloat(invoice.balance_amount)) {
      throw ApiError.badRequest('Payment amount exceeds invoice balance');
    }

    // Create payment record
    const paymentNumber = generateInvoiceNumber(tenantId, new Date().getFullYear(), Date.now());
    const payment = await db.Payment.create(
      {
        tenant_id: tenantId,
        payment_number: paymentNumber,
        payment_date: paymentData.paymentDate || new Date(),
        payment_type: 'receipt',
        payment_method: paymentData.paymentMethod,
        invoice_id: invoiceId,
        client_id: invoice.client_id,
        amount: paymentAmount,
        currency: paymentData.currency || invoice.currency,
        reference_number: paymentData.referenceNumber,
        bank_account: paymentData.bankAccount,
        notes: paymentData.notes,
        status: 'completed',
        received_by: userId,
      },
      { transaction }
    );

    // Handle cheque if payment method is cheque
    if (paymentData.paymentMethod === 'cheque') {
      await db.Cheque.create(
        {
          tenant_id: tenantId,
          payment_id: payment.id,
          cheque_number: paymentData.chequeNumber,
          bank_name: paymentData.bankName,
          cheque_date: paymentData.chequeDate,
          maturity_date: paymentData.maturityDate || paymentData.chequeDate,
          amount: paymentAmount,
          status: 'issued',
        },
        { transaction }
      );
    }

    // Update invoice
    const newPaidAmount = parseFloat(invoice.paid_amount || 0) + paymentAmount;
    const newBalanceAmount = parseFloat(invoice.total_amount) - newPaidAmount;

    let newStatus = invoice.status;
    if (newBalanceAmount === 0) {
      newStatus = INVOICE_STATUS.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = INVOICE_STATUS.PARTIALLY_PAID;
    }

    await invoice.update(
      {
        paid_amount: newPaidAmount,
        balance_amount: newBalanceAmount,
        status: newStatus,
      },
      { transaction }
    );

    await transaction.commit();
    return payment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancel = async (tenantId, invoiceId, userId) => {
  const invoice = await db.Invoice.findOne({ where: { id: invoiceId, tenant_id: tenantId } });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  if (invoice.status === INVOICE_STATUS.PAID) {
    throw ApiError.badRequest('Cannot cancel paid invoice. Create credit note instead.');
  }

  await invoice.update({
    status: INVOICE_STATUS.CANCELLED,
  });

  return await getById(tenantId, invoiceId);
};

const remove = async (tenantId, invoiceId) => {
  const invoice = await db.Invoice.findOne({ where: { id: invoiceId, tenant_id: tenantId } });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  if (invoice.status !== INVOICE_STATUS.DRAFT) {
    throw ApiError.badRequest('Only draft invoices can be deleted');
  }

  await invoice.destroy();
};

const getInvoiceStatistics = async (tenantId, filters) => {
  const where = { tenant_id: tenantId };
  if (filters.startDate && filters.endDate) {
    where.invoice_date = { [Op.between]: [filters.startDate, filters.endDate] };
  }

  const [totalInvoices, totalAmount, paidAmount, pendingAmount] = await Promise.all([
    db.Invoice.count({ where }),
    db.Invoice.sum('total_amount', { where }),
    db.Invoice.sum('paid_amount', { where }),
    db.Invoice.sum('balance_amount', { where: { ...where, status: { [Op.notIn]: [INVOICE_STATUS.PAID, INVOICE_STATUS.CANCELLED] } } }),
  ]);

  return {
    totalInvoices: totalInvoices || 0,
    totalAmount: totalAmount || 0,
    paidAmount: paidAmount || 0,
    pendingAmount: pendingAmount || 0,
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  approve,
  recordPayment,
  cancel,
  remove,
  getInvoiceStatistics,
};
