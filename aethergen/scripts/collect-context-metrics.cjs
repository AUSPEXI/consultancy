#!/usr/bin/env node
// Read results.json (from UC Volume download) and emit invariance/counterfactual/context_stability metrics
const fs = require('fs')
const path = require('path')

const inFile = process.argv[2] || 'artifacts/results.json'
const outDir = process.argv[3] || 'artifacts/metrics'
fs.mkdirSync(outDir, { recursive: true })

function writeJSON(name, obj) {
  const p = path.join(outDir, name)
  fs.writeFileSync(p, JSON.stringify(obj, null, 2))
  console.log('Wrote', p)
}

try {
  const res = JSON.parse(fs.readFileSync(inFile, 'utf8'))
  const invariance = { gap_before: null, gap_after: null, improvement: null, notes: 'populate from training logs' }
  const counterfactual = { avg_shift: null, max_shift: null, tests: [] }
  const contextStability = { max_delta: res?.stability?.max_delta ?? null, cells: [] }
  writeJSON('invariance.json', invariance)
  writeJSON('counterfactual.json', counterfactual)
  writeJSON('context_stability.json', contextStability)
} catch (e) {
  console.error('Failed to read results:', e.message)
  process.exit(1)
}


