const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const employeeNoteController = require('../controllers/employeeNote.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');
const childRecordsService = require('../services/employeeChildRecords.service');
const {
  makeChildRecordController, hrEmployeeIdResolver, selfEmployeeIdResolver,
} = require('../controllers/employeeChildRecords.controller');

router.use(authenticate);

// -- Document types lookup (system-wide + tenant-specific) ------------------
router.get('/document-types', async (req, res, next) => {
  try {
    const db = require('../models');
    const rows = await db.DocumentType.findAll({
      where: {
        is_active: true,
        [db.Sequelize.Op.or]: [{ tenant_id: null }, { tenant_id: req.tenant.id }],
      },
      order: [['name', 'ASC']],
    });
    res.json({ success: true, message: 'Success', data: rows });
  } catch (e) { next(e); }
});

// -- Child-record entity controllers (HR side + self-service mirror) --------
const entities = {
  'emergency-contacts': childRecordsService.emergencyContacts,
  dependents: childRecordsService.dependents,
  qualifications: childRecordsService.qualifications,
  skills: childRecordsService.skills,
  certifications: childRecordsService.certifications,
  'previous-employment': childRecordsService.previousEmployment,
  documents: childRecordsService.documents,
};
// Entities whose create endpoint accepts an optional file upload (`file` field)
const uploadableEntities = new Set(['qualifications', 'certifications', 'documents']);

const hrControllers = {};
const selfControllers = {};
for (const [path, service] of Object.entries(entities)) {
  hrControllers[path] = makeChildRecordController(service, hrEmployeeIdResolver);
  selfControllers[path] = makeChildRecordController(service, selfEmployeeIdResolver);
}

// ---------------------------------------------------------------------------
// Self-service routes (own record only) — declared before the /:id-style HR
// routes below so the literal "me" segment isn't ever misread as an id.
// ---------------------------------------------------------------------------
router.get('/me', employeeController.getMe);
router.get('/me/salary-history', employeeController.getMySalaryHistory);
router.get('/me/history', employeeController.getMyHistory);

router.get('/me/change-requests', employeeController.listMyChangeRequests);
router.post('/me/change-requests', employeeController.createMyChangeRequest);

for (const [path, controller] of Object.entries(selfControllers)) {
  const uploadMw = uploadableEntities.has(path) ? [uploadSingle('file')] : [];
  router.get(`/me/${path}`, controller.list);
  router.post(`/me/${path}`, ...uploadMw, controller.create);
  router.put(`/me/${path}/:id`, controller.update);
  router.delete(`/me/${path}/:id`, controller.remove);
}

// HR queue for change requests — must also be declared before /:id
router.get('/change-requests', authorize('hr.employees.manage'), employeeController.listChangeRequests);
router.post('/change-requests/:id/approve', authorize('hr.employees.manage'), employeeController.approveChangeRequest);
router.post('/change-requests/:id/reject', authorize('hr.employees.manage'), employeeController.rejectChangeRequest);

// ---------------------------------------------------------------------------
// HR-side employee CRUD
// ---------------------------------------------------------------------------
router.get('/', authorize('hr.employees.read', 'hr.employees.manage'), employeeController.getAll);
router.get('/:id', authorize('hr.employees.read', 'hr.employees.manage'), employeeController.getById);
router.post('/', authorize('hr.employees.manage'), employeeController.create);
router.put('/:id', authorize('hr.employees.manage'), employeeController.update);
router.post('/:id/offboard', authorize('hr.employees.manage'), employeeController.offboard);

router.get('/:id/salary-structure', authorize('hr.employees.manage'), employeeController.getSalaryStructureHistory);
router.post('/:id/salary-structure', authorize('hr.employees.manage'), employeeController.setSalaryStructure);

router.get('/:employeeId/history', authorize('hr.employees.read', 'hr.employees.manage'), employeeController.getHistory);

// HR-only notes — never exposed on self-service endpoints
router.get('/:employeeId/notes', authorize('hr.employees.manage'), employeeNoteController.list);
router.post('/:employeeId/notes', authorize('hr.employees.manage'), employeeNoteController.create);
router.put('/:employeeId/notes/:id', authorize('hr.employees.manage'), employeeNoteController.update);
router.delete('/:employeeId/notes/:id', authorize('hr.employees.manage'), employeeNoteController.remove);

// HR-side child-record CRUD
for (const [path, controller] of Object.entries(hrControllers)) {
  const uploadMw = uploadableEntities.has(path) ? [uploadSingle('file')] : [];
  router.get(`/:employeeId/${path}`, authorize('hr.employees.manage'), controller.list);
  router.post(`/:employeeId/${path}`, authorize('hr.employees.manage'), ...uploadMw, controller.create);
  router.put(`/:employeeId/${path}/:id`, authorize('hr.employees.manage'), controller.update);
  router.delete(`/:employeeId/${path}/:id`, authorize('hr.employees.manage'), controller.remove);
}

module.exports = router;
