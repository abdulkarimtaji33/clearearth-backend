/**
 * Employee Salary Structure Service (HRM)
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;

const set = async (tenantId, actorUserId, employeeId, body) => {
  const { basicSalary, housingAllowance, transportAllowance, otherAllowance, commissionEligible, paymentMethod, currency, effectiveFrom } = body;

  const basic = parseFloat(basicSalary);
  if (!Number.isFinite(basic) || basic <= 0) throw ApiError.badRequest('basicSalary must be greater than zero');
  if (!effectiveFrom) throw ApiError.badRequest('effectiveFrom is required');

  const employee = await db.Employee.findOne({ where: { id: employeeId, tenant_id: tenantId } });
  if (!employee) throw ApiError.notFound('Employee not found');

  let row;
  await db.sequelize.transaction(async (t) => {
    const prior = await db.EmployeeSalaryStructure.findOne({
      where: { tenant_id: tenantId, employee_id: employeeId, is_active: true },
      transaction: t,
    });
    if (prior) {
      const priorEffectiveTo = new Date(effectiveFrom);
      priorEffectiveTo.setDate(priorEffectiveTo.getDate() - 1);
      await prior.update(
        { effective_to: priorEffectiveTo.toISOString().slice(0, 10), is_active: false },
        { transaction: t }
      );
    }

    row = await db.EmployeeSalaryStructure.create({
      tenant_id: tenantId,
      employee_id: employeeId,
      basic_salary: basic,
      housing_allowance: parseFloat(housingAllowance) || 0,
      transport_allowance: parseFloat(transportAllowance) || 0,
      other_allowance: parseFloat(otherAllowance) || 0,
      commission_eligible: !!commissionEligible,
      payment_method: paymentMethod || 'bank_transfer',
      currency: currency || 'AED',
      effective_from: effectiveFrom,
      effective_to: null,
      is_active: true,
      created_by: actorUserId || null,
    }, { transaction: t });
  });

  return row;
};

const getActive = async (tenantId, employeeId, asOfDate = null) => {
  const date = asOfDate || new Date().toISOString().slice(0, 10);
  const row = await db.EmployeeSalaryStructure.findOne({
    where: {
      tenant_id: tenantId,
      employee_id: employeeId,
      effective_from: { [Op.lte]: date },
      [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: date } }],
    },
    order: [['effective_from', 'DESC']],
  });
  return row;
};

const history = async (tenantId, employeeId) => {
  return db.EmployeeSalaryStructure.findAll({
    where: { tenant_id: tenantId, employee_id: employeeId },
    order: [['effective_from', 'DESC']],
  });
};

module.exports = { set, getActive, history };
