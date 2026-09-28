/**
 * Payroll Service (HRM) — the core payroll engine.
 * Pro-rata deduction: basic_salary / 30 * (absent_days + unpaid_leave_days), fixed divisor.
 * GL posting mirrors the resilience pattern used in expense.service.js: each journal
 * entry call is wrapped in its own try/catch that only console.warns on failure so a
 * GL glitch never blocks the core payroll transaction.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = db.Sequelize;
const jeService = require('./journalEntry.service');
const salaryStructureService = require('./salaryStructure.service');
const attendanceService = require('./attendance.service');
const employeeService = require('./employee.service');

function periodLabel(month, year) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[month - 1]} ${year}`;
}

const createRun = async (tenantId, actorUserId, periodMonth, periodYear) => {
  const month = Number(periodMonth);
  const year = Number(periodYear);
  if (!month || month < 1 || month > 12 || !year) throw ApiError.badRequest('Valid periodMonth (1-12) and periodYear are required');

  const existing = await db.PayrollRun.findOne({ where: { tenant_id: tenantId, period_month: month, period_year: year } });
  if (existing) throw ApiError.conflict(`A payroll run already exists for ${periodLabel(month, year)}`);

  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  return db.PayrollRun.create({
    tenant_id: tenantId, period_month: month, period_year: year,
    period_start: periodStart, period_end: periodEnd, status: 'draft',
    processed_by: actorUserId,
  });
};

/**
 * Sum an employee's accrued-but-not-yet-applied sales commission for the period, if a
 * commission feature exists elsewhere in the codebase. A `Commission` model (one row
 * per quotation approval, keyed by `user_id` with `status: 'accrued'|'paid'|'in_payroll'`)
 * is present as of this writing — this joins through employees.user_id to it. Wrapped
 * defensively since that feature is an active concurrent workstream and its schema may
 * still change; any mismatch degrades to 0 rather than failing payroll processing.
 */
async function resolveCommissionAmount(tenantId, employee, periodStart, periodEnd) {
  if (!db.Commission || !employee.user_id) return 0;
  try {
    const rows = await db.Commission.findAll({
      where: {
        tenant_id: tenantId,
        user_id: employee.user_id,
        status: 'accrued',
        created_at: { [Op.between]: [`${periodStart} 00:00:00`, `${periodEnd} 23:59:59`] },
      },
    });
    return rows.reduce((s, r) => s + (parseFloat(r.commission_amount) || 0), 0);
  } catch (e) {
    console.warn('[HR] commission lookup skipped:', e.message);
    return 0;
  }
}

const process = async (tenantId, actorUserId, payrollRunId) => {
  const run = await db.PayrollRun.findOne({ where: { id: payrollRunId, tenant_id: tenantId } });
  if (!run) throw ApiError.notFound('Payroll run not found');
  if (!['draft', 'processed'].includes(run.status)) throw ApiError.conflict(`Cannot process a run in '${run.status}' status`);

  const daysInMonth = new Date(run.period_year, run.period_month, 0).getDate();

  await db.sequelize.transaction(async (t) => {
    await db.Payslip.destroy({ where: { tenant_id: tenantId, payroll_run_id: payrollRunId }, transaction: t });

    const employees = await db.Employee.findAll({
      where: {
        tenant_id: tenantId,
        employment_status: { [Op.in]: ['active', 'on_leave'] },
        date_of_joining: { [Op.lte]: run.period_end },
        [Op.or]: [{ date_of_exit: null }, { date_of_exit: { [Op.gte]: run.period_start } }],
      },
      transaction: t,
    });

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const employee of employees) {
      const salary = await salaryStructureService.getActive(tenantId, employee.id, run.period_end);
      if (!salary) {
        console.warn(`[Payroll] Skipping employee ${employee.employee_code} (id ${employee.id}) — no active salary structure`);
        continue;
      }

      const sheet = await attendanceService.getMonthlySheet(tenantId, employee.id, run.period_year, run.period_month);

      const absentDays = sheet.days.filter((d) => d.status === 'absent').length;

      // unpaid_leave_days: days marked on_leave whose covering leave request resolves to an unpaid leave type
      const onLeaveDates = sheet.days.filter((d) => d.status === 'on_leave').map((d) => d.date);
      let unpaidLeaveDays = 0;
      if (onLeaveDates.length) {
        const leaveRequests = await db.LeaveRequest.findAll({
          where: {
            tenant_id: tenantId,
            employee_id: employee.id,
            status: 'approved',
            start_date: { [Op.lte]: run.period_end },
            end_date: { [Op.gte]: run.period_start },
          },
          include: [{ model: db.LeaveType, as: 'leaveType' }],
          transaction: t,
        });
        const unpaidRanges = leaveRequests.filter((lr) => lr.leaveType && !lr.leaveType.is_paid);
        for (const dateStr of onLeaveDates) {
          const covered = unpaidRanges.some((lr) => dateStr >= lr.start_date && dateStr <= lr.end_date);
          if (covered) unpaidLeaveDays += 1;
        }
      }

      const basic = parseFloat(salary.basic_salary);
      const housing = parseFloat(salary.housing_allowance) || 0;
      const transport = parseFloat(salary.transport_allowance) || 0;
      const other = parseFloat(salary.other_allowance) || 0;

      const commissionAmount = await resolveCommissionAmount(tenantId, employee, run.period_start, run.period_end);

      const prorationDeduction = Math.round((basic / 30) * (absentDays + unpaidLeaveDays) * 100) / 100;
      const otherDeductions = 0;
      const grossSalary = Math.round((basic + housing + transport + other + commissionAmount) * 100) / 100;
      const totalDeduction = Math.round((prorationDeduction + otherDeductions) * 100) / 100;
      const netSalary = Math.round((grossSalary - totalDeduction) * 100) / 100;
      const paidDays = Math.max(0, daysInMonth - absentDays - unpaidLeaveDays);

      await db.Payslip.create({
        tenant_id: tenantId, payroll_run_id: payrollRunId, employee_id: employee.id,
        basic_salary: basic, housing_allowance: housing, transport_allowance: transport, other_allowance: other,
        commission_amount: commissionAmount, gross_salary: grossSalary,
        days_in_month: daysInMonth, paid_days: paidDays, unpaid_leave_days: unpaidLeaveDays, absent_days: absentDays,
        proration_deduction: prorationDeduction, other_deductions: otherDeductions, total_deductions: totalDeduction,
        net_salary: netSalary, payment_status: 'unpaid',
      }, { transaction: t });

      totalGross += grossSalary;
      totalDeductions += totalDeduction;
      totalNet += netSalary;
    }

    await run.update({
      status: 'processed',
      total_gross: Math.round(totalGross * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      total_net: Math.round(totalNet * 100) / 100,
      processed_by: actorUserId,
      processed_at: new Date(),
    }, { transaction: t });
  });

  return getRunDetail(tenantId, payrollRunId);
};

const approve = async (tenantId, actorUserId, payrollRunId) => {
  const run = await db.PayrollRun.findOne({ where: { id: payrollRunId, tenant_id: tenantId } });
  if (!run) throw ApiError.notFound('Payroll run not found');
  if (run.status !== 'processed') throw ApiError.conflict(`Only a 'processed' run can be approved (current: ${run.status})`);

  const payslips = await db.Payslip.findAll({
    where: { tenant_id: tenantId, payroll_run_id: payrollRunId },
    include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'employee_code'] }],
  });

  await db.sequelize.transaction(async (t) => {
    for (const payslip of payslips) {
      const basic = parseFloat(payslip.basic_salary);
      const housing = parseFloat(payslip.housing_allowance);
      const transport = parseFloat(payslip.transport_allowance);
      const other = parseFloat(payslip.other_allowance);
      const proration = parseFloat(payslip.proration_deduction);
      const otherDeductions = parseFloat(payslip.other_deductions);
      const commission = parseFloat(payslip.commission_amount);
      const net = parseFloat(payslip.net_salary);

      const salariesExpense = Math.round((basic + housing + transport + other - proration - otherDeductions) * 100) / 100;

      const lines = [];
      if (Math.abs(salariesExpense) > 0.001) lines.push({ code: '5700', debit: salariesExpense, credit: 0 });
      if (commission > 0.001) lines.push({ code: '5710', debit: commission, credit: 0 });
      lines.push({ code: '2400', debit: 0, credit: net });

      const debitTotal = lines.reduce((s, l) => s + l.debit, 0);
      if (Math.abs(debitTotal - net) > 0.01) {
        console.warn(`[GL] Payroll accrual JE for payslip ${payslip.id} not balanced (debit ${debitTotal} vs net ${net}) — skipped`);
        continue;
      }

      try {
        const resolvedLines = await Promise.all(lines.map(async (l) => ({
          accountId: await jeService.getSystemAccountId(tenantId, l.code),
          debit: l.debit,
          credit: l.credit,
        })));
        const entryId = await jeService.createJournalEntry(tenantId, actorUserId, {
          entryDate: run.period_end,
          description: `Payroll Accrual — ${payslip.employee.employee_code} — ${periodLabel(run.period_month, run.period_year)}`,
          sourceType: 'payroll',
          sourceId: payslip.id,
          lines: resolvedLines,
        }, t);
        await payslip.update({ journal_entry_id_accrual: entryId }, { transaction: t });
      } catch (jeErr) {
        console.warn('[GL] payroll accrual journal entry skipped:', jeErr.message);
      }
    }

    await run.update({ status: 'approved', approved_by: actorUserId, approved_at: new Date() }, { transaction: t });
  });

  return getRunDetail(tenantId, payrollRunId);
};

const markPaid = async (tenantId, actorUserId, payrollRunId, options = {}) => {
  const { paymentAccountCode = '1000', payslipIds = null } = options;
  const run = await db.PayrollRun.findOne({ where: { id: payrollRunId, tenant_id: tenantId } });
  if (!run) throw ApiError.notFound('Payroll run not found');
  if (!['approved', 'paid'].includes(run.status)) throw ApiError.conflict(`Only an 'approved' run can be marked paid (current: ${run.status})`);

  const where = { tenant_id: tenantId, payroll_run_id: payrollRunId, payment_status: 'unpaid' };
  if (Array.isArray(payslipIds) && payslipIds.length) where.id = { [Op.in]: payslipIds };

  const payslips = await db.Payslip.findAll({
    where,
    include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'employee_code'] }],
  });

  await db.sequelize.transaction(async (t) => {
    for (const payslip of payslips) {
      const net = parseFloat(payslip.net_salary);
      try {
        const salariesPayableId = await jeService.getSystemAccountId(tenantId, '2400');
        const paymentAccountId = await jeService.getSystemAccountId(tenantId, paymentAccountCode);
        const entryId = await jeService.createJournalEntry(tenantId, actorUserId, {
          entryDate: new Date().toISOString().slice(0, 10),
          description: `Payroll Payment — ${payslip.employee.employee_code} — ${periodLabel(run.period_month, run.period_year)}`,
          sourceType: 'payroll_payment',
          sourceId: payslip.id,
          lines: [
            { accountId: salariesPayableId, debit: net, credit: 0 },
            { accountId: paymentAccountId, debit: 0, credit: net },
          ],
        }, t);
        await payslip.update({ journal_entry_id_payment: entryId }, { transaction: t });
      } catch (jeErr) {
        console.warn('[GL] payroll payment journal entry skipped:', jeErr.message);
      }

      await payslip.update({ payment_status: 'paid', paid_at: new Date() }, { transaction: t });
    }

    const remainingUnpaid = await db.Payslip.count({ where: { tenant_id: tenantId, payroll_run_id: payrollRunId, payment_status: 'unpaid' }, transaction: t });
    if (remainingUnpaid === 0) {
      await run.update({ status: 'paid', paid_at: new Date() }, { transaction: t });
    }
  });

  return getRunDetail(tenantId, payrollRunId);
};

const getPayslip = async (tenantId, actorUser, payslipId) => {
  const payslip = await db.Payslip.findOne({
    where: { id: payslipId, tenant_id: tenantId },
    include: [
      { model: db.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'employee_code', 'user_id'] },
      { model: db.PayrollRun, as: 'payrollRun' },
    ],
  });
  if (!payslip) throw ApiError.notFound('Payslip not found');

  const names = (actorUser.role?.permissions || []).map((p) => p.name);
  const hasHrAccess = ['super_admin', 'hr_manager', 'admin', 'tenant_admin'].includes(actorUser.role?.name)
    || names.includes('hr.payroll.read') || names.includes('hr.payroll.process');

  if (!hasHrAccess) {
    const employee = await employeeService.getByUserId(tenantId, actorUser.id);
    if (!employee || employee.id !== payslip.employee_id) throw ApiError.forbidden('You can only view your own payslips');
  }

  return payslip;
};

const getMyPayslips = async (tenantId, actorUserId) => {
  const employee = await employeeService.requireEmployeeForUser(tenantId, actorUserId);
  return db.Payslip.findAll({
    where: { tenant_id: tenantId, employee_id: employee.id },
    include: [{ model: db.PayrollRun, as: 'payrollRun', attributes: ['id', 'period_month', 'period_year', 'status'] }],
    order: [['created_at', 'DESC']],
  });
};

const listRuns = async (tenantId, filters = {}) => {
  const { status } = filters;
  const where = { tenant_id: tenantId };
  if (status) where.status = status;
  return db.PayrollRun.findAll({ where, order: [['period_year', 'DESC'], ['period_month', 'DESC']] });
};

const getRunDetail = async (tenantId, payrollRunId) => {
  const run = await db.PayrollRun.findOne({ where: { id: payrollRunId, tenant_id: tenantId } });
  if (!run) throw ApiError.notFound('Payroll run not found');
  const payslips = await db.Payslip.findAll({
    where: { tenant_id: tenantId, payroll_run_id: payrollRunId },
    include: [{ model: db.Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'employee_code'] }],
    order: [['id', 'ASC']],
  });
  const plain = run.get({ plain: true });
  plain.payslips = payslips;
  return plain;
};

module.exports = { createRun, process, approve, markPaid, getPayslip, getMyPayslips, listRuns, getRunDetail };
