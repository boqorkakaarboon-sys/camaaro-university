const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Course  = require('../models/Course');
const Result  = require('../models/Result');
const Exam    = require('../models/Exam');
const { protect, authorize } = require('../middleware/auth');

router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalCourses, totalExams] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Course.countDocuments({ isActive: true }),
      Exam.countDocuments(),
    ]);
    const results = await Result.find().populate('exam','title').populate('student','name studentId department');
    const totalResults = results.length;
    const passedResults = results.filter(r => r.percentage >= 50).length;
    const passRate = totalResults ? Math.round((passedResults / totalResults) * 100) : 0;
    const avgScore = totalResults ? Math.round(results.reduce((a, b) => a + b.percentage, 0) / totalResults) : 0;
    // Grade distribution
    const gradeDist = { 'A+':0,'A':0,'B+':0,'B':0,'C+':0,'C':0,'D':0,'F':0 };
    results.forEach(r => { if (gradeDist[r.grade] !== undefined) gradeDist[r.grade]++; });
    // Top students
    const studentMap = {};
    results.forEach(r => {
      const id = r.student?._id?.toString();
      if (!id) return;
      if (!studentMap[id]) studentMap[id] = { student: r.student, scores: [], count: 0 };
      studentMap[id].scores.push(r.percentage);
      studentMap[id].count++;
    });
    const topStudents = Object.values(studentMap)
      .map(s => ({ ...s, avg: Math.round(s.scores.reduce((a,b)=>a+b,0)/s.scores.length) }))
      .sort((a,b) => b.avg - a.avg).slice(0, 10);
    // Department stats
    const deptMap = {};
    results.forEach(r => {
      const dept = r.student?.department || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, passed: 0, scores: [] };
      deptMap[dept].total++; deptMap[dept].scores.push(r.percentage);
      if (r.percentage >= 50) deptMap[dept].passed++;
    });
    const departmentStats = Object.entries(deptMap).map(([dept, d]) => ({ department: dept, total: d.total, passed: d.passed, passRate: Math.round((d.passed/d.total)*100), avgScore: Math.round(d.scores.reduce((a,b)=>a+b,0)/d.scores.length) }));
    res.json({ success: true, stats: { totalStudents, totalTeachers, totalCourses, totalExams, totalResults, passRate, avgScore, gradeDist, topStudents, departmentStats } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/course/:courseId', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const exams = await Exam.find({ course: req.params.courseId }).select('_id title');
    const examIds = exams.map(e => e._id);
    const results = await Result.find({ exam: { $in: examIds } }).populate('student','name studentId').populate('exam','title');
    const passRate = results.length ? Math.round(results.filter(r=>r.percentage>=50).length/results.length*100) : 0;
    const avgScore = results.length ? Math.round(results.reduce((a,b)=>a+b.percentage,0)/results.length) : 0;
    res.json({ success: true, stats: { totalResults: results.length, passRate, avgScore, results } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/auditlog', protect, authorize('admin'), async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.find().populate('user','name email role').sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// LEADERBOARD — all logged-in users can view
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { courseId } = req.query;
    let examFilter = {};
    if (courseId) {
      const examIds = (await Exam.find({ course: courseId }).select('_id')).map(e => e._id);
      examFilter = { exam: { $in: examIds } };
    }
    const results = await Result.find({ status: 'graded', ...examFilter })
      .populate('student', 'name studentId department avatar')
      .populate('course', 'title code');

    const studentMap = {};
    results.forEach(r => {
      const id = r.student?._id?.toString();
      if (!id) return;
      if (!studentMap[id]) studentMap[id] = { student: r.student, scores: [] };
      studentMap[id].scores.push(r.percentage);
    });
    const leaderboard = Object.values(studentMap)
      .map(s => ({ student: s.student, avg: Math.round(s.scores.reduce((a,b)=>a+b,0)/s.scores.length), examsTaken: s.scores.length }))
      .sort((a,b) => b.avg - a.avg)
      .slice(0, 50)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    const myRank = leaderboard.find(l => l.student._id.toString() === req.user._id.toString());
    res.json({ success: true, leaderboard, myRank: myRank || null });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// STUDENT PROGRESS (own GPA trend over time)
router.get('/my-progress', protect, authorize('student'), async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id, status: 'graded' })
      .populate('exam', 'title')
      .populate('course', 'title code')
      .sort({ createdAt: 1 });
    const trend = results.map(r => ({ date: r.createdAt, examTitle: r.exam?.title, course: r.course?.title, percentage: r.percentage, gpa: r.gpa, grade: r.grade }));
    const avgGpa = results.length ? (results.reduce((s,r)=>s+r.gpa,0)/results.length).toFixed(2) : '0.00';
    res.json({ success: true, trend, avgGpa });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// STUDENT PROGRESS (teacher/admin viewing any specific student's full result history)
router.get('/student/:studentId', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.studentId, role: 'student' }).select('name studentId email department avatar');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const results = await Result.find({ student: req.params.studentId, status: 'graded' })
      .populate('exam', 'title')
      .populate('course', 'title code')
      .sort({ createdAt: 1 });

    const trend = results.map(r => ({
      date: r.createdAt,
      examTitle: r.exam?.title,
      course: r.course?.title,
      percentage: r.percentage,
      gpa: r.gpa,
      grade: r.grade,
      passed: r.passed,
    }));

    const avg = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
    const avgGpa = results.length ? (results.reduce((s, r) => s + r.gpa, 0) / results.length).toFixed(2) : '0.00';
    const passedCount = results.filter((r) => r.passed).length;

    res.json({
      success: true,
      student,
      stats: { avg, avgGpa, count: results.length, passedCount, failedCount: results.length - passedCount },
      trend,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// EXAM STATISTICS — per-question breakdown (teacher/admin)
router.get('/exam-stats/:examId', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    const results = await Result.find({ exam: req.params.examId, status: { $in: ['submitted','graded'] } });

    const qStats = {};
    exam.questions.forEach(q => { qStats[q._id.toString()] = { text: q.text, type: q.type, correct: 0, total: 0 }; });
    results.forEach(r => {
      r.answers.forEach(a => {
        const qId = a.questionId.toString();
        if (qStats[qId]) { qStats[qId].total++; if (a.isCorrect) qStats[qId].correct++; }
      });
    });
    const questionStats = Object.entries(qStats).map(([id, s]) => ({
      questionId: id, text: s.text, type: s.type, total: s.total,
      correctPct: s.total ? Math.round((s.correct/s.total)*100) : 0,
    })).sort((a,b) => a.correctPct - b.correctPct);

    res.json({ success: true, examTitle: exam.title, totalAttempts: results.length, questionStats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

