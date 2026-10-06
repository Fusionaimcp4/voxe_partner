/**
 * Lightweight server for the investor portal.
 * - Serves static files from this directory (index.html, assets/, docs/).
 * - POST /api/friends-family-interest[.php]: appends to data/friends_family_investors.json.
 * - POST /api/growth-partner-interest[.php]: appends to data/growth_partner_applications.json.
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
const FF_DATA_FILE = path.join(DATA_DIR, 'friends_family_investors.json');
const GPP_DATA_FILE = path.join(DATA_DIR, 'growth_partner_applications.json');

app.use(express.json({ limit: '64kb' }));

// Do not expose submission JSON (PII) via static file serving.
app.use('/data', function (req, res) {
  res.status(403).json({ ok: false, error: 'Forbidden' });
});

app.use(express.static(ROOT, { index: 'index.html' }));

function ensureDataFile(filePath) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
}

function readSubmissions(filePath) {
  ensureDataFile(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeSubmissions(filePath, arr) {
  ensureDataFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), 'utf8');
}

function id() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 11);
}

function looksLikeEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function handleFriendsFamilyInterest(req, res) {
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
  if (typeof amountNum !== 'number' || isNaN(amountNum)) {
    return res.status(400).json({
      ok: false,
      error: 'A valid Purchase Amount (USD) is required'
    });
  }
  if (amountNum < 1000) {
    return res.status(400).json({
      ok: false,
      error: 'Minimum Purchase Amount per investor is $1,000.'
    });
  }
  if (amountNum > 5000) {
    return res.status(400).json({
      ok: false,
      error: 'Maximum Purchase Amount per investor is $5,000.'
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
    const list = readSubmissions(FF_DATA_FILE);
    list.push(record);
    writeSubmissions(FF_DATA_FILE, list);
  } catch (err) {
    console.error('[friends-family-interest] write error', err);
    return res.status(500).json({ ok: false, error: 'Failed to save submission' });
  }

  res.status(200).json({ ok: true, id: record.id });
}

function handleGrowthPartnerInterest(req, res) {
  const body = req.body || {};
  const full_name = (body.full_name || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const contribution = (body.contribution || '').toString().trim();

  if (!full_name) {
    return res.status(400).json({ ok: false, error: 'Full name is required' });
  }
  if (!email) {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }
  if (!looksLikeEmail(email)) {
    return res.status(400).json({ ok: false, error: 'A valid email address is required' });
  }
  if (!contribution) {
    return res.status(400).json({ ok: false, error: 'Growth contribution explanation is required' });
  }

  const record = {
    id: id(),
    full_name,
    email,
    phone: (body.phone || '').toString().trim() || null,
    contribution,
    experience_network: (body.experience_network || '').toString().trim() || null,
    notes: (body.notes || '').toString().trim() || null,
    submitted_at: new Date().toISOString()
  };

  try {
    const list = readSubmissions(GPP_DATA_FILE);
    list.push(record);
    writeSubmissions(GPP_DATA_FILE, list);
  } catch (err) {
    console.error('[growth-partner-interest] write error', err);
    return res.status(500).json({ ok: false, error: 'Failed to save submission' });
  }

  res.status(200).json({ ok: true, id: record.id });
}

app.post('/api/friends-family-interest', handleFriendsFamilyInterest);
app.post('/api/friends-family-interest.php', handleFriendsFamilyInterest);
app.post('/api/growth-partner-interest', handleGrowthPartnerInterest);
app.post('/api/growth-partner-interest.php', handleGrowthPartnerInterest);

app.listen(PORT, function () {
  console.log('[investor] Server at http://localhost:' + PORT);
});
