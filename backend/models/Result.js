const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  questionText: String,
  type: String,
  studentAnswer: { type: String, default: '' },
  correctAnswer: String,
  isCorrect: { type: Boolean, default: false },
  isManualGrade: { type: Boolean, default: false },
  marksAwarded: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 0 },
});

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

    startedAt: { type: Date },
    submittedAt: { type: Date },
    timeTakenMinutes: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded', 'timed_out'],
      default: 'in_progress',
    },

    draftAnswers: { type: Map, of: String, default: {} },
    answers: [answerSchema],

    marksObtained: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'Pending'], default: 'Pending' },
    gpa: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },

    needsManualGrading: { type: Boolean, default: false },
    manuallyGradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, default: '' },

    // Anti-cheat tracking
    tabSwitchCount: { type: Number, default: 0 },
    cameraViolations: { type: Number, default: 0 },  // NEW: camera violations count
    fullscreenExits: { type: Number, default: 0 },    // NEW: fullscreen exits
  },
  { timestamps: true }
);

resultSchema.methods.computeGrade = function () {
  const p = this.percentage;
  if (p >= 90) { this.grade = 'A+'; this.gpa = 4.0; }
  else if (p >= 80) { this.grade = 'A'; this.gpa = 4.0; }
  else if (p >= 70) { this.grade = 'B+'; this.gpa = 3.3; }
  else if (p >= 60) { this.grade = 'B'; this.gpa = 3.0; }
  else if (p >= 55) { this.grade = 'C+'; this.gpa = 2.3; }
  else if (p >= 50) { this.grade = 'C'; this.gpa = 2.0; }
  else if (p >= 40) { this.grade = 'D'; this.gpa = 1.0; }
  else { this.grade = 'F'; this.gpa = 0.0; }
  // Keep pass/fail in sync with the grade we just computed — a grade of 'F'
  // always means failed, anything else always means passed. This guarantees
  // 'passed' and 'grade' can never contradict each other (e.g. A+ but "Fail").
  this.passed = this.grade !== 'F';
};

resultSchema.index({ student: 1, exam: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
