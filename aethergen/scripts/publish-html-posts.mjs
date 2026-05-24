import fs from 'fs/promises'
import path from 'path'
import { spawnSync } from 'child_process'

const slugs = [
  'model-rental-marketplace-strategy',
  'databricks-unity-catalog-listing-guide',
  'stripe-products-prices-webhooks-guide',
  'evidence-bundles-zk-snarks-overview',
  'synthetic-data-governance-kpis',
  'edge-offline-audit-sbom',
  'ablation-testing-explained',
  'drift-stress-testing-regulated-ai',
  'unity-catalog-cicd-automation',
  'aml-graph-typology-library',
  'qc-vision-edge-reference-architecture',
  'enterprise-pricing-evidence-alignment',
  'managed-delivery-databricks-slas',
  'benchmarks-ablation-reporting-howto',
  'dataset-cards-model-cards-evidence'
]

// add newly created IP-safe post
slugs.push('pareto-operating-point-efficiency-in-ai')

const titleFromHtml = (html) => {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  return m ? m[1].replace(/<[^>]*>/g,'').trim() : ''
}
const excerptFromHtml = (html) => {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  const text = m ? m[1].replace(/<[^>]*>/g,'').trim() : ''
  return text.slice(0, 280)
}

async function main() {
  // IP safety guard pre-check
  const guard = spawnSync(process.execPath, ['scripts/ip-safety-guard.mjs'], { stdio: 'inherit' })
  if (guard.status !== 0) {
    console.error('IP Safety Guard failed; aborting publish.')
    process.exit(1)
  }
  const base = process.env.FN_BASE || process.env.URL || 'http://localhost:8888'
  for (const slug of slugs) {
    const p = path.join(process.cwd(), 'public', 'blog-html', `${slug}.html`)
    let html = ''
    try { html = await fs.readFile(p, 'utf8') } catch { console.warn('Missing HTML for', slug); continue }
    const title = titleFromHtml(html) || slug.replace(/-/g,' ')
    const excerpt = excerptFromHtml(html)
    const body = { slug, title, excerpt, contentHtml: html, status: 'published' }
    const res = await fetch(`${base}/.netlify/functions/blog-upsert`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) }).catch(()=>null)
    if (!res || !res.ok) {
      console.error('Failed to publish', slug, res && await res.text())
    } else {
      console.log('Published', slug)
    }
  }
}

main().catch(e=>{ console.error(e); process.exit(1) })


