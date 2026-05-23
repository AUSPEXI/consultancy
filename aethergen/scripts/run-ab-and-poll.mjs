import fs from 'node:fs'

const NETLIFY_BASE = process.env.NETLIFY_BASE || 'http://localhost:8888/.netlify/functions'

function loadEnv() {
  try {
    const txt = fs.readFileSync('.env','utf8')
    const out = {}
    for (const line of txt.split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue
      const i = line.indexOf('=')
      const k = line.slice(0,i).trim()
      const v = line.slice(i+1).trim()
      out[k] = v
    }
    return out
  } catch { return {} }
}

async function submitAb() {
  const env = { ...process.env, ...loadEnv() }
  const clusterId = (env.DATABRICKS_CLUSTER_ID || '').trim()
  if (!clusterId) throw new Error('Missing DATABRICKS_CLUSTER_ID in environment or .env')
  // Use a single-task job that calls the imported metrics notebook as the compare step
  const job_spec = {
    name: 'ab_compare_only',
    tasks: [
      {
        task_key: 'compare_only',
        existing_cluster_id: clusterId,
        notebook_task: {
          notebook_path: '/Shared/metrics/compute_metrics',
          base_parameters: {
            baseline_path: 'dbfs:/FileStore/aethergen/ab/baseline',
            context_path:  'dbfs:/FileStore/aethergen/ab/context',
            out_path:      'dbfs:/FileStore/aethergen/ab/out'
          }
        }
      }
    ]
  }
  const res = await fetch(`${NETLIFY_BASE}/ab-submit`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ job_spec })
  })
  const txt = await res.text()
  console.log('SUBMIT', res.status, txt)
  let runId = null
  try { runId = JSON.parse(txt)?.run_id || null } catch {}
  return runId
}

async function pollRun(runId) {
  const env = { ...process.env, ...loadEnv() }
  const host = (env.DATABRICKS_HOST || '').replace(/\/$/,'')
  const token = env.DATABRICKS_TOKEN || env.DATABRICKS_PAT
  if (!host || !token) {
    console.log('WARN Missing DATABRICKS_HOST or TOKEN; skipping poll')
    return
  }
  for (let i=0;i<24;i++) {
    const r = await fetch(`${host}/api/2.1/jobs/runs/get?run_id=${encodeURIComponent(runId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const t = await r.text()
    let j
    try { j = JSON.parse(t) } catch { console.log('RAW', t); break }
    const state = j?.state?.life_cycle_state
    const result = j?.state?.result_state
    console.log('POLL', i, state, result || '')
    if (['TERMINATED','INTERNAL_ERROR','SKIPPED'].includes(state) || ['SUCCESS','FAILED','TIMEDOUT','CANCELED'].includes(result||'')) {
      console.log('FINAL', JSON.stringify(j))
      break
    }
    await new Promise(r=>setTimeout(r,5000))
  }
}

;(async ()=>{
  const runId = await submitAb()
  if (!runId) return
  await pollRun(runId)
})().catch(err=>{ console.error(err); process.exit(1) })


