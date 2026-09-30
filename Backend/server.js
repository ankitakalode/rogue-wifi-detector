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

// Purane routes — waise hi rakhe hain, manual Postman testing ke liye
app.post('/api/scan-result', async (req, res) => {
  try {
    const { ssid, bssid, signal, encryption } = req.body;
    const status = ssid.toLowerCase().includes('free') ? 'suspicious' : 'genuine';

    const newResult = new ScanResult({ ssid, bssid, signal, encryption, status });
    await newResult.save();

    res.status(201).json({
      message: 'Scan result saved successfully',
      data: newResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const results = await ScanResult.find().sort({ timestamp: -1 });
    res.status(200).json({ alerts: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Har BSSID ka sirf sabse latest reading dega — dashboard ke liye
app.get('/api/alerts/latest', async (req, res) => {
  try {
    const results = await ScanResult.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
          _id: '$bssid',
          doc: { $first: '$$ROOT' }
      }},
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { timestamp: -1 } }
    ]);
    res.status(200).json({ alerts: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- NAYE ROUTES — SentinelAP EXE app ke liye ----
const SCANNER_TOKEN = 'sentinelap-dev-token';

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  res.status(200).json({
    access_token: SCANNER_TOKEN,
    refresh_token: SCANNER_TOKEN,
    expires_in: 86400,
    email: email || 'demo@sentinelap.local',
  });
});

app.post('/api/auth/refresh', (req, res) => {
  res.status(200).json({ access_token: SCANNER_TOKEN, expires_in: 86400 });
});

app.post('/api/scanner/register', (req, res) => {
  res.status(200).json({ scanner_id: 'scanner-' + Date.now() });
});

app.post('/api/scanner/session/start', (req, res) => {
  res.status(200).json({ session_id: 'session-' + Date.now() });
});

app.post('/api/scanner/session/stop', (req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/scanner/status', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/scanner/observations', async (req, res) => {
  try {
    const { networks } = req.body;
    if (!Array.isArray(networks)) {
      return res.status(400).json({ error: 'networks[] is required' });
    }

    let savedCount = 0;
    for (const net of networks) {
      const status = (net.is_rogue || net.threat_level === 'HIGH' || net.threat_level === 'CRITICAL')
        ? 'suspicious'
        : 'genuine';

      const result = new ScanResult({
        ssid: net.ssid,
        bssid: net.bssid,
        signal: net.signal_dbm ?? net.signal,
        encryption: net.encryption,
        status,
        final_score: net.final_score,
        threat_level: net.threat_level,
        is_rogue: !!net.is_rogue,
        dns_hijacked: !!net.dns_hijacked,
        ml_probability: net.ml_probability,
        flags: net.flags || [],
        recommendation: net.recommendation,
      });
      await result.save();
      savedCount++;
    }

    res.status(200).json({ batch_id: 'batch-' + Date.now(), saved: savedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chal raha hai port ${PORT} par`);
});