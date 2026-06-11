#!/usr/bin/env node
/**
 * Dashboard tool verification harness  (Phase 0 of docs/automation-roadmap.md)
 *
 * Calls each dashboard API route against a DEPLOYED site as a real test user and
 * runs correctness assertions — so a tool is proven correct BEFORE it earns a
 * cron slot. No tool gets automated until its row here is green.
 *
 * Auth: signs in with a test account's email/password via the Firebase Identity
 * Toolkit REST API (needs only the PUBLIC web API key — no service account), then
 * sends the resulting ID token as `Authorization: Bearer <token>` to each route.
 *
 * Usage:
 *   1. Copy scripts/verify-harness.env.example → scripts/verify-harness.env
 *      and fill it in (it is gitignored).
 *   2. node --env-file=scripts/verify-harness.env scripts/verify-harness.mjs
 *      (Node 20.6+ supports --env-file; otherwise export the vars yourself.)
 *
 * Optionally pass check names to run a subset:
 *   node ... scripts/verify-harness.mjs daily-audit cite-probe
 *
 * Exit code is non-zero if any check FAILs (WARN does not fail the run), so this
 * can gate CI later.
 */

const cfg = {
  baseUrl:    (process.env.HARNESS_BASE_URL || 'https://l8entspace.com').replace(/\/$/, ''),
  apiKey:     process.env.FIREBASE_API_KEY,
  email:      process.env.TEST_EMAIL,
  password:   process.env.TEST_PASSWORD,
  brand:      process.env.TEST_BRAND,
  domain:     process.env.TEST_DOMAIN,
  keywords:   (process.env.TEST_KEYWORDS || '').split(',').map(s => s.trim()).filter(Boolean),
  competitors:(process.env.TEST_COMPETITORS || '').split(',').map(s => s.trim()).filter(Boolean),
  query:      process.env.TEST_QUERY || '',
  // Custom-token auth (for Google-OAuth accounts that have no password):
  uid:            process.env.TEST_UID,
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
};

import crypto from 'node:crypto';

const PASS = 'PASS', WARN = 'WARN', FAIL = 'FAIL', SKIP = 'SKIP';

// ── small helpers ──────────────────────────────────────────────────────────
function requireEnv() {
  // Always need these.
  const base = ['apiKey', 'brand', 'domain'].filter(k => !cfg[k]);
  // Plus ONE auth method: custom-token (uid + service account) OR email/password.
  const hasCustom = cfg.uid && cfg.serviceAccount;
  const hasPassword = cfg.email && cfg.password;
  const labels = {
    apiKey: 'FIREBASE_API_KEY', brand: 'TEST_BRAND', domain: 'TEST_DOMAIN',
  };
  if (base.length || (!hasCustom && !hasPassword)) {
    if (base.length) console.error(`Missing required env: ${base.map(k => labels[k]).join(', ')}`);
    if (!hasCustom && !hasPassword) {
      console.error('Missing auth: provide EITHER');
      console.error('  • TEST_UID + FIREBASE_SERVICE_ACCOUNT_BASE64  (for Google sign-in accounts), OR');
      console.error('  • TEST_EMAIL + TEST_PASSWORD                  (for email/password accounts)');
    }
    console.error('See scripts/verify-harness.env.example');
    process.exit(2);
  }
}

const b64url = buf =>
  Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

// Build a Firebase custom token (a JWT signed by the service account key) and
// exchange it for an ID token. No firebase-admin dependency — just Node crypto.
function mintCustomToken(sa, uid) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
  };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(input), sa.private_key);
  return `${input}.${b64url(signature)}`;
}

// Decode the service-account secret tolerant of however it was stored
// (raw JSON / base64 / double-base64) and of BOM/zero-width chars from pasting.
function parseServiceAccount(raw) {
  const cleaned = String(raw)
    .replace(/^﻿/, '')
    .replace(/[​-‍﻿­]/g, '')
    .trim();
  const ok = (o) => o && typeof o === 'object' && o.client_email && o.private_key;
  const attempts = [
    () => JSON.parse(cleaned),
    () => JSON.parse(Buffer.from(cleaned, 'base64').toString('utf8')),
    () => JSON.parse(Buffer.from(Buffer.from(cleaned, 'base64').toString('utf8').trim(), 'base64').toString('utf8')),
  ];
  for (const fn of attempts) {
    try { const o = fn(); if (ok(o)) return o; } catch { /* next */ }
  }
  return null;
}

async function signInWithCustomToken() {
  const sa = parseServiceAccount(cfg.serviceAccount);
  if (!sa) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 could not be parsed as raw JSON, base64, or double-base64');
  }
  const customToken = mintCustomToken(sa, cfg.uid);
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok || !data.idToken) {
    throw new Error(`custom-token exchange failed: ${data.error?.message || res.status}`);
  }
  return data.idToken;
}

async function signInWithPassword() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cfg.email, password: cfg.password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok || !data.idToken) {
    throw new Error(`password sign-in failed: ${data.error?.message || res.status}`);
  }
  return data.idToken;
}

async function signIn() {
  // Prefer custom-token (works for Google-OAuth accounts) when available.
  if (cfg.uid && cfg.serviceAccount) return signInWithCustomToken();
  return signInWithPassword();
}

async function call(token, method, path, body) {
  const started = Date.now();
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const ms = Date.now() - started;
  let json = null, text = null;
  try { json = await res.json(); } catch { try { text = await res.text(); } catch {} }
  return { status: res.status, ok: res.ok, ms, json, text };
}

const num = v => (typeof v === 'number' && Number.isFinite(v));
const ok = (status, detail) => ({ status, detail });

// ── checks ────────────────────────────────────────────────────────────────
// Each check: { name, matrix, run(token) -> { status, detail } }
// `matrix` maps to the row label in docs/automation-roadmap.md Phase 0.
const checks = [
  {
    name: 'daily-audit',
    matrix: 'Daily Audit (SOV refresh)',
    async run(token) {
      const r = await call(token, 'POST', '/api/run-daily-audit', {
        userId: 'harness', brand: cfg.brand, domain: cfg.domain,
        competitors: cfg.competitors, keywords: cfg.keywords,
      });
      if (!r.ok) return ok(FAIL, `HTTP ${r.status}: ${JSON.stringify(r.json || r.text).slice(0, 300)}`);
      const m = r.json?.metrics || r.json;
      if (!m || !num(m.aSov)) return ok(FAIL, `no aSov in response: ${JSON.stringify(r.json).slice(0, 300)}`);
      // Fabrication guard: the route prompt forces a 5-15% baseline + "never zero".
      // Flag platform values that look like the synthetic floor rather than evidence.
      const plat = m.platforms || {};
      const allFloor = Object.values(plat).length > 0 &&
        Object.values(plat).every(v => num(v) && v >= 5 && v <= 15);
      if (allFloor) return ok(WARN,
        `aSov=${m.aSov}%, platforms=${JSON.stringify(plat)} — every platform sits in the ` +
        `5-15% synthetic baseline band (route forces "never zero"). Verify these are ` +
        `evidence-based, not the floor, before automating.`);
      return ok(PASS, `aSov=${m.aSov}%, platforms=${JSON.stringify(plat)}, ${r.ms}ms`);
    },
  },
  {
    name: 'cite-probe',
    matrix: 'Cite-Probe',
    async run(token) {
      const r = await call(token, 'POST', '/api/cite-probe', {
        brand: cfg.brand, domain: cfg.domain, keywords: cfg.keywords,
      });
      if (!r.ok) return ok(FAIL, `HTTP ${r.status}: ${JSON.stringify(r.json || r.text).slice(0, 300)}`);
      const d = r.json;
      if (!num(d?.citationRate) && !num(d?.platformRates && Object.keys(d.platformRates).length))
        return ok(WARN, `responded but no citationRate/platformRates: ${JSON.stringify(d).slice(0, 300)}`);
      const engines = d.platformRates ? Object.keys(d.platformRates).length : 0;
      return ok(PASS, `citationRate=${d.citationRate}%, ${engines} engines responded, ${r.ms}ms`);
    },
  },
  {
    name: 'geo-pulse',
    matrix: 'GEO-Pulse',
    async run(token) {
      const keyword = cfg.keywords[0] || cfg.brand;
      const r = await call(token, 'POST', '/api/geo-pulse', {
        keyword, brand: cfg.brand, domain: cfg.domain,
      });
      if (!r.ok) return ok(FAIL, `HTTP ${r.status}: ${JSON.stringify(r.json || r.text).slice(0, 300)}`);
      return ok(PASS, `responded ${r.ms}ms: ${JSON.stringify(r.json).slice(0, 200)}`);
    },
  },
  {
    name: 'simulate',
    matrix: 'Simulator',
    async run(token) {
      const query = cfg.query || `best ${cfg.keywords[0] || 'tools'} for businesses`;
      const r = await call(token, 'POST', '/api/simulate', { query, brand: cfg.brand });
      if (!r.ok) return ok(FAIL, `HTTP ${r.status}: ${JSON.stringify(r.json || r.text).slice(0, 300)}`);
      return ok(PASS, `query="${query}" → ${JSON.stringify(r.json).slice(0, 200)}, ${r.ms}ms`);
    },
  },
  {
    name: 'brand-monitor',
    matrix: 'Brand Monitor',
    async run(token) {
      const r = await call(token, 'POST', '/api/brand-monitor', { brand: cfg.brand });
      if (!r.ok) return ok(FAIL, `HTTP ${r.status}: ${JSON.stringify(r.json || r.text).slice(0, 300)}`);
      return ok(PASS, `responded ${r.ms}ms: ${JSON.stringify(r.json).slice(0, 200)}`);
    },
  },
  {
    name: 'cite-probe-history',
    matrix: 'Cite-Probe (history GET)',
    async run(token) {
      const r = await call(token, 'GET', '/api/cite-probe?limit=5');
      if (!r.ok) return ok(FAIL, `HTTP ${r.status}`);
      const n = Array.isArray(r.json) ? r.json.length : (r.json?.tests?.length ?? '?');
      return ok(PASS, `history returned ${n} rows, ${r.ms}ms`);
    },
  },
];

// ── runner ──────────────────────────────────────────────────────────────────
async function main() {
  requireEnv();
  const only = process.argv.slice(2);
  const selected = only.length ? checks.filter(c => only.includes(c.name)) : checks;
  if (!selected.length) {
    console.error(`No matching checks. Available: ${checks.map(c => c.name).join(', ')}`);
    process.exit(2);
  }

  console.log(`\n🔎 Verification harness → ${cfg.baseUrl}`);
  console.log(`   brand="${cfg.brand}" domain="${cfg.domain}" keywords=[${cfg.keywords.join(', ')}]\n`);

  let token;
  try {
    token = await signIn();
    const who = cfg.uid && cfg.serviceAccount ? `uid ${cfg.uid} (custom token)` : cfg.email;
    console.log(`✓ Signed in as ${who}\n`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(2);
  }

  const results = [];
  for (const c of selected) {
    process.stdout.write(`▶ ${c.name.padEnd(20)} `);
    let res;
    try {
      res = await c.run(token);
    } catch (e) {
      res = ok(FAIL, `threw: ${e.message}`);
    }
    results.push({ ...c, ...res });
    const icon = { PASS: '✅', WARN: '⚠️ ', FAIL: '❌', SKIP: '⏭️ ' }[res.status];
    console.log(`${icon} ${res.status}`);
    console.log(`    ${res.detail}\n`);
  }

  // Summary mapped to the Phase 0 matrix rows
  console.log('─'.repeat(70));
  const tally = { PASS: 0, WARN: 0, FAIL: 0, SKIP: 0 };
  for (const r of results) tally[r.status]++;
  console.log(`Phase 0 results:  ✅ ${tally.PASS}  ⚠️ ${tally.WARN}  ❌ ${tally.FAIL}  ⏭️ ${tally.SKIP}`);
  console.log('Matrix rows (copy status into docs/automation-roadmap.md):');
  for (const r of results) {
    const mark = { PASS: '☑', WARN: '◐', FAIL: '✗', SKIP: '☐' }[r.status];
    console.log(`  ${mark}  ${r.matrix}`);
  }
  console.log('─'.repeat(70) + '\n');

  process.exit(tally.FAIL > 0 ? 1 : 0);
}

main();
