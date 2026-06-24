const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:    { type: Date, required: true },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:  { type: String, enum: ['present','absent','late','excused'], default: 'absent' },
    note:    { type: String, default: '' },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
