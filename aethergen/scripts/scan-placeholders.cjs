#!/usr/bin/env node
const { execSync } = require('node:child_process')

const patterns = [
  'TODO', 'TBD', 'PLACEHOLDER', 'REPLACEME', 'DUMMY', 'FAKE', 'LOREM', 'FPO', 'SAMPLE', 'stub', 'coming soon', 'not implemented', 'lipsum'
]
const rg = `rg -n --no-heading -S "${patterns.join('|')}" -- .`
try {
  const out = execSync(rg, { encoding: 'utf8' })
  process.stdout.write(out)
} catch (e) {
  // ripgrep exits non-zero if no matches; that's fine
  const out = e.stdout?.toString?.() || ''
  process.stdout.write(out)
}


