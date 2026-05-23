import type { Handler } from '@netlify/functions'
import { readFileSync, existsSync } from 'node:fs'
import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto'
import { join } from 'node:path'

type Json = Record<string, any>

function loadJson(path: string, fallback: any = {}): any {
  try {
    if (!existsSync(path)) return fallback
    const raw = readFileSync(path, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

async function fetchRevocation(): Promise<{ policies?: string[]; tenants?: string[]; updated_at?: string } | null> {
  const localPath = join(process.cwd(), 'keys', 'revocation_list.json')
  const cfg = loadJson(localPath, null)
  const url = process.env.REVOCATION_URL || ''
  if (!url) return cfg
  try {
    const res = await fetch(url)
    if (!res.ok) return cfg
    const remote = await res.json()
    return remote || cfg
  } catch {
    return cfg
  }
}

function ipToCountry(event: any): string | null {
  // Netlify provides x-nf-geo header with JSON { country: { code } }
  const geo = event.headers['x-nf-geo']
  if (geo) {
    try {
      const parsed = JSON.parse(geo)
      const code = parsed?.country?.code
      if (typeof code === 'string' && code.length === 2) return code.toUpperCase()
    } catch {}
  }
  // fallback to query parameter
  const q = event.queryStringParameters?.country || ''
  return q ? String(q).toUpperCase() : null
}

const handler: Handler = async (event) => {
  try {
    const action = event.queryStringParameters?.action || 'heartbeat'

    // Load configs
    const policyPath = join(process.cwd(), 'config', 'policy.json')
    const entitlementsPath = join(process.cwd(), 'config', 'entitlements.json')
    const denylistPath = join(process.cwd(), 'config', 'geo-denylist.json')

    const policyRaw = existsSync(policyPath) ? readFileSync(policyPath, 'utf8') : '{}'
    const policy = JSON.parse(policyRaw)
    const policyFingerprint = sha256Hex(policyRaw)
    const entitlements = loadJson(entitlementsPath, {}) as Json
    const geoDeny = loadJson(denylistPath, { countries: [] as string[] }) as { countries: string[] }
    const revocations = await fetchRevocation()

    // Optional signature verification for revocation payloads (if configured)
    const revocationPubPem = process.env.REVOCATION_PUBKEY_PEM || ''
    const signature = (revocations as any)?.signature as string | undefined
    const signed = (revocations as any)?.signed as string | undefined
    let revocationVerified = false
    if (revocationPubPem && signature && signed) {
      try {
        const key = createPublicKey(revocationPubPem)
        const sig = Buffer.from(signature, 'base64')
        revocationVerified = cryptoVerify(null, Buffer.from(signed, 'utf8'), key, sig)
      } catch {
        revocationVerified = false
      }
    }

    const tenant = String(event.queryStringParameters?.tenant || event.headers['x-tenant'] || '').trim()
    const country = ipToCountry(event)

    const isPolicyRevoked = !!revocations?.policies?.includes(policyFingerprint)
    const isTenantRevoked = tenant ? !!revocations?.tenants?.includes(tenant) : false
    const isGeoDenied = country ? geoDeny.countries.map(c => c.toUpperCase()).includes(country) : false

    function forbidden(reason: string) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, reason, policyFingerprint }) }
    }

    if (action === 'heartbeat') {
      if (isPolicyRevoked) return forbidden('policy_revoked')
      if (isTenantRevoked) return forbidden('tenant_revoked')
      if (isGeoDenied) return forbidden('geo_denied')
      return { statusCode: 200, body: JSON.stringify({ ok: true, policyFingerprint, updated_at: (revocations as any)?.updated_at || null, revocationVerified }) }
    }

    if (action === 'check' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) as Json : {}
      const requested: string[] = Array.isArray(body.features) ? body.features : []
      const requestedSet = new Set(requested)
      const sensitive: string[] = Array.isArray(policy?.sensitive_features) ? policy.sensitive_features : []
      const defaultDenySensitive = !!policy?.default_deny_sensitive

      if (isPolicyRevoked) return forbidden('policy_revoked')
      if (isTenantRevoked) return forbidden('tenant_revoked')
      if (isGeoDenied) return forbidden('geo_denied')

      let allowed = true
      const denied: string[] = []
      const tenantEnt = tenant && entitlements[tenant] ? entitlements[tenant] as { features?: string[] } : { features: [] as string[] }
      const entSet = new Set(tenantEnt.features || [])

      for (const feat of sensitive) {
        if (requestedSet.has(feat)) {
          const entitled = entSet.has(feat)
          if (defaultDenySensitive && !entitled) {
            allowed = false
            denied.push(feat)
          }
        }
      }

      if (!allowed) return forbidden(`features_denied:${denied.join(',')}`)
      return { statusCode: 200, body: JSON.stringify({ ok: true, policyFingerprint, granted: requested }) }
    }

    return { statusCode: 400, body: 'unknown action' }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


