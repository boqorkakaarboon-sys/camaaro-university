const express = require('express');
const router  = express.Router();
const Book    = require('../models/Book');
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const audit   = require('../utils/audit');

// GET all books
router.get('/', protect, async (req, res) => {
  try {
    const { search, category } = req.query;
    let filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { author: { $regex: search, $options: 'i' } }, { isbn: { $regex: search, $options: 'i' } }];
    const books = await Book.find(filter).select('-pdfFile -borrows -readingProgress -bookmarks').populate('addedBy', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: books.length, books });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single book (with PDF for reading)
router.get('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('addedBy', 'name');
    if (!book || !book.isActive) return res.status(404).json({ success: false, message: 'Book not found' });
    // Reading progress for this user
    const progress = book.readingProgress.find(p => p.student.toString() === req.user._id.toString());
    const bookmarks = book.bookmarks.filter(b => b.student.toString() === req.user._id.toString());
    const borrowed  = book.borrows.find(b => b.student.toString() === req.user._id.toString() && b.status === 'active');
    res.json({ success: true, book, progress: progress || null, bookmarks, isBorrowed: !!borrowed });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// CREATE book (admin/librarian)
router.post('/', protect, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const book = await Book.create({ ...req.body, addedBy: req.user._id, availableCopies: req.body.totalCopies || 1 });
    await audit(req, 'CREATE_BOOK', book.title);
    res.status(201).json({ success: true, message: 'Book added', book });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// UPDATE book
router.put('/:id', protect, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await audit(req, 'UPDATE_BOOK', book.title);
    res.json({ success: true, message: 'Book updated', book });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE book
router.delete('/:id', protect, authorize('admin', 'librarian'), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { isActive: false });
    await audit(req, 'DELETE_BOOK', book.title);
    res.json({ success: true, message: 'Book removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// BORROW book
router.post('/:id/borrow', protect, authorize('student'), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book.availableCopies < 1) return res.status(400).json({ success: false, message: 'No copies available' });
    const alreadyBorrowed = book.borrows.find(b => b.student.toString() === req.user._id.toString() && b.status === 'active');
    if (alreadyBorrowed) return res.status(400).json({ success: false, message: 'Already borrowed' });
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 14);
    book.borrows.push({ student: req.user._id, borrowedAt: new Date(), dueDate, status: 'active' });
    book.availableCopies -= 1;
    await book.save();
    // Notify student
    const user = await User.findById(req.user._id);
    user.pushNotification('library', 'Buug Amaah', `"${book.title}" waxaad u amaahday 14 maalmood. Due: ${dueDate.toLocaleDateString()}`);
    await user.save();
    res.json({ success: true, message: 'Book borrowed successfully', dueDate });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// RETURN book
router.post('/:id/return', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    const borrow = book.borrows.find(b => b.student.toString() === req.user._id.toString() && b.status === 'active');
    if (!borrow) return res.status(400).json({ success: false, message: 'No active borrow found' });
    borrow.returnedAt = new Date(); borrow.status = 'returned';
    book.availableCopies += 1;
    await book.save();
    res.json({ success: true, message: 'Book returned' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// UPDATE reading progress
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { currentPage, totalPages } = req.body;
    const book = await Book.findById(req.params.id);
    const idx = book.readingProgress.findIndex(p => p.student.toString() === req.user._id.toString());
    if (idx >= 0) { book.readingProgress[idx].currentPage = currentPage; book.readingProgress[idx].totalPages = totalPages; book.readingProgress[idx].lastRead = new Date(); }
    else book.readingProgress.push({ student: req.user._id, currentPage, totalPages, lastRead: new Date() });
    await book.save();
    res.json({ success: true, message: 'Progress saved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ADD bookmark
router.post('/:id/bookmark', protect, async (req, res) => {
  try {
    const { page, note } = req.body;
    const book = await Book.findById(req.params.id);
    book.bookmarks.push({ student: req.user._id, page, note, savedAt: new Date() });
    await book.save();
    res.json({ success: true, message: 'Bookmark saved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET categories
router.get('/meta/categories', protect, async (req, res) => {
  try {
    const cats = await Book.distinct('category', { isActive: true });
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET my borrowed books
router.get('/my/borrowed', protect, async (req, res) => {
  try {
    const books = await Book.find({ 'borrows.student': req.user._id, 'borrows.status': 'active' }).select('title author coverImage borrows');
    const result = books.map(b => {
      const borrow = b.borrows.find(br => br.student.toString() === req.user._id.toString() && br.status === 'active');
      return { _id: b._id, title: b.title, author: b.author, coverImage: b.coverImage, borrowedAt: borrow?.borrowedAt, dueDate: borrow?.dueDate };
    });
    res.json({ success: true, books: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
