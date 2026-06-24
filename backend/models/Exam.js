const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, default: '' },
  marks: { type: Number, required: true, min: 1, default: 1 },
  order: { type: Number, default: 0 },
});

const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Exam title is required'], trim: true },
    description: { type: String, default: '', trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['midterm', 'final', 'quiz', 'assignment'], default: 'quiz' },
    startTime: { type: Date, required: [true, 'Start time is required'] },
    endTime: { type: Date, required: [true, 'End time is required'] },
    duration: { type: Number, required: [true, 'Duration in minutes is required'], min: 1 },
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, required: [true, 'Passing marks are required'] },
    isPublished: { type: Boolean, default: false },
    shuffleQuestions: { type: Boolean, default: false },
    questions: [questionSchema],
  },
  { timestamps: true }
);

examSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((s, q) => s + (q.marks || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Exam', examSchema);
