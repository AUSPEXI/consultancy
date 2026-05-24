import fs from 'node:fs'

const BASE = process.env.NETLIFY_BASE || 'http://localhost:8888/.netlify/functions'

async function run() {
  const ts = new Date().toISOString()
  const ingestBody = {
    events_table: 'aethergen.context.events',
    events: [
      { id: 'e1', actor_id: 'patient-123', ts, kind: 'visit', payload: { note: 'hi' }, location: 'ICU', intent: 'admission' },
      { id: 'e2', actor_id: 'patient-123', ts, kind: 'med', payload: { drug: 'x' }, location: 'ICU', intent: 'prescription' }
    ]
  }

  const ingest = await fetch(`${BASE}/context-ingest`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ingestBody)
  })
  const ingestTxt = await ingest.text()
  console.log('INGEST', ingest.status, ingestTxt)

  const retrieve = await fetch(`${BASE}/context-retrieve?actor_id=patient-123&k_recent=10`)
  const retrieveTxt = await retrieve.text()
  console.log('RETRIEVE', retrieve.status, retrieveTxt)

  const gates = JSON.parse(fs.readFileSync('public/context-gates.json', 'utf8'))
  const accBody = { results_path: 'dbfs:/FileStore/aethergen/out/quick-test/results.json', gates }
  const acc = await fetch(`${BASE}/acceptance-publish`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(accBody)
  })
  const accTxt = await acc.text()
  console.log('ACCEPT', acc.status, accTxt)
}

run().catch(err => { console.error(err); process.exit(1) })


