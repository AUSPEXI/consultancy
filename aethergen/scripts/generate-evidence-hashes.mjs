import fs from 'fs';
import crypto from 'crypto';

function sha256(obj) {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return crypto.createHash('sha256').update(json).digest('hex');
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const evidencePath = 'public/evidence.json';
const whitepaperRef = { url: '/whitepaper' };
const facts = readJson('public/brand.json');
const existing = readJson(evidencePath) || { claims: [], version: '1.0' };

const baseClaims = [
  {
    id: 'billion-row-demo',
    description: 'Generated 1 billion synthetic rows (demo environment)',
    reference: 'https://auspexi.com/whitepaper'
  },
  {
    id: 'compliance',
    description: 'Designed to support GDPR/CCPA; ISO 27001 alignment in progress',
    reference: 'https://auspexi.com/ai'
  }
];

const claims = baseClaims.map((c) => ({
  ...c,
  schemaHash: `sha256:${sha256({ ...c, whitepaperRef, factsVersion: facts?.version })}`,
  lastUpdated: new Date().toISOString().slice(0, 10)
}));

const out = { ...existing, claims };
fs.writeFileSync(evidencePath, JSON.stringify(out, null, 2));
console.log('Updated evidence.json with hashes.');



