#!/usr/bin/env node
/*
  Entitlements Guard
  - Enforces that sensitive features are NOT granted to any tenant except an allowlist
  - For tenant 'dev', only a small set of features is allowed during testing
  - Fails CI if violations are found
*/

const { readFileSync, existsSync } = require('node:fs')
const { join } = require('node:path')

function loadJson(path, fallback = {}) {
  try {
    if (!existsSync(path)) return fallback
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

const repoRoot = process.cwd()
const entPath = join(repoRoot, 'config', 'entitlements.json')
const policyPath = join(repoRoot, 'config', 'policy.json')

const ent = loadJson(entPath, {})
const policy = loadJson(policyPath, {})

const sensitiveFromPolicy = Array.isArray(policy.sensitive_features) ? policy.sensitive_features : []

// Allow-list
const allowedTenants = new Set(['dev', 'example_tenant'])
const allowedDevFeatures = new Set(['sensitive_ab', 'metrics_uc_publish'])

// Helper to check if a feature is sensitive
function isSensitiveFeature(name) {
  if (!name || typeof name !== 'string') return false
  if (sensitiveFromPolicy.includes(name)) return true
  if (name.startsWith('sensitive_')) return true
  return false
}

const errors = []

for (const [tenant, cfg] of Object.entries(ent)) {
  const features = Array.isArray(cfg?.features) ? cfg.features : []

  // 1) No tenant other than 'dev' may have sensitive features
  if (tenant !== 'dev') {
    for (const feat of features) {
      if (isSensitiveFeature(feat)) {
        errors.push(`Tenant '${tenant}' has sensitive feature '${feat}', which is not allowed.`)
      }
    }
  }

  // 2) For 'dev', only the explicitly allowed test features are permitted
  if (tenant === 'dev') {
    for (const feat of features) {
      if (isSensitiveFeature(feat) && !allowedDevFeatures.has(feat)) {
        errors.push(`Tenant 'dev' includes unapproved sensitive feature '${feat}'. Allowed: ${Array.from(allowedDevFeatures).join(', ')}`)
      }
    }
  }

  // 3) 'example_tenant' must not include any sensitive feature (docs/demo only)
  if (tenant === 'example_tenant') {
    for (const feat of features) {
      if (isSensitiveFeature(feat)) {
        errors.push(`'example_tenant' includes sensitive feature '${feat}', which is not allowed in examples.`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error('\nEntitlements Guard Violations:')
  for (const e of errors) console.error(`- ${e}`)
  console.error('\nRefuse to proceed. Review config/entitlements.json and policy.json.')
  process.exit(1)
}

console.log('Entitlements Guard: OK')


