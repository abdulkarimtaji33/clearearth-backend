/**
 * Generic CRUD helpers for the small employee child-record tables
 * (emergency contacts, dependents, qualifications, skills, certifications,
 * previous employment, documents). Each entity is a simple tenant+employee
 * scoped table with no cross-entity logic, so rather than duplicating near
 * identical list/create/update/delete functions seven times, this module
 * builds them from a per-entity config (model + camelCase<->snake_case
 * field map) used by both the HR-side and self-service routes.
 */
const db = require('../models');
const ApiError = require('../utils/apiError');

/** Build list/create/update/remove functions scoped to tenant + a given employeeId. */
function makeChildRecordService(model, fieldMap) {
  const fields = Object.keys(fieldMap);

  const toColumns = (body) => {
    const data = {};
    for (const f of fields) {
      if (body[f] !== undefined) data[fieldMap[f]] = body[f] === '' ? null : body[f];
    }
    return data;
  };

  const list = async (tenantId, employeeId) => {
    return model.findAll({ where: { tenant_id: tenantId, employee_id: employeeId }, order: [['id', 'DESC']] });
  };

  const create = async (tenantId, employeeId, body) => {
    return model.create({ tenant_id: tenantId, employee_id: employeeId, ...toColumns(body) });
  };

  const update = async (tenantId, employeeId, id, body) => {
    const row = await model.findOne({ where: { id, tenant_id: tenantId, employee_id: employeeId } });
    if (!row) throw ApiError.notFound('Record not found');
    await row.update(toColumns(body));
    return row;
  };

  const remove = async (tenantId, employeeId, id) => {
    const row = await model.findOne({ where: { id, tenant_id: tenantId, employee_id: employeeId } });
    if (!row) throw ApiError.notFound('Record not found');
    await row.destroy();
    return true;
  };

  return { list, create, update, remove };
}

const emergencyContacts = makeChildRecordService(db.EmployeeEmergencyContact, {
  name: 'name', relationship: 'relationship', phone: 'phone', email: 'email', isPrimary: 'is_primary',
});

const dependents = makeChildRecordService(db.EmployeeDependent, {
  name: 'name', relationship: 'relationship', dateOfBirth: 'date_of_birth', idNumber: 'id_number', notes: 'notes',
});

const qualifications = makeChildRecordService(db.EmployeeQualification, {
  degree: 'degree', institution: 'institution', year: 'year', grade: 'grade', filePath: 'file_path',
});

const skills = makeChildRecordService(db.EmployeeSkill, {
  skillName: 'skill_name', proficiencyLevel: 'proficiency_level',
});

const certifications = makeChildRecordService(db.EmployeeCertification, {
  name: 'name', issuer: 'issuer', certificateNumber: 'certificate_number',
  issueDate: 'issue_date', expiryDate: 'expiry_date', filePath: 'file_path',
});

const previousEmployment = makeChildRecordService(db.EmployeePreviousEmployment, {
  companyName: 'company_name', jobTitle: 'job_title', startDate: 'start_date', endDate: 'end_date', reasonForLeaving: 'reason_for_leaving',
});

const documents = makeChildRecordService(db.EmployeeDocument, {
  documentTypeId: 'document_type_id', documentNumber: 'document_number',
  issueDate: 'issue_date', expiryDate: 'expiry_date', filePath: 'file_path', notes: 'notes',
});

// HR-only, never exposed on self-service endpoints.
const notes = makeChildRecordService(db.EmployeeNote, { noteText: 'note_text' });

module.exports = {
  makeChildRecordService,
  emergencyContacts,
  dependents,
  qualifications,
  skills,
  certifications,
  previousEmployment,
  documents,
  notes,
};
