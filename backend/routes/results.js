const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

// GET /api/results/mine  – student's full result history
router.get('/mine', protect, authorize('student'), ctrl.getMyAllResults);

// GET /api/results/transcript – official GPA transcript
router.get('/transcript', protect, authorize('student'), ctrl.getTranscript);

// GET /api/results/exam/:id – all results for an exam (teacher/admin)
router.get('/exam/:id', protect, authorize('admin', 'teacher'), ctrl.getExamResults);

// GET /api/results/:examId/mine – student's single result
router.get('/:examId/mine', protect, authorize('student'), ctrl.getMyResult);

module.exports = router;
