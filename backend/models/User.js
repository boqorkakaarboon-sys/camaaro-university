const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true, maxlength: 100 },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    password:   { type: String, required: true, minlength: 8, select: false },
    role:       { type: String, enum: ['admin', 'teacher', 'student', 'librarian'], default: 'student' },
    department: { type: String, trim: true, default: '' },
    phone:      { type: String, trim: true, default: '' },
    studentId:  { type: String, trim: true, default: '' },
    bio:        { type: String, trim: true, default: '', maxlength: 500 },
    avatar:     { type: String, default: '' }, // base64 or URL

    // Email Verification
    isEmailVerified:    { type: Boolean, default: false },
    emailVerifyToken:   { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },

    // Password Reset
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // 2FA
    twoFAEnabled: { type: Boolean, default: false },
    twoFACode:    { type: String, select: false },
    twoFAExpires: { type: Date, select: false },

    // Account
    isActive: { type: Boolean, default: true },

    // Notifications (last 50)
    notifications: [{
      type:      { type: String, enum: ['exam', 'result', 'library', 'course', 'system'], default: 'system' },
      title:     String,
      message:   String,
      link:      String,
      isRead:    { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }],

    // Certificates
    certificates: [{
      examId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
      courseId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      issuedAt:  { type: Date, default: Date.now },
      verifyCode: String,
      grade:     String,
      percentage: Number,
    }],

    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.methods.generateEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

userSchema.methods.generate2FACode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.twoFACode = crypto.createHash('sha256').update(code).digest('hex');
  this.twoFAExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

userSchema.methods.generateCertificate = function (examId, courseId, grade, percentage) {
  const verifyCode = 'CAMR-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  this.certificates.push({ examId, courseId, grade, percentage, verifyCode, issuedAt: new Date() });
  return verifyCode;
};

userSchema.methods.pushNotification = function (type, title, message, link = '') {
  this.notifications.unshift({ type, title, message, link, isRead: false, createdAt: new Date() });
  if (this.notifications.length > 50) this.notifications = this.notifications.slice(0, 50);
};

module.exports = mongoose.model('User', userSchema);
