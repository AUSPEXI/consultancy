import type { Handler } from '@netlify/functions'

type Json = Record<string, any>

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

function isLikelyValidClusterId(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false
  const trimmed = candidate.trim()
  if (!trimmed) return false
  // Filter out placeholders or unresolved env messages injected by tooling
  const badFragments = ['No value set', 'undefined', 'null', '${', 'context for environment variable']
  if (badFragments.some(f => trimmed.includes(f))) return false
  // Typical Azure Databricks cluster IDs look like MMDD-HHMMSS-xxxxxx
  // e.g., 0904-221229-zymgfkwu
  const pattern = /^\d{4}-\d{6}-[A-Za-z0-9_-]+$/
  return pattern.test(trimmed)
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' }
    const body = event.body ? JSON.parse(event.body) as Json : {}
    const { dataset_path, uc_volume, config } = body
    // Support both legacy params (dataset_path/uc_volume) and direct params for the notebook
    const providedBaseline = typeof body.baseline_path === 'string' ? body.baseline_path as string : ''
    const providedContext  = typeof body.context_path === 'string' ? body.context_path as string : ''
    const providedOut      = typeof body.out_path === 'string' ? body.out_path as string : ''
    if ((!dataset_path || !uc_volume) && (!providedBaseline || !providedContext || !providedOut)) {
      return { statusCode: 400, body: 'dataset_path and uc_volume required, or provide baseline_path, context_path, out_path' }
    }

    // Prefer explicit cluster_id from request; fallback to env; validate before use
    const preferredClusterId = isLikelyValidClusterId(body.cluster_id) ? String(body.cluster_id).trim() : ''
    const envClusterId = isLikelyValidClusterId(process.env.DATABRICKS_CLUSTER_ID) ? String(process.env.DATABRICKS_CLUSTER_ID).trim() : ''
    const clusterId = preferredClusterId || envClusterId || ''

    // Define a one-off job to run a notebook/script that computes metrics and writes results.json to uc_volume
    // Map inputs to the notebook expected parameters
    const sanitize = (p: string) => String(p || '').trim().replace(/\/+$/,'')
    const outPath = providedOut || sanitize(String(uc_volume))
    const baselinePath = providedBaseline || `${sanitize(String(dataset_path))}/baseline`
    const contextPath  = providedContext  || `${sanitize(String(dataset_path))}/context`

    const taskBase: any = {
      task_key: 'compute_metrics',
      notebook_task: {
        notebook_path: process.env.METRICS_NOTEBOOK_PATH || '/Shared/metrics/compute_metrics',
        base_parameters: {
          // Notebook expects baseline_path, context_path, out_path
          baseline_path: baselinePath,
          context_path: contextPath,
          out_path: outPath,
          // Keep config available for future use (ignored by current notebook)
          config: JSON.stringify(config || {})
        }
      }
    }

    const task = clusterId
      ? { ...taskBase, existing_cluster_id: clusterId }
      : {
          ...taskBase,
          new_cluster: {
            // Use a modern, widely available runtime with Photon
            spark_version: '16.4.x-photon-scala2.12',
            node_type_id: 'Standard_D4ds_v5',
            num_workers: 0, // single node
            autotermination_minutes: 20,
            data_security_mode: 'SINGLE_USER'
          }
        }

    const runs = await dbx('/api/2.1/jobs/runs/submit', 'POST', {
      run_name: `metrics-${Date.now()}`,
      tasks: [task]
    })

    return { statusCode: 200, body: JSON.stringify({ ok: true, run_id: runs?.run_id, results_path: `${outPath.replace(/\/+$/,'')}/results.json` }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


