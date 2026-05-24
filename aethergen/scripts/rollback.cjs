#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function now() { return new Date().toISOString() }

function main() {
  const args = process.argv.slice(2)
  const model = args[0] || 'unknown-model'
  const reason = args[1] || 'gate-breach'
  const evidenceId = args[2] || 'n/a'

  console.log(`🚨 ROLLBACK (dry-run) for ${model}`)
  console.log(`Reason: ${reason}`)
  console.log(`Evidence: ${evidenceId}`)
  console.log('Actions (planned):')
  console.log('1) Revert to last known-good artifact')
  console.log('2) Update routing to previous model')
  console.log('3) Notify stakeholders and open incident')

  const logDir = path.join(process.cwd(), '.aethergen')
  fs.mkdirSync(logDir, { recursive: true })
  const logPath = path.join(logDir, 'change-log.json')
  let log = []
  try { if (fs.existsSync(logPath)) log = JSON.parse(fs.readFileSync(logPath, 'utf8')) } catch {}
  log.push({ ts: now(), action: 'rollback.dry_run', model, reason, evidenceId })
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2))
}

main()


