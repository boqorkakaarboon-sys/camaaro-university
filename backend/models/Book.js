const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  author:      { type: String, required: true, trim: true },
  isbn:        { type: String, trim: true, default: '' },
  category:    { type: String, trim: true, default: 'General' },
  description: { type: String, trim: true, default: '' },
  coverImage:  { type: String, default: '' },
  pdfFile:     { type: String, default: '' }, // base64 or file path
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  isActive:    { type: Boolean, default: true },
  addedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  borrows: [{
    student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    borrowedAt: { type: Date, default: Date.now },
    dueDate:    { type: Date },
    returnedAt: { type: Date, default: null },
    status:     { type: String, enum: ['active','returned','overdue'], default: 'active' },
  }],
  readingProgress: [{
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    currentPage: { type: Number, default: 1 },
    totalPages:  { type: Number, default: 0 },
    lastRead:    { type: Date, default: Date.now },
  }],
  bookmarks: [{
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    page:     Number,
    note:     String,
    savedAt:  { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
