const db = require('../models');
const ApiError = require('../utils/apiError');
const { generateReferenceNumber } = require('../utils/helpers');
const { Op } = db.Sequelize;

const getAllJournalEntries = async (tenantId, filters) => {
  const { offset, limit, startDate, endDate } = filters;
  const where = { tenant_id: tenantId };

  if (startDate && endDate) {
    where.entry_date = { [Op.between]: [startDate, endDate] };
  }

  const { count, rows } = await db.JournalEntry.findAndCountAll({
    where,
    include: [
      { model: db.User, as: 'creator', attributes: ['id', 'first_name', 'last_name'] },
      { model: db.JournalEntryLine, as: 'lines' },
    ],
    offset,
    limit,
    order: [['entry_date', 'DESC']],
  });

  return { entries: rows, total: count };
};

const getJournalEntryById = async (tenantId, entryId) => {
  const entry = await db.JournalEntry.findOne({
    where: { id: entryId, tenant_id: tenantId },
    include: [
      { model: db.User, as: 'creator' },
      { model: db.JournalEntryLine, as: 'lines' },
    ],
  });

  if (!entry) throw ApiError.notFound('Journal entry not found');
  return entry;
};

const createJournalEntry = async (tenantId, userId, data) => {
  const transaction = await db.sequelize.transaction();

  try {
    const entryNumber = generateReferenceNumber('JE');

    // Validate debits and credits balance
    let totalDebit = 0;
    let totalCredit = 0;

    data.lines.forEach(line => {
      totalDebit += parseFloat(line.debit || 0);
      totalCredit += parseFloat(line.credit || 0);
    });

    if (totalDebit.toFixed(2) !== totalCredit.toFixed(2)) {
      throw ApiError.badRequest('Debits and credits must balance');
    }

    const entry = await db.JournalEntry.create(
      {
        tenant_id: tenantId,
        entry_number: entryNumber,
        entry_date: data.entryDate || new Date(),
        reference_number: data.referenceNumber,
        description: data.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        is_auto_generated: false,
        created_by: userId,
      },
      { transaction }
    );

    // Create journal entry lines
    for (const line of data.lines) {
      await db.JournalEntryLine.create(
        {
          tenant_id: tenantId,
          journal_entry_id: entry.id,
          account_code: line.accountCode,
          account_name: line.accountName,
          description: line.description,
          debit: line.debit || 0,
          credit: line.credit || 0,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return await getJournalEntryById(tenantId, entry.id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getAllExpenses = async (tenantId, filters) => {
  const { offset, limit, categoryId, startDate, endDate } = filters;
  const where = { tenant_id: tenantId };

  if (categoryId) where.category_id = categoryId;
  if (startDate && endDate) {
    where.expense_date = { [Op.between]: [startDate, endDate] };
  }

  const { count, rows } = await db.Expense.findAndCountAll({
    where,
    include: [
      { model: db.ExpenseCategory, as: 'category' },
      { model: db.User, as: 'submitter' },
    ],
    offset,
    limit,
    order: [['expense_date', 'DESC']],
  });

  return { expenses: rows, total: count };
};

const createExpense = async (tenantId, userId, data) => {
  const expenseNumber = generateReferenceNumber('EXP');

  const expense = await db.Expense.create({
    tenant_id: tenantId,
    expense_number: expenseNumber,
    category_id: data.categoryId,
    expense_date: data.expenseDate || new Date(),
    description: data.description,
    amount: data.amount,
    currency: data.currency || 'AED',
    payment_method: data.paymentMethod,
    vendor_id: data.vendorId,
    invoice_number: data.invoiceNumber,
    is_deductible: data.isDeductible !== false,
    deductible_percentage: data.deductiblePercentage || 100,
    submitted_by: userId,
    status: 'pending',
    notes: data.notes,
  });

  return expense;
};

const approveExpense = async (tenantId, expenseId, userId) => {
  const expense = await db.Expense.findOne({
    where: { id: expenseId, tenant_id: tenantId },
  });

  if (!expense) throw ApiError.notFound('Expense not found');

  await expense.update({
    status: 'approved',
    approved_by: userId,
    approved_at: new Date(),
  });

  // TODO: Create journal entry for expense

  return expense;
};

const getAllFixedAssets = async tenantId => {
  return await db.FixedAsset.findAll({
    where: { tenant_id: tenantId },
    order: [['acquisition_date', 'DESC']],
  });
};

const createFixedAsset = async (tenantId, data) => {
  const assetNumber = generateReferenceNumber('FA');

  return await db.FixedAsset.create({
    tenant_id: tenantId,
    asset_number: assetNumber,
    asset_name: data.assetName,
    asset_type: data.assetType,
    category: data.category,
    acquisition_date: data.acquisitionDate,
    acquisition_cost: data.acquisitionCost,
    useful_life_years: data.usefulLifeYears,
    depreciation_method: data.depreciationMethod || 'straight_line',
    residual_value: data.residualValue || 0,
    accumulated_depreciation: 0,
    location: data.location,
    serial_number: data.serialNumber,
    status: 'active',
    notes: data.notes,
  });
};

const calculateDepreciation = async (tenantId, month, year) => {
  const assets = await db.FixedAsset.findAll({
    where: {
      tenant_id: tenantId,
      status: 'active',
      acquisition_date: { [Op.lte]: new Date(year, month - 1, 1) },
    },
  });

  const depreciationEntries = [];

  for (const asset of assets) {
    const depreciableAmount = parseFloat(asset.acquisition_cost) - parseFloat(asset.residual_value);
    let monthlyDepreciation = 0;

    if (asset.depreciation_method === 'straight_line') {
      const totalMonths = asset.useful_life_years * 12;
      monthlyDepreciation = depreciableAmount / totalMonths;
    }

    if (monthlyDepreciation > 0) {
      depreciationEntries.push({
        assetId: asset.id,
        assetName: asset.asset_name,
        amount: monthlyDepreciation,
      });

      // Update accumulated depreciation
      await asset.update({
        accumulated_depreciation: parseFloat(asset.accumulated_depreciation) + monthlyDepreciation,
      });
    }
  }

  return depreciationEntries;
};

const getBankAccounts = async tenantId => {
  return await db.BankAccount.findAll({
    where: { tenant_id: tenantId, is_active: true },
    order: [['account_name', 'ASC']],
  });
};

const createBankAccount = async (tenantId, data) => {
  return await db.BankAccount.create({
    tenant_id: tenantId,
    account_name: data.accountName,
    bank_name: data.bankName,
    account_number: data.accountNumber,
    iban: data.iban,
    currency: data.currency || 'AED',
    opening_balance: data.openingBalance || 0,
    current_balance: data.openingBalance || 0,
    is_active: true,
  });
};

module.exports = {
  getAllJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  getAllExpenses,
  createExpense,
  approveExpense,
  getAllFixedAssets,
  createFixedAsset,
  calculateDepreciation,
  getBankAccounts,
  createBankAccount,
};
