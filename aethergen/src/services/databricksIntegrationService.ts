export type EvidenceFile = { name: string; base64: string }

async function call(path: string, opts?: RequestInit) {
  const res = await fetch(path, opts)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function ensureDatabricksObjects(catalog = 'aethergen', schema = 'evidence', volume = 'bundles') {
  return call(`/.netlify/functions/databricks-uc?action=ensureObjects&catalog=${encodeURIComponent(catalog)}&schema=${encodeURIComponent(schema)}&volume=${encodeURIComponent(volume)}`)
}

export async function uploadEvidenceToUC(files: EvidenceFile[], options: { catalog?: string; schema?: string; volume?: string; subdir?: string } = {}) {
  return call('/.netlify/functions/databricks-uc?action=uploadEvidence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, ...options }),
  })
}

export async function setUCObjectEvidenceComment(fullName: string, bundleHash: string, manifestHash: string, opText = 'fpr=1%') {
  const comment = `Evidence: bundle=${bundleHash.slice(0,12)}, manifest=${manifestHash.slice(0,12)}, op=${opText}`
  return call('/.netlify/functions/databricks-uc?action=setTableComment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, comment })
  })
}
