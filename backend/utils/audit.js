const AuditLog = require('../models/AuditLog');

const audit = async (req, action, target = '', details = '') => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      action,
      target,
      details,
      ip: req.ip || req.headers['x-forwarded-for'] || '',
    });
  } catch (e) {
    // non-blocking
  }
};

module.exports = audit;
