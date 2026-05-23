#!/usr/bin/env node
// Pull selected Netlify env vars into a local .env (non-interactive)
const { execSync } = require('node:child_process')
const { writeFileSync, appendFileSync } = require('node:fs')

const keys = [
  // Databricks
  'DATABRICKS_HOST',
  'DATABRICKS_TOKEN',
  'DATABRICKS_CLUSTER_ID',
  'DATABRICKS_NOTEBOOK_BASE',
  'METRICS_NOTEBOOK_PATH',
  'DATABRICKS_WORKSPACE_URL',
  'DATABRICKS_PAT',
  // Supabase
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_ROLE',
  'SUPABASE_DATABASE_URL',
  // Policy/guard
  'REVOCATION_URL',
  'REVOCATION_PUBKEY_PEM',
  'CORS_ORIGIN',
  'CSRF_SECRET',
  // LinkedIn
  'LINKEDIN_CLIENT_ID',
  'LINKEDIN_CLIENT_SECRET',
  'LINKEDIN_ORG_URN',
  'LINKEDIN_SCOPE',
  // Stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  // MLflow
  'MLFLOW_EXPERIMENT_NAME',
]

function getVar(name) {
  try {
    const value = execSync(`npx --yes netlify env:get ${name}`, { stdio: ['ignore', 'pipe', 'pipe'] })
      .toString()
      .trim()
    return value
  } catch {
    return ''
  }
}

writeFileSync('.env', '')
let count = 0
for (const k of keys) {
  const v = getVar(k)
  if (v) {
    appendFileSync('.env', `${k}=${v}\n`)
    count++
  }
}
console.log(`Wrote ${count} variables to .env`)

