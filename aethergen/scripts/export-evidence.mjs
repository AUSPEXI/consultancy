import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'

function parseArgs() {
  const get = (k, d='') => { const i = process.argv.indexOf(`--${k}`); return i>=0 ? (process.argv[i+1]||'') : d }
  const summary = get('summary')
  const out = get('out', './evidence.zip')
  if (!summary) throw new Error('--summary required')
  return { summary, out }
}

async function main() {
  const { summary, out } = parseArgs()
  const zip = new JSZip()
  const createdAt = new Date().toISOString()
  // Load summary
  const summaryJson = JSON.parse(fs.readFileSync(summary, 'utf-8'))
  zip.file('summary.json', JSON.stringify(summaryJson, null, 2))
  // Crypto profile
  const crypto = { hash_algo: 'sha256', sig_algo: 'ed25519', sig_mode: 'single', created_at: createdAt }
  zip.file('crypto_profile.json', JSON.stringify(crypto, null, 2))
  // Minimal provenance stub
  const provenance = { anchors: ['nyc_taxi_anchors_v0'], notes: 'Open anchor pack; no raw documents included.' }
  zip.file('context_provenance.json', JSON.stringify(provenance, null, 2))
  // Attach per_query.csv if next to summary
  try {
    const dir = path.dirname(summary)
    const csvPath = path.join(dir, 'per_query.csv')
    if (fs.existsSync(csvPath)) {
      zip.file('per_query.csv', fs.readFileSync(csvPath))
    }
  } catch {}
  const buf = await zip.generateAsync({ type: 'nodebuffer' })
  fs.writeFileSync(out, buf)
  console.log('Evidence ZIP written to', out)
}

main().catch(e => { console.error(e); process.exit(1) })


