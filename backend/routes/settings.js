const express = require('express');
const router  = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../utils/audit');

const getOrCreate = async () => {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
};

// Public — anyone can read basic university info (for login page branding etc.)
router.get('/', async (req, res) => {
  try {
    const s = await getOrCreate();
    res.json({ success: true, settings: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const s = await getOrCreate();
    Object.assign(s, req.body);
    await s.save();
    await audit(req, 'UPDATE_SETTINGS', 'System Settings');
    res.json({ success: true, message: 'Settings updated', settings: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
