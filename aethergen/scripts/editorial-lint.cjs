#!/usr/bin/env node
/*
  Editorial linter: scans blog HTML for informal or unprofessional terms.
  Exit non-zero with a concise report if any terms are found.
*/
const { execSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const ROOT = process.cwd()
const TARGET_DIR = join(ROOT, 'public', 'blog-html')

// High-signal informal terms/slang; split into whole-word vs substring to reduce false positives (e.g., 'mate' in 'climate')
const WHOLE_WORD_TERMS = [
  'brother', 'bros', 'bro', 'mate', 'buddy', 'dude', 'matey', 'banter'
]
const SUBSTRING_TERMS = [
  "y'all", "ya'll", "ain't", 'gonna', 'lol', 'haha', 'cheers',
  'Abra-cadabra', 'abracadabra', 'magic', 'magical', 'wizard', 'spellbinding'
]

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const IGNORE_FILES = new Set([
  // add any exceptions if needed
])

function listFiles() {
  try {
    const out = execSync(`git ls-files ${TARGET_DIR}`).toString().trim()
    return out ? out.split('\n') : []
  } catch (e) {
    // Fallback to simple glob via PowerShell/Unix environments not guaranteed; naive list
    try {
      const out = execSync(process.platform === 'win32'
        ? `dir /b ${TARGET_DIR}\\*.html`
        : `ls -1 ${TARGET_DIR}/*.html`).toString().trim()
      return out ? out.split(/\r?\n/).map(p => join(TARGET_DIR, p)) : []
    } catch {
      return []
    }
  }
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const hits = []
  for (const raw of WHOLE_WORD_TERMS) {
    const pattern = new RegExp(`\\b${escapeRegExp(raw)}\\b`, 'i')
    if (pattern.test(content)) hits.push(raw)
  }
  for (const raw of SUBSTRING_TERMS) {
    const pattern = new RegExp(escapeRegExp(raw), 'i')
    if (pattern.test(content)) hits.push(raw)
  }
  return hits
}

function main() {
  const files = listFiles().filter(f => f.endsWith('.html') && !IGNORE_FILES.has(f))
  const findings = []
  for (const fp of files) {
    const hits = scanFile(fp)
    if (hits.length) findings.push({ file: fp, terms: [...new Set(hits)] })
  }
  if (findings.length) {
    console.error('Editorial linter found informal terms:')
    for (const f of findings) {
      console.error(`- ${f.file}: ${f.terms.join(', ')}`)
    }
    console.error('\nTo fix: replace with professional phrasing or add a justified exception to IGNORE_FILES.')
    process.exit(2)
  }
  console.log('Editorial linter: no issues found.')
}

main()


