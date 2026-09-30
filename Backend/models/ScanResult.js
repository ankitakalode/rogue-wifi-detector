const mongoose = require('mongoose');

const scanResultSchema = new mongoose.Schema({
  ssid: {
    type: String,
    required: true
  },
  bssid: {
    type: String,
    required: true
  },
  signal: {
    type: Number
  },
  encryption: {
    type: String
  },
  status: {
    type: String,
    enum: ['genuine', 'suspicious'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  final_score: { type: Number },
  threat_level: { type: String },
  is_rogue: { type: Boolean },
  dns_hijacked: { type: Boolean },
  ml_probability: { type: Number },
  flags: [{ type: String }],
  recommendation: { type: String }
});

module.exports = mongoose.model('ScanResult', scanResultSchema);