const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

// ── Exam CRUD ───────────────────────────────────────────────────
router.get('/',           protect,                          ctrl.getExams);
router.get('/all',        protect, authorize('admin'),      ctrl.getAllExams);
router.post('/',          protect, authorize('admin','teacher'), ctrl.createExam);
router.put('/:id',        protect, authorize('admin','teacher'), ctrl.updateExam);
router.delete('/:id',     protect, authorize('admin'),      ctrl.deleteExam);

// ── Exam taking (student) ───────────────────────────────────────
router.post('/:id/start',    protect, authorize('student'), ctrl.startExam);
router.patch('/:id/autosave',protect, authorize('student'), ctrl.autosave);
router.post('/:id/submit',   protect, authorize('student'), ctrl.submitExam);
router.get('/:id/myresult',  protect, authorize('student'), ctrl.getMyResult);

// ── Results (teacher/admin view) ────────────────────────────────
router.get('/:id/results',   protect, authorize('admin','teacher'), ctrl.getExamResults);
router.post('/:id/results',  protect, authorize('admin','teacher'), ctrl.addResult);

// ── Manual grading ──────────────────────────────────────────────
router.patch('/results/:resultId/grade', protect, authorize('admin','teacher'), ctrl.manualGrade);

// ── Must be last: get single exam (role-aware) ──────────────────
router.get('/:id',        protect,                          ctrl.getExamById);

module.exports = router;
