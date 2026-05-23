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
    const results_path = event.queryStringParameters?.results_path || ''
    if (!results_path) return { statusCode: 400, body: 'results_path required (dbfs:/...)' }

    // Use DBFS API to get file content
    const stat = await dbx(`/api/2.0/dbfs/get-status?path=${encodeURIComponent(results_path)}`, 'GET')
    if (!stat || !stat.path) return { statusCode: 404, body: 'not_found' }
    const read = await fetch(`${HOST}/api/2.0/dbfs/read?path=${encodeURIComponent(results_path)}`, {
      method: 'GET', headers: { 'Authorization': `Bearer ${TOKEN}` }
    })
    const data = await read.json()
    const content = Buffer.from(data.data, 'base64').toString('utf8')
    const results = JSON.parse(content)

    // Minimal processing: map into invariance/counterfactual/context_stability shape
    const out = {
      invariance: results?.invariance || { gap_before: null, gap_after: null, improvement: null },
      counterfactual: results?.counterfactual || { avg_shift: null, max_shift: null, tests: [] },
      context_stability: results?.stability || { max_delta: null, cells: [] }
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, metrics: out }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


