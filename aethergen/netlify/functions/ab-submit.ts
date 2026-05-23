import type { Handler } from '@netlify/functions'

const HOST = process.env.DATABRICKS_HOST || ''
const TOKEN = process.env.DATABRICKS_TOKEN || ''

async function dbx(path: string, method: string, body?: any) {
  if (!HOST || !TOKEN) throw new Error('Databricks host/token not configured')
  const res = await fetch(`${HOST}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${txt}`)
  try { return JSON.parse(txt) } catch { return {} }
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' }
    const body = event.body ? JSON.parse(event.body) as any : {}
    const job_spec = body?.job_spec || null
    const baseline_path = body?.baseline_path || ''
    const context_path = body?.context_path || ''
    const out_path = body?.out_path || ''
    const cluster_id = process.env.DATABRICKS_CLUSTER_ID
    if (!job_spec && !cluster_id) return { statusCode: 400, body: 'Provide job_spec or set DATABRICKS_CLUSTER_ID' }

    const payload = job_spec || require('../../databricks/jobs/ab_context_experiment.json')
    const spec = JSON.parse(JSON.stringify(payload).replaceAll('${DATABRICKS_CLUSTER_ID}', String(cluster_id || '')))
    // Inject base parameters if provided
    try {
      const tasks = spec.tasks || []
      for (const t of tasks) {
        const key = t.task_key
        t.notebook_task = t.notebook_task || {}
        t.notebook_task.base_parameters = t.notebook_task.base_parameters || {}
        if (key === 'train_baseline' && baseline_path) {
          t.notebook_task.base_parameters.out_path = baseline_path
        }
        if (key === 'train_context' && context_path) {
          t.notebook_task.base_parameters.out_path = context_path
        }
        if (key === 'compare' && baseline_path && context_path && out_path) {
          t.notebook_task.base_parameters.baseline_path = baseline_path
          t.notebook_task.base_parameters.context_path = context_path
          t.notebook_task.base_parameters.out_path = out_path
        }
      }
    } catch {}
    const res = await dbx('/api/2.1/jobs/runs/submit', 'POST', spec)
    return { statusCode: 200, body: JSON.stringify({ ok: true, run_id: res?.run_id }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


