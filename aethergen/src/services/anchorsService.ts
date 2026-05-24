export type AnchorBundle = {
  metadata: { schema_id: string; version?: string; dp?: { epsilon?: number; delta?: number } }
  globals: {
    fields: Record<string, { type: string; count: number; mean?: number; std?: number; min?: number; max?: number; quantiles?: Record<string, number> }>
    correlations?: Array<{ a: string; b: string; rho: number }>
  }
  segments?: Array<{ key: string; filter?: string; fields: AnchorBundle['globals']['fields'] }>
}

export async function uploadAnchorBundle(bundle: AnchorBundle): Promise<{ ok: boolean; anchor_hash?: string; warnings?: string[]; errors?: string[] }> {
  const res = await fetch('/.netlify/functions/anchors-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bundle)
  })
  const txt = await res.text()
  if (!res.ok) throw new Error(txt || 'upload failed')
  const js = JSON.parse(txt)
  try { if (js.anchor_hash) localStorage.setItem('aeg_anchor_hash', js.anchor_hash) } catch {}
  return js
}


