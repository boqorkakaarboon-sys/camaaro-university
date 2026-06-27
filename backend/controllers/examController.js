const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Course = require('../models/Course');
const User = require('../models/User');
const crypto = require('crypto');

// ─── Helper: shuffle array ──────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Helper: strip correct answers ─────────────────────────────
const stripAnswers = (questions) =>
  questions.map((q) => ({
    _id: q._id,
    questionText: q.questionText,
    type: q.type,
    options: q.options,
    marks: q.marks,
    order: q.order,
  }));

// ─── Helper: compute result scores ─────────────────────────────
const gradeSubmission = (exam, answers, studentAnswers) => {
  let marksObtained = 0;
  let needsManualGrading = false;
  const gradedAnswers = [];

  for (const question of exam.questions) {
    const qId = question._id.toString();
    const studentAnswer = (studentAnswers[qId] || '').trim();
    const correct = (question.correctAnswer || '').trim();
    const isManual = question.type === 'short_answer';

    let isCorrect = false;
    let marksAwarded = 0;

    if (isManual) {
      needsManualGrading = true;
      marksAwarded = 0;
    } else if (question.type === 'mcq') {
      isCorrect = studentAnswer !== '' && studentAnswer === correct;
      marksAwarded = isCorrect ? question.marks : 0;
    } else if (question.type === 'true_false') {
      isCorrect = studentAnswer.toLowerCase() === correct.toLowerCase();
      marksAwarded = isCorrect ? question.marks : 0;
    }

    marksObtained += marksAwarded;
    gradedAnswers.push({
      questionId: question._id,
      questionText: question.questionText,
      type: question.type,
      studentAnswer,
      correctAnswer: correct,
      isCorrect,
      isManualGrade: isManual,
      marksAwarded,
      maxMarks: question.marks,
    });
  }

  return { marksObtained, gradedAnswers, needsManualGrading };
};

// ─── Helper: issue certificate ──────────────────────────────────
const issueCertificate = async (studentId, examId, courseId, grade, percentage) => {
  try {
    const student = await User.findById(studentId);
    if (!student) return null;
    // Check if already issued for this exam
    const existing = student.certificates.find((c) => c.examId?.toString() === examId.toString());
    if (existing) return existing.verifyCode;
    const verifyCode = student.generateCertificate(examId, courseId, grade, percentage);
    await student.save();
    return verifyCode;
  } catch (e) {
    console.error('Certificate issue error:', e);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════
//  EXAM CRUD
// ═══════════════════════════════════════════════════════════════

exports.getExams = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher') filter.createdBy = req.user._id;
    if (req.user.role === 'student') {
      const user = await User.findById(req.user._id);
      filter.course = { $in: user.enrolledCourses || [] };
      filter.isPublished = true;
    }

    const exams = await Exam.find(filter)
      .populate('course', 'title code')
      .populate('createdBy', 'name email')
      .select('-questions.correctAnswer')
      .sort({ startTime: 1 });

    res.json({ success: true, count: exams.length, exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('course', 'title code')
      .populate('createdBy', 'name email')
      .sort({ startTime: -1 });
    res.json({ success: true, count: exams.length, exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getExamById = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id)
      .populate('course', 'title code')
      .populate('createdBy', 'name email');
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (req.user.role === 'student') {
      exam = exam.toObject();
      exam.questions = stripAnswers(exam.questions);
    }
    res.json({ success: true, exam });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Exam created', exam });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, message: 'Exam updated', exam });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);
    await Result.deleteMany({ exam: req.params.id });
    res.json({ success: true, message: 'Exam deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
//  EXAM TAKING
// ═══════════════════════════════════════════════════════════════

exports.startExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (!exam.isPublished) return res.status(403).json({ success: false, message: 'Exam is not published' });

    const now = new Date();
    if (now < new Date(exam.startTime)) return res.status(400).json({ success: false, message: 'Exam has not started yet' });
    if (now > new Date(exam.endTime)) return res.status(400).json({ success: false, message: 'Exam has ended' });

    let result = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (result && (result.status === 'submitted' || result.status === 'graded')) {
      return res.status(400).json({ success: false, message: 'You have already submitted this exam' });
    }

    if (!result) {
      result = await Result.create({
        student: req.user._id,
        exam: exam._id,
        course: exam.course,
        startedAt: now,
        status: 'in_progress',
      });
    }

    let questions = [...exam.questions];
    if (exam.shuffleQuestions) questions = shuffle(questions);
    const strippedQs = stripAnswers(questions);

    const deadline = new Date(result.startedAt.getTime() + exam.duration * 60000);

    res.json({
      success: true,
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        course: exam.course,
        questions: strippedQs,
      },
      result: {
        _id: result._id,
        startedAt: result.startedAt,
        deadline,
        draftAnswers: Object.fromEntries(result.draftAnswers || new Map()),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.autosave = async (req, res) => {
  try {
    const { answers, cameraViolations, tabSwitchCount } = req.body;
    const result = await Result.findOne({ student: req.user._id, exam: req.params.id });
    if (!result || result.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'No active exam session' });
    }
    if (answers) {
      for (const [k, v] of Object.entries(answers)) result.draftAnswers.set(k, v);
    }
    if (tabSwitchCount !== undefined) result.tabSwitchCount = tabSwitchCount;
    if (cameraViolations !== undefined) result.cameraViolations = cameraViolations;
    await result.save();
    res.json({ success: true, message: 'Autosaved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitExam = async (req, res) => {
  try {
    const { answers, tabSwitchCount, cameraViolations } = req.body;

    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const result = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (!result) return res.status(404).json({ success: false, message: 'You have not started this exam' });
    if (result.status === 'submitted' || result.status === 'graded') {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }

    const now = new Date();
    const deadline = new Date(result.startedAt.getTime() + exam.duration * 60000);
    const cutoff = new Date(Math.min(deadline.getTime(), new Date(exam.endTime).getTime()) + 30000);
    if (now > cutoff) {
      result.status = 'timed_out';
      await result.save();
      return res.status(400).json({ success: false, message: 'Submission time has expired' });
    }

    const finalAnswers = { ...Object.fromEntries(result.draftAnswers), ...answers };
    const { marksObtained, gradedAnswers, needsManualGrading } = gradeSubmission(exam, exam.questions, finalAnswers);

    result.answers = gradedAnswers;
    result.marksObtained = marksObtained;
    result.totalMarks = exam.totalMarks;
    result.percentage = exam.totalMarks > 0 ? parseFloat(((marksObtained / exam.totalMarks) * 100).toFixed(2)) : 0;
    // Provisional pass/fail for the manual-grading-pending case (no grade yet).
    // When grading is complete, computeGrade() below recalculates 'passed' from
    // the grade itself so the two values can never contradict each other.
    result.passed = result.marksObtained >= exam.passingMarks;
    result.needsManualGrading = needsManualGrading;
    result.status = needsManualGrading ? 'submitted' : 'graded';
    result.submittedAt = now;
    result.timeTakenMinutes = Math.round((now - result.startedAt) / 60000);
    if (tabSwitchCount !== undefined) result.tabSwitchCount = tabSwitchCount;
    if (cameraViolations !== undefined) result.cameraViolations = cameraViolations;

    if (!needsManualGrading) result.computeGrade();
    else result.grade = 'Pending';

    await result.save();

    // Issue certificate if passed and fully graded
    let certificateCode = null;
    if (result.passed && !needsManualGrading) {
      certificateCode = await issueCertificate(
        req.user._id, exam._id, exam.course, result.grade, result.percentage
      );
    }

    await result.populate([
      { path: 'student', select: 'name email studentId' },
      { path: 'exam', select: 'title totalMarks passingMarks' },
      { path: 'course', select: 'title code' },
    ]);

    res.json({
      success: true,
      message: needsManualGrading ? 'Submitted! Short answers will be graded by your teacher.' : 'Exam submitted and graded!',
      result,
      certificateCode,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
//  RESULTS
// ═══════════════════════════════════════════════════════════════

exports.getExamResults = async (req, res) => {
  try {
    const results = await Result.find({ exam: req.params.id })
      .populate('student', 'name email department studentId')
      .populate('exam', 'title totalMarks passingMarks duration')
      .sort({ percentage: -1 });

    const stats = {
      total: results.length,
      submitted: results.filter((r) => ['submitted', 'graded'].includes(r.status)).length,
      passed: results.filter((r) => r.passed).length,
      avgPercentage: results.length
        ? (results.reduce((s, r) => s + r.percentage, 0) / results.length).toFixed(1)
        : 0,
      avgTabSwitches: results.length
        ? (results.reduce((s, r) => s + (r.tabSwitchCount || 0), 0) / results.length).toFixed(1)
        : 0,
    };

    res.json({ success: true, count: results.length, stats, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyResult = async (req, res) => {
  try {
    const result = await Result.findOne({ student: req.user._id, exam: req.params.id })
      .populate('exam', 'title totalMarks passingMarks questions')
      .populate('course', 'title code');

    if (!result) return res.status(404).json({ success: false, message: 'No result found' });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyAllResults = async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id, status: { $in: ['submitted', 'graded'] } })
      .populate('exam', 'title type startTime totalMarks passingMarks duration')
      .populate('course', 'title code')
      .sort({ submittedAt: -1 });

    const graded = results.filter((r) => r.status === 'graded');
    const avgGpa = graded.length ? (graded.reduce((s, r) => s + r.gpa, 0) / graded.length).toFixed(2) : '0.00';

    res.json({ success: true, count: results.length, avgGpa, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTranscript = async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.user._id).select('name studentId email department createdAt');
    const results = await Result.find({ student: req.user._id, status: 'graded' })
      .populate('exam', 'title type totalMarks')
      .populate('course', 'title code credits')
      .sort({ createdAt: 1 });

    const courseMap = {};
    results.forEach((r) => {
      const cId = r.course?._id?.toString();
      if (!cId) return;
      if (!courseMap[cId]) courseMap[cId] = { course: r.course, results: [], totalGpa: 0, count: 0 };
      courseMap[cId].results.push({ examTitle: r.exam?.title, percentage: r.percentage, grade: r.grade, gpa: r.gpa });
      courseMap[cId].totalGpa += r.gpa;
      courseMap[cId].count += 1;
    });

    const courses = Object.values(courseMap).map((c) => ({
      ...c,
      avgGpa: (c.totalGpa / c.count).toFixed(2),
    }));

    const totalCredits = courses.reduce((s, c) => s + (c.course?.credits || 0), 0);
    const weightedGpa = totalCredits
      ? (courses.reduce((s, c) => s + parseFloat(c.avgGpa) * (c.course?.credits || 0), 0) / totalCredits).toFixed(2)
      : '0.00';

    res.json({ success: true, student, courses, cumulativeGpa: weightedGpa, totalCredits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.manualGrade = async (req, res) => {
  try {
    const { answerGrades, remarks } = req.body;
    const result = await Result.findById(req.params.resultId).populate('exam');
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    let extraMarks = 0;
    for (const grade of answerGrades || []) {
      const ans = result.answers.find((a) => a.questionId.toString() === grade.questionId);
      if (ans && ans.isManualGrade) {
        ans.marksAwarded = Math.min(grade.marksAwarded, ans.maxMarks);
        ans.isCorrect = grade.marksAwarded > 0;
        extraMarks += ans.marksAwarded;
      }
    }

    result.marksObtained += extraMarks;
    result.percentage = result.totalMarks > 0
      ? parseFloat(((result.marksObtained / result.totalMarks) * 100).toFixed(2))
      : 0;
    // computeGrade() sets both 'grade' and 'passed' together, so they can never disagree.
    result.computeGrade();
    result.status = 'graded';
    result.needsManualGrading = false;
    result.manuallyGradedBy = req.user._id;
    if (remarks) result.remarks = remarks;
    await result.save();

    // Issue certificate if passed
    if (result.passed) {
      await issueCertificate(
        result.student, result.exam._id, result.exam.course, result.grade, result.percentage
      );
    }

    res.json({ success: true, message: 'Result graded successfully', result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addResult = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const { studentId, marksObtained, remarks } = req.body;
    if (marksObtained > exam.totalMarks) {
      return res.status(400).json({ success: false, message: 'Marks cannot exceed total marks' });
    }

    const existing = await Result.findOne({ student: studentId, exam: exam._id });
    if (existing) return res.status(400).json({ success: false, message: 'Result already recorded' });

    const result = new Result({
      student: studentId,
      exam: exam._id,
      course: exam.course,
      marksObtained: marksObtained || 0,
      totalMarks: exam.totalMarks,
      status: 'graded',
      remarks: remarks || '',
      submittedAt: new Date(),
    });

    result.percentage = exam.totalMarks > 0
      ? parseFloat(((result.marksObtained / exam.totalMarks) * 100).toFixed(2))
      : 0;
    // computeGrade() sets both 'grade' and 'passed' together, so they can never disagree.
    result.computeGrade();

    await result.save();
    await result.populate('student', 'name email studentId');

    res.status(201).json({ success: true, message: 'Result recorded', result });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Result already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};
