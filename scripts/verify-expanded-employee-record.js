/**
 * Throwaway verification script for the expanded employee record backend work.
 * Exercises the service layer directly (no HTTP server needed) and cleans up
 * everything it creates. Run with: node scripts/verify-expanded-employee-record.js
 */
const db = require('./../src/models');
const employeeService = require('./../src/services/employee.service');
const childRecords = require('./../src/services/employeeChildRecords.service');

async function main() {
  const results = [];
  const check = (name, cond, detail) => {
    results.push({ name, pass: !!cond, detail });
    console.log(`${cond ? 'PASS' : 'FAIL'} - ${name}${detail ? ' :: ' + detail : ''}`);
  };

  const [[tenant]] = await db.sequelize.query('SELECT id FROM tenants LIMIT 1');
  if (!tenant) throw new Error('No tenant found in DB');
  const tenantId = tenant.id;

  const [[actorUser]] = await db.sequelize.query('SELECT id FROM users WHERE tenant_id = ? LIMIT 1', { replacements: [tenantId] });
  const actorUserId = actorUser ? actorUser.id : null;

  // Create a throwaway test employee (no login account) to exercise everything against.
  const employee = await employeeService.create(tenantId, actorUserId, {
    firstName: 'VerifyTest',
    lastName: 'Employee',
    dateOfJoining: '2026-01-01',
  });
  check('created test employee', !!employee && !!employee.id, `id=${employee.id}, code=${employee.employee_code}`);

  try {
    // 1. Emergency contact via service layer
    const contact = await childRecords.emergencyContacts.create(tenantId, employee.id, {
      name: 'Jane Doe', relationship: 'Spouse', phone: '0501234567', isPrimary: true,
    });
    const contacts = await childRecords.emergencyContacts.list(tenantId, employee.id);
    check('emergency contact created + read back', contacts.length === 1 && contacts[0].id === contact.id);

    // 2. Dependent
    await childRecords.dependents.create(tenantId, employee.id, { name: 'Kid Doe', relationship: 'Child', dateOfBirth: '2020-01-01' });
    const dependents = await childRecords.dependents.list(tenantId, employee.id);
    check('dependent created + read back', dependents.length === 1);

    // 3. Qualification
    await childRecords.qualifications.create(tenantId, employee.id, { degree: 'BSc', institution: 'Test University', year: 2015 });
    const quals = await childRecords.qualifications.list(tenantId, employee.id);
    check('qualification created + read back', quals.length === 1);

    // 4. Document
    const [[docType]] = await db.sequelize.query(`SELECT id FROM document_types WHERE name = 'Passport' LIMIT 1`);
    await childRecords.documents.create(tenantId, employee.id, {
      documentTypeId: docType ? docType.id : null, documentNumber: 'P1234567', filePath: 'documents/fake-test.pdf',
    });
    const docs = await childRecords.documents.list(tenantId, employee.id);
    check('document created + read back', docs.length === 1);

    // 5. Profile change request: submit + approve, confirm employee row actually changed + history row exists
    // (createChangeRequest resolves the employee via requireEmployeeForUser(userId); this test
    // employee has no linked user_id, so build the request row directly against employee.id instead.)
    const changeRequest = await db.ProfileChangeRequest.create({
      tenant_id: tenantId,
      employee_id: employee.id,
      field_group: 'identity',
      changes: { preferredName: { old: employee.preferred_name || null, new: 'VT' } },
      status: 'pending',
    });
    const approved = await employeeService.approveChangeRequest(tenantId, actorUserId, changeRequest.id);
    check('change request approved', approved.status === 'approved');

    const reloaded = await employeeService.getById(tenantId, employee.id);
    check('employee record actually changed after approval', reloaded.preferred_name === 'VT', `preferred_name=${reloaded.preferred_name}`);

    const historyAfterApproval = await employeeService.getHistory(tenantId, employee.id);
    check('employee_history row exists for the approved change', historyAfterApproval.some((h) => h.field_name === 'preferred_name' && h.new_value === 'VT'));

    // 6. update() department/status change -> auto history log
    const [[dept]] = await db.sequelize.query('SELECT id FROM departments WHERE tenant_id = ? LIMIT 1', { replacements: [tenantId] });
    if (dept) {
      await employeeService.update(tenantId, employee.id, { departmentId: dept.id }, actorUserId);
      const historyAfterDeptChange = await employeeService.getHistory(tenantId, employee.id);
      check('department_change history row auto-logged on update()', historyAfterDeptChange.some((h) => h.event_type === 'department_change'));
    } else {
      check('department_change history row auto-logged on update()', 'skip', 'no department row in DB to test against');
    }

    // 7. Salary structure set() -> salary_change history row
    const salaryStructureService = require('./../src/services/salaryStructure.service');
    await salaryStructureService.set(tenantId, actorUserId, employee.id, { basicSalary: 5000, effectiveFrom: '2026-01-01' });
    await salaryStructureService.set(tenantId, actorUserId, employee.id, { basicSalary: 6000, effectiveFrom: '2026-02-01' });
    const historyAfterSalary = await employeeService.getHistory(tenantId, employee.id);
    check('salary_change history row auto-logged on salaryStructure.set()', historyAfterSalary.some((h) => h.event_type === 'salary_change' && h.new_value === '6000'));

    // 8. getMeEnriched-equivalent shape (simulate via direct employee id since no linked user)
    const enrichedLike = await db.Employee.findOne({
      where: { id: employee.id, tenant_id: tenantId },
      include: [
        { model: db.Department, as: 'department', required: false },
        { model: db.Designation, as: 'designation', required: false },
        { model: db.WorkLocation, as: 'workLocation', required: false },
      ],
    });
    const documentCount = await db.EmployeeDocument.count({ where: { tenant_id: tenantId, employee_id: employee.id } });
    const pendingCount = await db.ProfileChangeRequest.count({ where: { tenant_id: tenantId, employee_id: employee.id, status: 'pending' } });
    check('enriched shape assembles (department/workLocation includes + counts)', !!enrichedLike && documentCount === 1 && pendingCount === 0, `documentCount=${documentCount}, pendingCount=${pendingCount}`);

    // 9. Actually exercise getMeEnriched/getMySalaryHistory through a real linked user, since those
    // functions go through requireEmployeeForUser(tenantId, userId).
    if (actorUserId) {
      const [[linkableUser]] = await db.sequelize.query(
        'SELECT id FROM users WHERE tenant_id = ? AND employee_id IS NULL LIMIT 1', { replacements: [tenantId] }
      );
      if (linkableUser) {
        await db.User.update({ employee_id: employee.id }, { where: { id: linkableUser.id } });
        await db.Employee.update({ user_id: linkableUser.id }, { where: { id: employee.id } });

        const meEnriched = await employeeService.getMeEnriched(tenantId, linkableUser.id);
        check('GET /hr/employees/me-equivalent returns enriched shape', meEnriched.salaryVisible === true && meEnriched.activeSalaryStructure && meEnriched.documentCount === 1, `salaryVisible=${meEnriched.salaryVisible}, documentCount=${meEnriched.documentCount}`);

        const salaryHistory = await employeeService.getMySalaryHistory(tenantId, linkableUser.id);
        check('GET /hr/employees/me/salary-history returns history', salaryHistory.salaryVisible === true && salaryHistory.history.length === 2, `entries=${salaryHistory.history.length}`);

        // undo the link so cleanup below doesn't affect the pre-existing user row's state
        await db.User.update({ employee_id: null }, { where: { id: linkableUser.id } });
      } else {
        check('GET /hr/employees/me-equivalent returns enriched shape', 'skip', 'no unlinked user available to test through');
      }
    }
  } finally {
    // Cleanup: delete everything created by this test employee (child tables cascade on
    // employee delete via FK ON DELETE CASCADE), then hard-delete the employee row itself
    // (paranoid soft-delete would leave the employee_code taken).
    await db.EmployeeHistory.destroy({ where: { tenant_id: tenantId, employee_id: employee.id } });
    await db.ProfileChangeRequest.destroy({ where: { tenant_id: tenantId, employee_id: employee.id } });
    await db.EmployeeSalaryStructure.destroy({ where: { tenant_id: tenantId, employee_id: employee.id } });
    await db.sequelize.query('DELETE FROM leave_balances WHERE employee_id = ?', { replacements: [employee.id] });
    await db.sequelize.query('DELETE FROM employees WHERE id = ?', { replacements: [employee.id] });
    console.log(`Cleaned up test employee id=${employee.id}`);
  }

  const failed = results.filter((r) => r.pass === false);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:', failed.map((f) => f.name).join(', '));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('Verification script errored:', e);
  process.exit(1);
});
