const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { department, search } = req.query;
    let filter = {};

    if (department) filter.department = { $regex: department, $options: 'i' };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Students see only their enrolled courses or active courses
    if (req.user.role === 'student') {
      filter.isActive = true;
    }

    // Teachers see only their assigned courses
    if (req.user.role === 'teacher') {
      filter.teacher = req.user._id;
    }

    const courses = await Course.find(filter)
      .populate('teacher', 'name email department')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/courses/all
// @desc    Get ALL courses for admin
// @access  Private/Admin
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: courses.length, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email department')
      .populate('students', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/courses
// @desc    Create course
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, code, description, credits, department, teacher, maxStudents, schedule } = req.body;

    const existingCourse = await Course.findOne({ code: code.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({ success: false, message: 'Course code already exists' });
    }

    const course = await Course.create({
      title,
      code,
      description,
      credits,
      department,
      teacher: teacher || null,
      maxStudents,
      schedule,
    });

    await course.populate('teacher', 'name email');

    res.status(201).json({ success: true, message: 'Course created successfully', course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('teacher', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, message: 'Course updated', course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/courses/:id/assign-teacher
// @desc    Assign teacher to course
// @access  Private/Admin
router.put('/:id/assign-teacher', protect, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (teacherId) {
      const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { teacher: teacherId || null },
      { new: true }
    ).populate('teacher', 'name email');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, message: teacherId ? 'Teacher assigned successfully' : 'Teacher unassigned', course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/courses/:id/enroll
// @desc    Enroll student in course
// @access  Private/Admin
router.put('/:id/enroll', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.students.includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student already enrolled' });
    }

    if (course.students.length >= course.maxStudents) {
      return res.status(400).json({ success: false, message: 'Course is full' });
    }

    course.students.push(studentId);
    await course.save();

    await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: course._id } });

    res.json({ success: true, message: 'Student enrolled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/courses/:id/materials
// @desc    Get course materials
// @access  Private
router.get('/:id/materials', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('materials.uploadedBy', 'name');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, materials: course.materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/courses/:id/materials
// @desc    Upload course material
// @access  Private/Admin,Teacher
router.post('/:id/materials', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { title, fileData, fileName, fileType } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    course.materials.push({ title, fileData, fileName, fileType, uploadedBy: req.user._id, uploadedAt: new Date() });
    await course.save();
    res.status(201).json({ success: true, message: 'Material uploaded', materials: course.materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/courses/:id/materials/:materialId
// @desc    Delete course material
// @access  Private/Admin,Teacher
router.delete('/:id/materials/:materialId', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    course.materials = course.materials.filter(m => m._id.toString() !== req.params.materialId);
    await course.save();
    res.json({ success: true, message: 'Material deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
