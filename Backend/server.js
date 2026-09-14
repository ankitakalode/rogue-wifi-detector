const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const ScanResult = require('./models/ScanResult');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB se connect ho gaya!'))
  .catch((err) => console.error('MongoDB connection me error:', err));

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// API endpoint — scan result receive karne ke liye
app.post('/api/scan-result', async (req, res) => {
  try {
    const { ssid, bssid, signal, encryption } = req.body;

    const status = ssid.toLowerCase().includes('free') ? 'suspicious' : 'genuine';

    const newResult = new ScanResult({
      ssid,
      bssid,
      signal,
      encryption,
      status
    });

    await newResult.save();

    res.status(201).json({
      message: 'Scan result saved successfully',
      data: newResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint — saare saved results wapas dene ke liye
app.get('/api/alerts', async (req, res) => {
  try {
    const results = await ScanResult.find().sort({ timestamp: -1 });
    res.status(200).json({ alerts: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par`);
});