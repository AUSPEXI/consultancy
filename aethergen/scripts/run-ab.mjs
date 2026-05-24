const BASE = process.env.NETLIFY_BASE || 'http://localhost:8888/.netlify/functions'

async function run() {
  const baseline = 'dbfs:/FileStore/aethergen/ab/baseline'
  const context  = 'dbfs:/FileStore/aethergen/ab/context'
  const out      = 'dbfs:/FileStore/aethergen/ab/out'
  const submit = await fetch(`${BASE}/ab-submit`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ baseline_path: baseline, context_path: context, out_path: out })
  })
  const sTxt = await submit.text()
  console.log('SUBMIT', submit.status, sTxt)
  const { run_id } = JSON.parse(sTxt)
  if (!run_id) return
  // Quick poll via Databricks API proxy path if available later; for now just print the ID
}

run().catch(err => { console.error(err); process.exit(1) })


