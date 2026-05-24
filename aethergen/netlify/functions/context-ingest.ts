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

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' }
    const body = event.body ? JSON.parse(event.body) as Json : {}
    const { events_table, events } = body
    if (!events_table || !Array.isArray(events)) return { statusCode: 400, body: 'events_table and events[] required' }
    // Simple approach: use files/import API to append JSON records
    // For production, switch to autoloader or direct SQL inserts via warehouse endpoints.
    const tmpPath = `/api/2.0/dbfs/put`
    const filePath = `dbfs:/tmp/context_ingest_${Date.now()}.json`
    await dbx(tmpPath, 'POST', { path: filePath, overwrite: true, contents: Buffer.from(JSON.stringify(events)).toString('base64') })
    // Use a SQL endpoint to COPY INTO (requires a configured warehouse) - omitted here; notebook job can do it.
    return { statusCode: 200, body: JSON.stringify({ ok: true, staged: filePath }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


