#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.cwd();

function log(msg) { process.stdout.write(msg + '\n'); }
function fail(msg) { process.stderr.write(msg + '\n'); process.exit(1); }

// 1) Ensure sensitive paths are ignored
const gi = readFileSync(join(repo, '.gitignore'), 'utf8');
const required = ['.agekey', '.passphrase', 'unlocked/', 'secure/*.dec', 'docs/ip_manifest.json'];
for (const r of required) {
  if (!gi.includes(r)) fail(`IP check: .gitignore missing required entry: ${r}`);
}

// 2) Abort if any decrypted artifacts are staged/committed outside unlocked/
// Check staged files
const staged = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' }).split('\n').filter(Boolean);
const plaintextPatterns = [/\.pem$/i, /\.key$/i, /(^|\/)secure\//i];
for (const f of staged) {
  if (f.startsWith('unlocked/')) continue;
  if (plaintextPatterns.some((re) => re.test(f))) fail(`IP check: refusing to push plaintext-sensitive file: ${f}`);
}

// 3) Basic secret scan in staged content (customize patterns)
const secretRegexes = [
  /(API_KEY|SECRET|PRIVATE_KEY|SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)/i,
];

// ignore list for content scanning (avoid false positives from this script and safe files)
const ignoreContentScan = [
  /^scripts\/prepush-ip-check\.mjs$/i,
  /^\.husky\//i,
  /^public\/circuits\/verification_key\.json$/i
];

for (const f of staged) {
  if (ignoreContentScan.some((re) => re.test(f))) continue;
  try {
    const content = readFileSync(join(repo, f), 'utf8');
    if (secretRegexes.some((re) => re.test(content))) fail(`IP check: secret-like token found in ${f}`);
  } catch {}
}

// 2b) Block committing new public circuit artifacts to the repo (protect IP/build integrity)
const blockedPublicCircuitPatterns = [/(^|\/)public\/circuits\/.*\.(zkey|wasm)$/i];
for (const f of staged) {
  if (blockedPublicCircuitPatterns.some((re) => re.test(f))) {
    fail(`IP check: refusing to push circuit artifact in repo: ${f}. Serve at runtime (CDN/secure storage) or gate by env.`);
  }
}

// 4) Check SOPS config exists
if (!existsSync(join(repo, '.sops.yaml'))) fail('IP check: missing .sops.yaml at repo root');

log('IP pre-push check: OK');

