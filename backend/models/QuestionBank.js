const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  teacher:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  subject:    { type: String, trim: true, default: '' },
  type:       { type: String, enum: ['mcq','true_false','short_answer'], required: true },
  text:       { type: String, required: true, trim: true },
  options:    [String],
  answer:     { type: String, default: '' },
  points:     { type: Number, default: 1 },
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  tags:       [String],
}, { timestamps: true });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
