#!/usr/bin/env node
/**
 * CI helper: decode the FIREBASE_SERVICE_ACCOUNT_BASE64 secret into a service
 * account JSON file, tolerant of however the secret was stored.
 *
 * The secret has historically been stored inconsistently (raw JSON, base64,
 * even double-base64, sometimes with stray characters/whitespace). This tries
 * each interpretation and writes the first one that parses as a valid service
 * account, so the rules-deploy workflow doesn't break on secret formatting.
 *
 * Usage:  SA_B64="$SECRET" OUT=/path/sa.json node scripts/ci-decode-sa.mjs
 */
import fs from 'node:fs';

const raw = process.env.SA_B64;
const out = process.env.OUT;
if (!raw) { console.error('❌ SA_B64 env is empty'); process.exit(1); }
if (!out) { console.error('❌ OUT env is not set'); process.exit(1); }

const looksLikeSA = (o) => o && typeof o === 'object' && o.client_email && o.private_key;

// Each strategy returns { bytes, obj } or null.
const strategies = [
  // 1. Secret IS the raw JSON.
  () => {
    const t = raw.trim();
    const o = JSON.parse(t);
    return { bytes: Buffer.from(t, 'utf8'), obj: o };
  },
  // 2. Secret is base64 of the JSON (Node's lenient decoder tolerates whitespace
  //    and a stray trailing char).
  () => {
    const b = Buffer.from(raw, 'base64');
    const o = JSON.parse(b.toString('utf8'));
    return { bytes: b, obj: o };
  },
  // 3. Secret is double-base64 (base64 of base64 of JSON).
  () => {
    const once = Buffer.from(raw, 'base64').toString('utf8');
    const b = Buffer.from(once, 'base64');
    const o = JSON.parse(b.toString('utf8'));
    return { bytes: b, obj: o };
  },
];

let result = null;
const labels = ['raw JSON', 'base64', 'double-base64'];
for (let i = 0; i < strategies.length; i++) {
  try {
    const r = strategies[i]();
    if (looksLikeSA(r.obj)) { result = { ...r, how: labels[i] }; break; }
  } catch { /* try next */ }
}

if (!result) {
  console.error('❌ Could not parse FIREBASE_SERVICE_ACCOUNT_BASE64 as raw JSON, base64, or double-base64.');
  console.error('   Re-encode the service-account JSON with `base64 -w0` and update the secret.');
  process.exit(1);
}

fs.writeFileSync(out, result.bytes);
console.log(`OK service account (${result.how}): ${result.obj.client_email}`);
