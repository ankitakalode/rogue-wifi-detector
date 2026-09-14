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
  }
});

module.exports = mongoose.model('ScanResult', scanResultSchema);