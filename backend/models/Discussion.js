const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const discussionSchema = new mongoose.Schema({
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true, trim: true },
  content:  { type: String, required: true, trim: true },
  replies:  [replySchema],
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Discussion', discussionSchema);
