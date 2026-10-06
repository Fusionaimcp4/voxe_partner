/**
 * Lightweight server for the investor portal.
 * - Serves static files from this directory (index.html, assets/, docs/).
 * - POST /api/friends-family-interest: appends JSON submissions to data/friends_family_investors.json.
 *
 * Run: npm start  (or node server.js)
 * Default port: 3333 (set PORT env to override).
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3333;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'friends_family_investors.json');

app.use(express.json({ limit: '64kb' }));
app.use(express.static(ROOT, { index: 'index.html' }));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readSubmissions() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeSubmissions(arr) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

function id() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 11);
}

app.post('/api/friends-family-interest', function (req, res) {
  const body = req.body || {};
  const full_name = (body.full_name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const location = (body.location || '').toString().trim();
  const amount_usd = body.amount_usd;
  const risk_acknowledgment = !!body.risk_acknowledgment;

  if (!full_name || !email || !location) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields: full_name, email, location'
    });
  }
  if (!risk_acknowledgment) {
    return res.status(400).json({
      ok: false,
      error: 'Risk acknowledgment is required'
    });
  }
  if (amount_usd === undefined || amount_usd === null || amount_usd === '') {
    return res.status(400).json({
      ok: false,
      error: 'Approximate amount (USD) is required'
    });
  }

  const amountNum = typeof amount_usd === 'number' ? amount_usd : parseFloat(String(amount_usd).replace(/[^\d.-]/g, ''));
  if (typeof amountNum === 'number' && !isNaN(amountNum) && amountNum > 5000) {
    return res.status(400).json({
      ok: false,
      error: 'Maximum amount per investor is $5,000.'
    });
  }
  const record = {
    id: id(),
    full_name,
    email,
    phone: (body.phone || '').toString().trim() || undefined,
    location,
    amount_usd: typeof amountNum === 'number' && !isNaN(amountNum) ? amountNum : String(amount_usd).trim(),
    notes: (body.notes || '').toString().trim() || undefined,
    submitted_at: new Date().toISOString()
  };

  try {
    const list = readSubmissions();
    list.push(record);
    writeSubmissions(list);
  } catch (err) {
    console.error('[friends-family-interest] write error', err);
    return res.status(500).json({ ok: false, error: 'Failed to save submission' });
  }

  res.status(200).json({ ok: true, id: record.id });
});

app.listen(PORT, function () {
  console.log('[investor] Server at http://localhost:' + PORT);
});
