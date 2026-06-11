#!/usr/bin/env node
/**
 * CI helper: decode the FIREBASE_SERVICE_ACCOUNT_BASE64 secret into a service
 * account JSON file, tolerant of however the secret was stored.
 *
 * The secret has historically been stored inconsistently (raw JSON, base64,
 * even double-base64, sometimes with stray characters/whitespace/BOM).
 * This tries each interpretation and writes the first one that parses as a
 * valid service account, so the rules-deploy workflow doesn't break on secret
 * formatting.
 *
 * Usage:  SA_B64="$SECRET" OUT=/path/sa.json node scripts/ci-decode-sa.mjs
 */
import fs from 'node:fs';

const raw = process.env.SA_B64;
const out = process.env.OUT;
if (!raw) { console.error('❌ SA_B64 env is empty'); process.exit(1); }
if (!out) { console.error('❌ OUT env is not set'); process.exit(1); }

// Strip BOM and zero-width characters that copy-paste tools sometimes inject
// and that .trim() does not remove.
function stripInvisible(s) {
  return s
    .replace(/^﻿/, '')         // UTF-8 BOM
    .replace(/​/g, '')         // zero-width space
    .replace(/‌/g, '')         // zero-width non-joiner
    .replace(/‍/g, '')         // zero-width joiner
    .replace(/﻿/g, '')         // BOM anywhere
    .replace(/­/g, '')         // soft hyphen
    .trim();
}

const cleaned = stripInvisible(raw);

// Diagnostic (safe — first 40 chars of valid SA JSON is '{"type":"service_account"')
console.log(`ℹ️  Secret length after stripping: ${cleaned.length} chars`);
console.log(`ℹ️  First 40 chars: ${JSON.stringify(cleaned.slice(0, 40))}`);

const looksLikeSA = (o) => o && typeof o === 'object' && o.client_email && o.private_key;

// Each strategy returns { bytes, obj } or throws.
const strategies = [
  // 1. Secret IS the raw JSON.
  {
    label: 'raw JSON',
    fn: () => {
      const o = JSON.parse(cleaned);
      return { bytes: Buffer.from(cleaned, 'utf8'), obj: o };
    },
  },
  // 2. Secret is base64 of the JSON (Node's lenient decoder tolerates whitespace
  //    and a stray trailing char).
  {
    label: 'base64',
    fn: () => {
      const b = Buffer.from(cleaned, 'base64');
      const o = JSON.parse(b.toString('utf8'));
      return { bytes: b, obj: o };
    },
  },
  // 3. Secret is double-base64 (base64 of base64 of JSON).
  {
    label: 'double-base64',
    fn: () => {
      const once = Buffer.from(cleaned, 'base64').toString('utf8');
      const b = Buffer.from(once.trim(), 'base64');
      const o = JSON.parse(b.toString('utf8'));
      return { bytes: b, obj: o };
    },
  },
];

let result = null;
for (const { label, fn } of strategies) {
  try {
    const r = fn();
    if (looksLikeSA(r.obj)) { result = { ...r, how: label }; break; }
    console.log(`   Strategy "${label}" parsed JSON but missing client_email/private_key — skipping`);
  } catch (e) {
    console.log(`   Strategy "${label}" failed: ${e.message}`);
  }
}

if (!result) {
  console.error('❌ Could not parse FIREBASE_SERVICE_ACCOUNT_BASE64 as raw JSON, base64, or double-base64.');
  console.error('   Re-encode the service-account JSON with `base64 -w0` and update the secret.');
  process.exit(1);
}

fs.writeFileSync(out, result.bytes);
console.log(`✅ Service account decoded (${result.how}): ${result.obj.client_email}`);
