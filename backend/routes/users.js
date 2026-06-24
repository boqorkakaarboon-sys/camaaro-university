const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;
    let filter = {};

    if (role && ['admin', 'teacher', 'student'].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/users/teachers
// @desc    Get all teachers
// @access  Private/Admin
router.get('/teachers', protect, authorize('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password').sort({ name: 1 });
    res.json({ success: true, count: teachers.length, teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/users/students
// @desc    Get all students
// @access  Private/Admin, Teacher
router.get('/students', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ name: 1 });
    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('enrolledCourses', 'title code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/users
// @desc    Create user (admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role, department, phone });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, department, phone, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/users/bulk-import
// @desc    Bulk import users from parsed CSV rows
// @access  Private/Admin
router.post('/bulk-import', protect, authorize('admin'), async (req, res) => {
  try {
    const { users } = req.body; // [{ name, email, password, role, department, phone, studentId }]
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: 'No users provided' });
    }
    const results = { created: 0, skipped: 0, errors: [] };
    for (const row of users) {
      try {
        if (!row.name || !row.email || !row.password) { results.skipped++; results.errors.push(`${row.email || 'unknown'}: missing fields`); continue; }
        const exists = await User.findOne({ email: row.email.toLowerCase() });
        if (exists) { results.skipped++; results.errors.push(`${row.email}: already exists`); continue; }
        await User.create({
          name: row.name, email: row.email, password: row.password,
          role: row.role || 'student', department: row.department || '',
          phone: row.phone || '', studentId: row.studentId || '', isEmailVerified: true,
        });
        results.created++;
      } catch (e) { results.skipped++; results.errors.push(`${row.email || 'unknown'}: ${e.message}`); }
    }
    res.json({ success: true, message: `${results.created} la abuuray, ${results.skipped} la boodey`, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
