import fs from 'node:fs'

const NETLIFY_BASE = process.env.NETLIFY_BASE || 'http://localhost:8888/.netlify/functions'
const RESULTS_PATH = process.env.RESULTS_PATH || process.argv[2] || 'dbfs:/FileStore/aethergen/ab/out/results.json'

async function main() {
  const gates = JSON.parse(fs.readFileSync('public/context-gates.json','utf8'))
  const res = await fetch(`${NETLIFY_BASE}/acceptance-publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ results_path: RESULTS_PATH, gates })
  })
  const txt = await res.text()
  console.log('ACCEPT', res.status, txt)
}

main().catch(err => { console.error(err); process.exit(1) })


