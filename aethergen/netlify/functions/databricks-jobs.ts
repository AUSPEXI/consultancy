import type { Handler } from '@netlify/functions'
import fs from 'fs'
import path from 'path'

type Json = Record<string, any>

const HOST = process.env.DATABRICKS_HOST || ''
const TOKEN = process.env.DATABRICKS_TOKEN || ''
const API21 = HOST ? `${HOST}/api/2.1` : ''
const API20 = HOST ? `${HOST}/api/2.0` : ''

async function api(pathname: string, method: string, body?: any) {
  if (!HOST || !TOKEN) {
    throw new Error('Databricks host/token not configured')
  }
  const url = `${pathname.startsWith('/api/2.0') ? HOST : API21}${pathname}`
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=> '')
    throw new Error(`${res.status} ${res.statusText}: ${txt}`)
  }
  return res.json()
}

function loadJobSpec(baseOverride?: string): Json {
  const jobPath = path.join(process.cwd(), 'databricks', 'automotive', 'job.json')
  const raw = fs.readFileSync(jobPath, 'utf8')
  const spec = JSON.parse(raw)
  const base = baseOverride || process.env.DATABRICKS_NOTEBOOK_BASE || '' // e.g. /Repos/<user>/<repo> or /Shared/aethergen
  if (base && Array.isArray(spec.tasks)) {
    for (const t of spec.tasks) {
      if (t.notebook_task?.notebook_path && !t.notebook_task.notebook_path.startsWith('/')) {
        t.notebook_task.notebook_path = `${base}/${t.notebook_task.notebook_path}`
      }
    }
  }
  return spec
}

async function ensureJob(jobName: string, baseOverride?: string): Promise<number> {
  // Try to find by listing jobs (paginated)
  let pageToken: string | undefined
  while (true) {
    const q: any = pageToken ? { page_token: pageToken } : {}
    const res = await api('/jobs/list', 'GET') as any
    const jobs = res?.jobs || []
    for (const j of jobs) {
      if (j.settings?.name === jobName) return j.job_id
    }
    if (!res?.has_more || !res?.next_page_token) break
    pageToken = res.next_page_token
  }
  const spec = loadJobSpec(baseOverride)
  const created = await api('/jobs/create', 'POST', spec) as any
  return created.job_id
}

async function mkdirs(workspacePath: string) {
  await api(`/api/2.0/workspace/mkdirs`, 'POST', { path: workspacePath })
}

async function importNotebook(localPath: string, workspacePath: string) {
  const content = fs.readFileSync(localPath)
  const b64 = content.toString('base64')
  await api(`/api/2.0/workspace/import`, 'POST', {
    path: workspacePath,
    format: 'SOURCE',
    language: 'PYTHON',
    content: b64,
    overwrite: true,
  })
}

async function bootstrapAutomotive(basePath: string) {
  // Ensure folders
  const base = basePath.replace(/\/$/, '')
  const nbBase = `${base}/databricks/automotive/notebooks`
  await mkdirs(nbBase)
  // Map local notebooks to workspace
  const files = [
    '01_setup_uc.py',
    '02_schema_seed.py',
    '03_synthetic_generate.py',
    '04_benchmarks_evidence.py',
    '05_register_models.py',
    '06_package_publish.py',
  ]
  for (const f of files) {
    const local = path.join(process.cwd(), 'databricks', 'automotive', 'notebooks', f)
    const remote = `${nbBase}/${f.replace(/\.py$/, '')}` // workspace notebooks typically path without .py
    await importNotebook(local, remote)
  }
  return { ok: true, base: base }
}

const handler: Handler = async (event) => {
  try {
    const action = event.queryStringParameters?.action || 'help'

    if (action === 'help' || event.httpMethod === 'GET' && !event.queryStringParameters?.action) {
      return { statusCode: 200, body: 'Use action=runAutomotive or action=getRun&run_id=...' }
    }

    if (action === 'clusters') {
      // List clusters visible to this workspace/token
      const res = await api('/api/2.0/clusters/list', 'GET') as any
      return { statusCode: 200, body: JSON.stringify(res) }
    }

    if (action === 'getCluster') {
      const clusterId = (event.queryStringParameters?.cluster_id || '').trim()
      if (!clusterId) return { statusCode: 400, body: 'cluster_id required' }
      const res = await api(`/api/2.0/clusters/get?cluster_id=${encodeURIComponent(clusterId)}`, 'GET') as any
      return { statusCode: 200, body: JSON.stringify(res) }
    }

    if (action === 'runAutomotive') {
      const base = (event.queryStringParameters?.base || '').trim() || '/Shared/aethergen'
      // Bootstrap notebooks if requested or likely needed
      if ((event.queryStringParameters?.bootstrap || 'true') === 'true') {
        await bootstrapAutomotive(base)
      }
      const jobName = 'Aethergen Automotive — Material Defect Pipeline'
      const jobId = await ensureJob(jobName, base)
      const run = await api('/jobs/run-now', 'POST', { job_id: jobId }) as any
      return { statusCode: 200, body: JSON.stringify({ ok: true, job_id: jobId, run_id: run.run_id }) }
    }

    if (action === 'getRun') {
      const runId = event.queryStringParameters?.run_id
      if (!runId) return { statusCode: 400, body: 'run_id required' }
      const info = await api(`/jobs/runs/get?run_id=${encodeURIComponent(runId)}`, 'GET')
      return { statusCode: 200, body: JSON.stringify(info) }
    }

    return { statusCode: 400, body: 'unknown action' }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


