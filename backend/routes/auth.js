const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmail, templates } = require('../utils/email');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
const isStrong = (p) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/.test(p);

const safeUser = (u) => ({
  _id: u._id, name: u.name, email: u.email, role: u.role,
  department: u.department, phone: u.phone, studentId: u.studentId,
  bio: u.bio, avatar: u.avatar, isEmailVerified: u.isEmailVerified,
  twoFAEnabled: u.twoFAEnabled,
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, department, phone, studentId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Required fields missing' });
    if (password !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match' });
    if (!isStrong(password)) return res.status(400).json({ success: false, message: 'Password too weak (min 8 chars, uppercase, lowercase, number, special char)' });
    if ((role === 'student' || !role) && !studentId) return res.status(400).json({ success: false, message: 'Student ID required' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ success: false, message: 'Email already registered' });
    if (studentId && await User.findOne({ studentId })) return res.status(400).json({ success: false, message: 'Student ID already in use' });
    const user = await User.create({ name, email, password, role: role || 'student', department: department || '', phone: phone || '', studentId: studentId || '', isEmailVerified: true });
    res.status(201).json({ success: true, message: 'Registration successful', token: genToken(user._id), user: safeUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Email already registered' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// LOGIN (with optional 2FA)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +twoFACode +twoFAExpires');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid credentials or account deactivated' });
    if (!await user.comparePassword(password)) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.twoFAEnabled) {
      const code = user.generate2FACode();
      await user.save();
      const tmpl = templates.twoFA(user.name, code);
      await sendEmail({ to: user.email, ...tmpl });
      return res.json({ success: true, requires2FA: true, userId: user._id, message: '2FA code sent to email' });
    }
    res.json({ success: true, token: genToken(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// VERIFY 2FA
router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId).select('+twoFACode +twoFAExpires');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    if (user.twoFACode !== hashed || user.twoFAExpires < Date.now()) return res.status(400).json({ success: false, message: 'Invalid or expired code' });
    user.twoFACode = undefined; user.twoFAExpires = undefined;
    await user.save();
    res.json({ success: true, token: genToken(user._id), user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.json({ success: true, message: 'If email exists, reset link sent' });
    const token = user.generatePasswordResetToken();
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    const tmpl = templates.passwordReset(user.name, resetUrl);
    await sendEmail({ to: user.email, ...tmpl });
    res.json({ success: true, message: 'Password reset link sent', resetUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } }).select('+passwordResetToken +passwordResetExpires');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    if (!isStrong(req.body.password)) return res.status(400).json({ success: false, message: 'Password too weak' });
    user.password = req.body.password;
    user.passwordResetToken = undefined; user.passwordResetExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// TOGGLE 2FA
router.put('/toggle-2fa', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.twoFAEnabled = !user.twoFAEnabled;
    await user.save();
    res.json({ success: true, twoFAEnabled: user.twoFAEnabled, message: `2FA ${user.twoFAEnabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ME
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('enrolledCourses', 'title code');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE PROFILE
router.put('/updateprofile', protect, async (req, res) => {
  try {
    const { name, department, phone, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, department, phone, bio, avatar }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// NOTIFICATIONS
router.get('/notifications', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user.notifications || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'notifications.$[].isRead': true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET MY CERTIFICATES
router.get('/my-certificates', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('certificates.examId', 'title type')
      .populate('certificates.courseId', 'title code');
    const certificates = (user.certificates || []).map(c => ({ ...c.toObject(), studentName: user.name }));
    res.json({ success: true, certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// VERIFY CERTIFICATE
router.get('/verify-certificate/:code', async (req, res) => {
  try {
    const user = await User.findOne({ 'certificates.verifyCode': req.params.code })
      .populate('certificates.examId', 'title type')
      .populate('certificates.courseId', 'title code');
    if (!user) return res.status(404).json({ success: false, message: 'Certificate not found' });
    const cert = user.certificates.find((c) => c.verifyCode === req.params.code);
    res.json({ success: true, certificate: { studentName: user.name, studentId: user.studentId, email: user.email, department: user.department, examTitle: cert.examId?.title || 'N/A', courseTitle: cert.courseId?.title || 'N/A', courseCode: cert.courseId?.code || 'N/A', grade: cert.grade, percentage: cert.percentage, issuedAt: cert.issuedAt, verifyCode: cert.verifyCode, isValid: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
