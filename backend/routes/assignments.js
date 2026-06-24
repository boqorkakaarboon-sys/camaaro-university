const express = require('express');
const router  = express.Router();
const Assignment = require('../models/Assignment');
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET assignments (by course)
router.get('/', protect, async (req, res) => {
  try {
    const { courseId } = req.query;
    let filter = {};
    if (courseId) filter.course = courseId;
    if (req.user.role === 'teacher') filter.teacher = req.user._id;
    const assignments = await Assignment.find(filter).populate('course','title code').populate('teacher','name').select('-submissions.fileData').sort({ dueDate: 1 });
    res.json({ success: true, assignments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// CREATE assignment
router.post('/', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, teacher: req.user._id });
    // Notify enrolled students
    const Course = require('../models/Course');
    const course = await Course.findById(req.body.course).populate('students','_id');
    if (course?.students) {
      await Promise.all(course.students.map(async (s) => {
        const u = await User.findById(s._id);
        if (u) { u.pushNotification('course','Assignment Cusub', `${assignment.title} — Due: ${new Date(assignment.dueDate).toLocaleDateString()}`, '/student/assignments'); await u.save(); }
      }));
    }
    res.status(201).json({ success: true, message: 'Assignment created', assignment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// SUBMIT assignment (student)
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { fileData, fileName, fileType } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    const existing = assignment.submissions.findIndex(s => s.student.toString() === req.user._id.toString());
    const isLate = new Date() > new Date(assignment.dueDate);
    const sub = { student: req.user._id, fileData, fileName, fileType, submittedAt: new Date(), status: isLate ? 'late' : 'submitted' };
    if (existing >= 0) assignment.submissions[existing] = { ...assignment.submissions[existing].toObject(), ...sub };
    else assignment.submissions.push(sub);
    await assignment.save();
    res.json({ success: true, message: isLate ? 'Submitted (late)' : 'Submitted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GRADE submission (teacher)
router.put('/:id/grade/:studentId', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    const sub = assignment.submissions.find(s => s.student.toString() === req.params.studentId);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    sub.score = score; sub.feedback = feedback; sub.gradedAt = new Date(); sub.status = 'graded';
    await assignment.save();
    // Notify student
    const u = await User.findById(req.params.studentId);
    if (u) { u.pushNotification('result','Assignment Graded', `${assignment.title}: ${score}/${assignment.maxScore}`); await u.save(); }
    res.json({ success: true, message: 'Graded' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET submissions for teacher
router.get('/:id/submissions', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('submissions.student','name studentId email');
    res.json({ success: true, submissions: assignment.submissions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
