const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate:     { type: Date, required: true },
  maxScore:    { type: Number, default: 100 },
  submissions: [{
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileData:    { type: String, default: '' }, // base64
    fileName:    { type: String, default: '' },
    fileType:    { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    score:       { type: Number, default: null },
    feedback:    { type: String, default: '' },
    gradedAt:    { type: Date, default: null },
    status:      { type: String, enum: ['submitted','graded','late'], default: 'submitted' },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
