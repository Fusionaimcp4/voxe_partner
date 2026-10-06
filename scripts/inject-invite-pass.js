/**
 * Build script: reads INVESTOR_INVITE_PASS from .env and writes
 * assets/js/invite-config.js with a SHA-256 hash of the pass.
 * The raw pass is never written to the output; only the hash is used for comparison.
 *
 * Run from investor folder: node scripts/inject-invite-pass.js
 * Or from repo root: node investor/scripts/inject-invite-pass.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const investorDir = path.resolve(__dirname, '..');
const envPath = path.join(investorDir, '.env');
const outPath = path.join(investorDir, 'assets', 'js', 'invite-config.js');

function loadEnv() {
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('INVESTOR_INVITE_PASS=')) {
          const value = trimmed.slice('INVESTOR_INVITE_PASS='.length).trim();
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
          }
          return value;
        }
      }
    }
  } catch (e) {
    console.error('Error reading .env:', e.message);
  }
  return null;
}

const pass = process.env.INVESTOR_INVITE_PASS || loadEnv();
let jsContent;

if (!pass || pass === '') {
  console.warn('[investor] INVESTOR_INVITE_PASS not set in .env or env. invite-config.js will set hash to null; gated section will show configuration error.');
  jsContent = `// Invite pass not configured at build time. Set INVESTOR_INVITE_PASS in investor/.env and re-run scripts/inject-invite-pass.js
window.__INVITE_PASS_HASH__ = null;
`;
} else {
  const hash = crypto.createHash('sha256').update(pass, 'utf8').digest('hex');
  jsContent = `// Hash of invite pass (set at build time). Do not edit.
window.__INVITE_PASS_HASH__ = "${hash}";
`;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, jsContent, 'utf8');
console.log('[investor] invite-config.js written.');
