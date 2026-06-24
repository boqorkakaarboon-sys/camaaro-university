const express = require('express');
const router  = express.Router();
const QB      = require('../models/QuestionBank');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const { type, subject, difficulty } = req.query;
    let filter = {};
    if (req.user.role === 'teacher') filter.teacher = req.user._id;
    if (type) filter.type = type;
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (difficulty) filter.difficulty = difficulty;
    const questions = await QB.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const q = await QB.create({ ...req.body, teacher: req.user._id });
    res.status(201).json({ success: true, question: q });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/bulk', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const questions = req.body.questions.map(q => ({ ...q, teacher: req.user._id }));
    const created = await QB.insertMany(questions);
    res.status(201).json({ success: true, count: created.length, questions: created });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    await QB.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
