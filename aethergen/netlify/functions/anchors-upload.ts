import type { Handler } from '@netlify/functions'
import crypto from 'node:crypto'

type Json = Record<string, any>

function stableStringify(obj: any): string {
  const allKeys: string[] = []
  JSON.stringify(obj, (key, value) => { allKeys.push(key); return value }, 2)
  allKeys.sort()
  return JSON.stringify(obj, allKeys)
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function validateAnchorBundle(bundle: Json) {
  const errors: string[] = []
  const warnings: string[] = []

  if (typeof bundle !== 'object' || bundle === null) {
    errors.push('Bundle must be a JSON object')
    return { valid: false, errors, warnings }
  }

  // Minimal spec
  // {
  //   metadata: { schema_id: string, version?: string, dp?: { epsilon?: number } }
  //   globals: { fields: { [name]: { type: string, count: number, mean?: number, std?: number, min?: number, max?: number, quantiles?: Record<string, number> } }, correlations?: Array<{ a: string; b: string; rho: number }> }
  //   segments?: Array<{ key: string; filter?: string; fields: {... like globals.fields } }>
  // }

  const metadata = bundle.metadata
  if (!metadata || typeof metadata !== 'object') errors.push('metadata is required')
  if (metadata && typeof metadata.schema_id !== 'string') errors.push('metadata.schema_id must be a string')

  const globals = bundle.globals
  if (!globals || typeof globals !== 'object') errors.push('globals is required')
  const fields = globals?.fields
  if (!fields || typeof fields !== 'object') errors.push('globals.fields is required')
  else {
    const names = Object.keys(fields)
    if (names.length === 0) warnings.push('globals.fields is empty')
    for (const name of names) {
      const f = fields[name]
      if (!f || typeof f !== 'object') { errors.push(`field ${name} must be object`); continue }
      if (typeof f.type !== 'string') errors.push(`field ${name}.type must be string`)
      if (typeof f.count !== 'number') errors.push(`field ${name}.count must be number`)
      if (f.quantiles && typeof f.quantiles !== 'object') errors.push(`field ${name}.quantiles must be object if present`)
    }
  }

  const segments = bundle.segments
  if (segments !== undefined && !Array.isArray(segments)) warnings.push('segments should be an array if provided')

  const valid = errors.length === 0
  return { valid, errors, warnings }
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      return { statusCode: 200, body: 'POST anchor bundle JSON to receive validation and anchor_hash' }
    }
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method not allowed' }

    const body = event.body ? JSON.parse(event.body) as Json : null
    if (!body) return { statusCode: 400, body: 'missing body' }

    const { valid, errors, warnings } = validateAnchorBundle(body)
    if (!valid) return { statusCode: 400, body: JSON.stringify({ ok: false, errors, warnings }) }

    const canonical = stableStringify(body)
    const anchor_hash = sha256Hex(canonical)

    return { statusCode: 200, body: JSON.stringify({ ok: true, anchor_hash, warnings }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


