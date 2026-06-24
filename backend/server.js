require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/courses',      require('./routes/courses'));
app.use('/api/exams',        require('./routes/exams'));
app.use('/api/results',      require('./routes/results'));
app.use('/api/library',      require('./routes/library'));
app.use('/api/attendance',   require('./routes/attendance'));
app.use('/api/assignments',  require('./routes/assignments'));
app.use('/api/discussions',  require('./routes/discussions'));
app.use('/api/questionbank', require('./routes/questionbank'));
app.use('/api/analytics',    require('./routes/analytics'));
app.use('/api/ai',           require('./routes/ai'));
app.use('/api/departments',  require('./routes/departments'));
app.use('/api/settings',     require('./routes/settings'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Camaaro University API v2.0', timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' }); });

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    const User = require('./models/User');
    if (!await User.findOne({ role: 'admin' })) {
      await User.create({ name: 'Super Admin', email: 'admin@camaaro.edu', password: 'Admin@123', role: 'admin', department: 'Administration', isEmailVerified: true });
      console.log('🌱 Admin seeded: admin@camaaro.edu / Admin@123');
    }
    app.listen(PORT, () => console.log(`🚀 Camaaro University API v2.0 running on http://localhost:${PORT}`));
  })
  .catch((err) => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });
