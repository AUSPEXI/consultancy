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
    const { results_path, gates, uc_table, uc_object_type } = body
    if (!results_path || !gates) return { statusCode: 400, body: 'results_path and gates required' }

    // Read results.json from DBFS
    const read = await fetch(`${HOST}/api/2.0/dbfs/read?path=${encodeURIComponent(results_path)}`, {
      method: 'GET', headers: { 'Authorization': `Bearer ${TOKEN}` }
    })
    const data = await read.json()
    const content = Buffer.from(data.data, 'base64').toString('utf8')
    const results = JSON.parse(content)

    const inv = results?.invariance || {}
    const cf = results?.counterfactual || {}
    const stab = results?.stability || {}
    const invPass = (inv.improvement ?? 0) >= gates.invariance_improvement_min
    const cfPass = (cf.avg_shift ?? Infinity) <= gates.counterfactual_avg_shift_max
    const stabPass = (stab.max_delta ?? Infinity) <= gates.context_stability_max_delta
    const lines = [
      `results_path: ${results_path}`,
      `invariance_improvement: ${inv.improvement ?? 'n/a'} (gate ${gates.invariance_improvement_min}) -> ${invPass ? 'PASS' : 'FAIL'}`,
      `counterfactual_avg_shift: ${cf.avg_shift ?? 'n/a'} (gate ${gates.counterfactual_avg_shift_max}) -> ${cfPass ? 'PASS' : 'FAIL'}`,
      `context_stability_max_delta: ${stab.max_delta ?? 'n/a'} (gate ${gates.context_stability_max_delta}) -> ${stabPass ? 'PASS' : 'FAIL'}`,
      `overall: ${(invPass && cfPass && stabPass) ? 'PASS' : 'FAIL'}`
    ].join('\n')

    const outPath = results_path.replace(/\/results\.json$/, '') + '/acceptance.txt'
    await dbx('/api/2.0/dbfs/put', 'POST', { path: outPath, overwrite: true, contents: Buffer.from(lines).toString('base64') })
    // Optionally attach UC comment with link
    let commentPath = null
    if (uc_table) {
      const host = HOST.replace(/\/api\/.*/, '')
      const link = `${host}/#folder${encodeURIComponent(outPath)}`
      const comment = `Acceptance: ${link}`
      try {
        const objType = (uc_object_type || 'tables') as 'tables'|'models'|'functions'|'views'
        await fetch(`${HOST}/api/2.1/unity-catalog/${objType}/${encodeURIComponent(uc_table)}`, {
          method: 'PATCH', headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment })
        })
        commentPath = comment
      } catch {}
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, acceptance_path: outPath, uc_comment: !!commentPath }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


