import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const STRICT_TARGETS = [ // fail build if found
  'public/blog-html',
  'src/pages',
  'src/content',
]
const WARN_TARGETS = [ // warn only (internal code)
  'src',
  'netlify/functions',
  'scripts'
]

// Sensitive phrases/identifiers we want to guard in public artifacts
const SENSITIVE = [
  /\bResidual Bank\b/i,
  /\bNoise Recycler\b/i,
  /negative learning masks?/i,
  /quantization[- ]noise scheduling/i,
  /per[- ]segment thresholds?/i,
  /coverage[- ]clamp/i,
  /information[- ]sufficiency gate/i,
  /AethergenCradle/i,
  /elastic[- ]energy policy surfaces?/i,
  /8D manifold context embeddings?/i,
  /ISR gating/i,
]

let strictViolations = []
let warnViolations = []

function scanFile(file, bucket) {
  const content = fs.readFileSync(file, 'utf8')
  for (const rx of SENSITIVE) {
    if (rx.test(content)) bucket.push({ file, rx: rx.toString() })
  }
}

function walk(dir, bucket) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) walk(p, bucket)
    else if (/\.(html|md|mdx|tsx|ts|js|mjs)$/i.test(p)) scanFile(p, bucket)
  }
}

for (const t of STRICT_TARGETS) {
  const p = path.join(ROOT, t)
  if (fs.existsSync(p)) walk(p, strictViolations)
}

for (const t of WARN_TARGETS) {
  const p = path.join(ROOT, t)
  if (fs.existsSync(p)) walk(p, warnViolations)
}

if (strictViolations.length) {
  console.error('IP Safety Guard (STRICT) found potential disclosures:')
  for (const v of strictViolations) console.error(` - ${v.file} :: ${v.rx}`)
  process.exitCode = 1
}
if (!strictViolations.length) {
  console.log('IP Safety Guard (STRICT): no sensitive phrases found in public artifacts.')
}
if (warnViolations.length) {
  console.warn('IP Safety Guard (WARN): sensitive phrases present in internal files:')
  for (const v of warnViolations) console.warn(` - ${v.file} :: ${v.rx}`)
}


