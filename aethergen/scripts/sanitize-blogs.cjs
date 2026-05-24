#!/usr/bin/env node
/*
  Sanitize blog HTML files by removing phrases like:
  
    "live as of September 1, 2025"

  including variants like "All features are live as of ...", "are live as of ...",
  with optional leading comma/dash and trailing period.
*/

const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(process.cwd(), 'public', 'blog-html');

/** @type {RegExp[]} */
const patterns = [
  /\s*[,–—-]?\s*(?:all\s+)?live as of\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\.?/gi,
  /\s*are\s+live as of\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\.?/gi,
  /\s*All\s+features\s+are\s+live as of\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\.?/gi,
];

function sanitizeText(text) {
  let out = text;
  for (const re of patterns) out = out.replace(re, '');
  // Clean up double punctuation/spacing left by removals
  out = out.replace(/\s+\./g, '.');
  out = out.replace(/\.(\s*\.)+/g, '.');
  out = out.replace(/\s{2,}/g, ' ');
  out = out.replace(/\s+,/g, ',');
  // Trim spaces before closing tags/newlines
  out = out.replace(/\s+\n/g, '\n');
  return out;
}

function run() {
  if (!fs.existsSync(targetDir)) {
    console.error(`Directory not found: ${targetDir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(targetDir).filter(f => f.toLowerCase().endsWith('.html'));
  let changed = 0;
  let totalMatches = 0;
  for (const file of files) {
    const full = path.join(targetDir, file);
    const orig = fs.readFileSync(full, 'utf8');
    let matches = 0;
    for (const re of patterns) {
      const m = orig.match(re);
      if (m) matches += m.length;
    }
    if (matches > 0) {
      const updated = sanitizeText(orig);
      if (updated !== orig) {
        fs.writeFileSync(full, updated, 'utf8');
        changed += 1;
        totalMatches += matches;
        console.log(`Sanitized ${file} (removed ${matches})`);
      }
    }
  }
  console.log(`Done. Updated ${changed} file(s), removed ${totalMatches} phrase(s).`);
}

run();


