/**
 * Build script: reads invite passwords from .env / environment and writes
 * client-side SHA-256 hashes only (never the raw passwords).
 *
 * Investor (Friends & Family):
 *   INVESTOR_INVITE_PASS → assets/js/invite-config.js
 *   window.__INVITE_PASS_HASH__
 *
 * Growth Partner Program:
 *   GROWTH_PARTNER_INVITE_PASS → assets/js/growth-partner-invite-config.js
 *   window.__GROWTH_PARTNER_INVITE_PASS_HASH__
 *
 * Run: node scripts/inject-invite-pass.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const investorOutPath = path.join(rootDir, 'assets', 'js', 'invite-config.js');
const growthPartnerOutPath = path.join(rootDir, 'assets', 'js', 'growth-partner-invite-config.js');

function loadEnvFile() {
  const map = {};
  try {
    if (!fs.existsSync(envPath)) {
      return map;
    }
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const eq = trimmed.indexOf('=');
      if (eq <= 0) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      map[key] = value;
    }
  } catch (e) {
    console.error('Error reading .env:', e.message);
  }
  return map;
}

function resolvePass(envKey, fileMap) {
  const fromProcess = process.env[envKey];
  if (fromProcess !== undefined && fromProcess !== null && String(fromProcess).trim() !== '') {
    return String(fromProcess);
  }
  const fromFile = fileMap[envKey];
  if (fromFile !== undefined && fromFile !== null && String(fromFile).trim() !== '') {
    return String(fromFile);
  }
  return null;
}

function writeHashConfig(options) {
  const { outPath, envKey, globalName, missingComment } = options;
  const pass = resolvePass(envKey, loadEnvFile());
  let jsContent;

  if (!pass) {
    console.warn(
      '[invite] ' + envKey + ' not set in .env or environment. ' +
      path.basename(outPath) + ' will set hash to null (fail closed).'
    );
    jsContent =
      missingComment + '\n' +
      'window.' + globalName + ' = null;\n';
  } else {
    const hash = crypto.createHash('sha256').update(pass, 'utf8').digest('hex');
    jsContent =
      '// Hash of invite pass (set at build time). Do not edit.\n' +
      'window.' + globalName + ' = "' + hash + '";\n';
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, jsContent, 'utf8');
  console.log('[invite] ' + path.relative(rootDir, outPath).replace(/\\/g, '/') + ' written.');
}

writeHashConfig({
  outPath: investorOutPath,
  envKey: 'INVESTOR_INVITE_PASS',
  globalName: '__INVITE_PASS_HASH__',
  missingComment:
    '// Invite pass not configured at build time. Set INVESTOR_INVITE_PASS in .env and re-run scripts/inject-invite-pass.js'
});

writeHashConfig({
  outPath: growthPartnerOutPath,
  envKey: 'GROWTH_PARTNER_INVITE_PASS',
  globalName: '__GROWTH_PARTNER_INVITE_PASS_HASH__',
  missingComment:
    '// Growth Partner invite pass not configured at build time. Set GROWTH_PARTNER_INVITE_PASS in .env and re-run scripts/inject-invite-pass.js'
});
