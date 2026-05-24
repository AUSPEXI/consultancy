export type GuardCheckResult = { ok: boolean; reason?: string; policyFingerprint?: string; granted?: string[] }

async function call(path: string, method = 'GET', body?: any): Promise<any> {
  const url = `${import.meta.env.BASE_URL || ''}.netlify/functions/policy-guard${path}`
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const txt = await res.text()
  try { return JSON.parse(txt) } catch { return { ok: false, reason: 'bad_json', txt } }
}

export async function heartbeat(tenant?: string): Promise<GuardCheckResult> {
  const qs = new URLSearchParams()
  if (tenant) qs.set('tenant', tenant)
  return await call(`?action=heartbeat&${qs.toString()}`)
}

export async function checkFeatures(features: string[], tenant?: string): Promise<GuardCheckResult> {
  const qs = new URLSearchParams()
  if (tenant) qs.set('tenant', tenant)
  return await call(`?action=check&${qs.toString()}`, 'POST', { features })
}


