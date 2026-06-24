const express = require('express');
const router  = express.Router();
const Discussion = require('../models/Discussion');
const { protect, authorize } = require('../middleware/auth');

router.get('/:courseId', protect, async (req, res) => {
  try {
    const threads = await Discussion.find({ course: req.params.courseId })
      .populate('author','name role avatar')
      .populate('replies.author','name role avatar')
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json({ success: true, threads });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:courseId', protect, async (req, res) => {
  try {
    const thread = await Discussion.create({ course: req.params.courseId, author: req.user._id, title: req.body.title, content: req.body.content });
    await thread.populate('author','name role avatar');
    res.status(201).json({ success: true, thread });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:courseId/:threadId/reply', protect, async (req, res) => {
  try {
    const thread = await Discussion.findById(req.params.threadId);
    thread.replies.push({ author: req.user._id, content: req.body.content });
    await thread.save();
    await thread.populate('replies.author','name role avatar');
    res.json({ success: true, thread });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:courseId/:threadId', protect, async (req, res) => {
  try {
    const thread = await Discussion.findById(req.params.threadId);
    if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });
    await thread.deleteOne();
    res.json({ success: true, message: 'Thread deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:courseId/:threadId/pin', protect, authorize('admin','teacher'), async (req, res) => {
  try {
    const thread = await Discussion.findById(req.params.threadId);
    thread.isPinned = !thread.isPinned;
    await thread.save();
    res.json({ success: true, isPinned: thread.isPinned });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
