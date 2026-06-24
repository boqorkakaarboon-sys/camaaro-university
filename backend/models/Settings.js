const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  universityName: { type: String, default: 'Camaaro University' },
  logo:            { type: String, default: '' },
  tagline:         { type: String, default: 'Empowering Minds, Shaping Futures' },
  contactEmail:    { type: String, default: '' },
  contactPhone:    { type: String, default: '' },
  address:         { type: String, default: '' },
  smtpEnabled:     { type: Boolean, default: false },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
