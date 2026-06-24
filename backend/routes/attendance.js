const express = require('express');
const router  = express.Router();
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

// GET attendance by course + date
router.get('/:courseId', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const { date } = req.query;
    let filter = { course: req.params.courseId };
    if (date) { const d = new Date(date); const next = new Date(d); next.setDate(d.getDate()+1); filter.date = { $gte: d, $lt: next }; }
    const records = await Attendance.find(filter).populate('records.student','name studentId').sort({ date: -1 });
    res.json({ success: true, records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// MARK attendance
router.post('/', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    const d = new Date(date); const next = new Date(d); next.setDate(d.getDate()+1);
    let att = await Attendance.findOne({ course: courseId, date: { $gte: d, $lt: next } });
    if (att) { att.records = records; await att.save(); }
    else att = await Attendance.create({ course: courseId, teacher: req.user._id, date: d, records });
    res.json({ success: true, message: 'Attendance saved', attendance: att });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET student's own attendance
router.get('/student/mine', protect, authorize('student'), async (req, res) => {
  try {
    const records = await Attendance.find({ 'records.student': req.user._id }).populate('course','title code').sort({ date: -1 });
    const result = records.map(a => {
      const r = a.records.find(r => r.student.toString() === req.user._id.toString());
      return { course: a.course, date: a.date, status: r?.status, note: r?.note };
    });
    res.json({ success: true, records: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
