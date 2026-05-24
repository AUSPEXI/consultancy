import type { Handler } from '@netlify/functions'

const HOST = process.env.DATABRICKS_HOST || ''
const TOKEN = process.env.DATABRICKS_TOKEN || ''

async function dbx(path: string, method: string) {
  if (!HOST || !TOKEN) throw new Error('Databricks host/token not configured')
  const res = await fetch(`${HOST}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${txt}`)
  try { return JSON.parse(txt) } catch { return {} }
}

const handler: Handler = async (event) => {
  try {
    const run_id = event.queryStringParameters?.run_id
    if (!run_id) return { statusCode: 400, body: 'run_id required' }

    const run = await dbx(`/api/2.1/jobs/runs/get?run_id=${encodeURIComponent(run_id)}`, 'GET')
    const state = run?.state?.life_cycle_state || run?.state?.result_state || 'UNKNOWN'
    // Results are expected to be written by the notebook to uc_volume://.../results.json
    // The UI/CI can pass uc_url on submit and compute that URL independently; here we just surface run state/cluster logs link.
    return { statusCode: 200, body: JSON.stringify({ ok: true, state, run }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


