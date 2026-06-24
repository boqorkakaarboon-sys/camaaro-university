const express = require('express');
const router  = express.Router();
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../utils/audit');

router.get('/', protect, async (req, res) => {
  try {
    const depts = await Department.find({ isActive: true }).populate('head', 'name email').sort({ name: 1 });
    res.json({ success: true, departments: depts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    await audit(req, 'CREATE_DEPARTMENT', dept.name);
    res.status(201).json({ success: true, message: 'Department created', department: dept });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'Department already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('head','name email');
    await audit(req, 'UPDATE_DEPARTMENT', dept.name);
    res.json({ success: true, message: 'Department updated', department: dept });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false });
    await audit(req, 'DELETE_DEPARTMENT', dept?.name || '');
    res.json({ success: true, message: 'Department removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
