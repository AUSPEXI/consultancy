import type { Handler } from '@netlify/functions'
import { getServiceSupabase, ok, bad, parseBody, checkCsrf, rateLimit, tooMany } from './_shared/supabase'
import JSZip from 'jszip'

function getResourceFromPath(path: string | undefined): string {
  if (!path) return ''
  const idx = path.indexOf('/.netlify/functions/api')
  if (idx === -1) return ''
  const rest = path.slice(idx + '/.netlify/functions/api'.length)
  return rest.replace(/^\//, '').split('/')[0]
}

const handler: Handler = async (event) => {
  try {
    const resource = (event.queryStringParameters?.resource || getResourceFromPath(event.path)).toLowerCase()
    switch (resource) {
      case 'datasets': {
        const rl = rateLimit(event, 'datasets', 120, 60); if (!rl.allowed) return tooMany(rl.retryAfter)
        const action = event.queryStringParameters?.action || 'list'
        if (event.httpMethod !== 'GET' && !checkCsrf(event)) return bad('CSRF', 403)
        const supabase = getServiceSupabase()
        if (action === 'list') {
          const { data, error } = await supabase.from('datasets').select('*').order('created_at', { ascending: false }).limit(50)
          if (error) return bad(error.message, 500)
          return ok({ items: data || [] })
        }
        if (action === 'usage') {
          const { data: vers, error: eBytes } = await supabase.from('dataset_versions').select('byte_size')
          if (eBytes) return ok({ datasetsBytes: 0, datasetsCount: 0 })
          const bytes = (vers||[]).reduce((a:number,b:any)=> a + (Number(b.byte_size)||0), 0)
          const dsCount = await supabase.from('datasets').select('id', { count: 'exact', head: true })
          return ok({ datasetsBytes: bytes, datasetsCount: dsCount.count || 0 })
        }
        if (action === 'bundle') {
          const dataset_id = event.queryStringParameters?.dataset_id; if (!dataset_id) return bad('dataset_id required')
          const supabase = getServiceSupabase()
          const { data: ds, error: e1 } = await supabase.from('datasets').select('*').eq('id', dataset_id).single()
          if (e1 || !ds) return bad(e1?.message || 'dataset not found', 404)
          const { data: ver, error: e2 } = await supabase.from('dataset_versions').select('*').eq('dataset_id', dataset_id).order('created_at', { ascending: false }).limit(1).single()
          if (e2 || !ver) return bad(e2?.message || 'no versions', 404)
          const manifest = { bundle_version: 1, generated_at: new Date().toISOString(), dataset: { id: ds.id, name: ds.name, description: ds.description, created_at: ds.created_at }, version: { id: ver.id, label: ver.version_label, row_count: ver.row_count, byte_size: ver.byte_size, checksum: ver.checksum, created_at: ver.created_at }, proof: ver.proof_json || null }
          const accept = event.headers?.['accept'] || ''
          if (String(accept).includes('application/zip') || event.queryStringParameters?.format === 'zip') {
            const zip = new JSZip(); zip.file('manifest.json', JSON.stringify(manifest, null, 2)); if (ver.proof_json) zip.file('proof.json', JSON.stringify(ver.proof_json, null, 2)); const preview = { sample_rows: Math.min(10, Number(ver.row_count||0)), note: 'redacted preview; full data stored separately' }; zip.file('redacted_preview.json', JSON.stringify(preview, null, 2)); const blob = await zip.generateAsync({ type: 'nodebuffer' });
            return { statusCode: 200, headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${ds.name.replace(/\s+/g,'_')}_bundle.zip"` }, body: (blob as any).toString('base64'), isBase64Encoded: true } as any
          }
          return ok(manifest)
        }
        if (action === 'create') {
          const body = parseBody(event); const { name, description, org_id, owner_id } = body; if (!name || !owner_id) return bad('name and owner_id required')
          const { data, error } = await getServiceSupabase().from('datasets').insert({ name, description, org_id, owner_id }).select('*').single()
          if (error) return bad(error.message, 500)
          return ok({ dataset: data })
        }
        return bad('unknown action')
      }
      case 'models': {
        const rl = rateLimit(event, 'models', 120, 60); if (!rl.allowed) return tooMany(rl.retryAfter)
        const action = event.queryStringParameters?.action || 'list'
        if (event.httpMethod !== 'GET' && !checkCsrf(event)) return bad('CSRF', 403)
        const supabase = getServiceSupabase()
        if (action === 'list') {
          const { data, error } = await supabase.from('models').select('*').order('created_at', { ascending: false }).limit(50)
          if (error) return bad(error.message, 500)
          return ok({ items: data || [] })
        }
        if (action === 'usage') {
          const mv = await supabase.from('model_versions').select('id')
          let bytes = 0; try { const { data: arts } = await supabase.from('model_artifacts').select('byte_size'); bytes = (arts||[]).reduce((a:number,b:any)=> a + (Number(b.byte_size)||0), 0) } catch {}
          const modelsHead = await supabase.from('models').select('id', { count: 'exact', head: true })
          return ok({ modelsCount: modelsHead.count || 0, versions: (mv.data||[]).length, modelsBytes: bytes })
        }
        if (action === 'bundle') {
          const model_id = event.queryStringParameters?.model_id; if (!model_id) return bad('model_id required')
          const { data: m, error: e1 } = await supabase.from('models').select('*').eq('id', model_id).single(); if (e1 || !m) return bad(e1?.message || 'model not found', 404)
          const { data: ver, error: e2 } = await supabase.from('model_versions').select('*').eq('model_id', model_id).order('created_at', { ascending: false }).limit(1).single(); if (e2 || !ver) return bad(e2?.message || 'no versions', 404)
          const manifest = { bundle_version: 1, generated_at: new Date().toISOString(), model: { id: m.id, name: m.name, task: m.task, created_at: m.created_at }, version: { id: ver.id, framework: ver.framework, format: ver.format, quantization: ver.quantization, created_at: ver.created_at }, sbom: ver.sbom || null, license: ver.license || null }
          const accept = event.headers?.['accept'] || ''
          if (String(accept).includes('application/zip') || event.queryStringParameters?.format === 'zip') {
            const zip = new JSZip(); zip.file('manifest.json', JSON.stringify(manifest, null, 2)); if (ver.sbom) zip.file('sbom.json', JSON.stringify(ver.sbom, null, 2)); const blob = await zip.generateAsync({ type: 'nodebuffer' });
            return { statusCode: 200, headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${m.name.replace(/\s+/g,'_')}_model_bundle.zip"` }, body: (blob as any).toString('base64'), isBase64Encoded: true } as any
          }
          return ok(manifest)
        }
        if (action === 'create') {
          const body = parseBody(event); const { name, task, org_id, owner_id, description } = body; if (!name || !owner_id) return bad('name and owner_id required')
          const { data, error } = await supabase.from('models').insert({ name, task, org_id, owner_id, description }).select('*').single(); if (error) return bad(error.message, 500)
          return ok({ model: data })
        }
        if (action === 'addVersion') {
          const body = parseBody(event); const { model_id, framework, format, quantization, params, sbom, license } = body; if (!model_id) return bad('model_id required')
          const { data, error } = await supabase.from('model_versions').insert({ model_id, framework, format, quantization, params, sbom, license }).select('*').single(); if (error) return bad(error.message, 500)
          return ok({ version: data })
        }
        return bad('unknown action')
      }
      case 'templates': {
        const action = event.queryStringParameters?.action || 'list'
        if (event.httpMethod !== 'GET' && !checkCsrf(event)) return bad('CSRF', 403)
        const supabase = getServiceSupabase()
        if (action === 'list') {
          const { data, error } = await supabase.from('schema_templates').select('*').order('created_at', { ascending: false }).limit(50)
          if (error) return bad(error.message, 500)
          return ok({ items: data || [] })
        }
        if (action === 'create') {
          const body = parseBody(event); const { name, domain, tags, org_id, owner_id } = body; if (!name || !owner_id) return bad('name and owner_id required')
          const { data, error } = await supabase.from('schema_templates').insert({ name, domain, tags, org_id, owner_id }).select('*').single(); if (error) return bad(error.message, 500)
          return ok({ template: data })
        }
        if (action === 'addVersion') {
          const body = parseBody(event); const { template_id, schema_json, dp_defaults } = body; if (!template_id || !schema_json) return bad('template_id and schema_json required')
          const { data, error } = await supabase.from('schema_template_versions').insert({ template_id, schema_json, dp_defaults }).select('*').single(); if (error) return bad(error.message, 500)
          return ok({ version: data })
        }
        return bad('unknown action')
      }
      case 'pipelines': {
        const action = event.queryStringParameters?.action || 'ping'
        if (event.httpMethod !== 'GET' && !checkCsrf(event)) return bad('CSRF', 403)
        if (action === 'ping') return ok({ ok: true })
        const supabase = getServiceSupabase()
        if (action === 'list') {
          const { data, error } = await supabase.from('pipeline_snapshots').select('*').order('created_at', { ascending: false }).limit(50)
          if (error) return bad(error.message, 500)
          return ok({ items: data || [] })
        }
        if (action === 'snapshot') {
          const body = parseBody(event); const { label, config, org_id, owner_id } = body; if (!config || !owner_id) return bad('config and owner_id required')
          const { data, error } = await supabase.from('pipeline_snapshots').insert({ label, config, org_id, owner_id }).select('*').single(); if (error) return bad(error.message, 500)
          return ok({ snapshot: data })
        }
        return bad('unknown action')
      }
      case 'evidence': {
        const action = event.queryStringParameters?.action || 'ping'
        if (event.httpMethod !== 'GET' && !checkCsrf(event)) return bad('CSRF', 403)
        if (action === 'ping') return ok({ ok: true })
        const supabase = getServiceSupabase()
        if (action === 'record') {
          const body = parseBody(event); const { event_type, details, org_id, owner_id } = body; if (!event_type || !owner_id) return bad('event_type and owner_id required')
          const { data, error } = await supabase.from('evidence_events').insert({ event_type, details, org_id, owner_id }).select('*').single(); if (error) return bad(error.message, 500)
          return ok({ event: data })
        }
        if (action === 'link-proof') {
          const body = parseBody(event); const { dataset_version_id, model_version_id, proof_id } = body; if (!dataset_version_id && !model_version_id) return bad('one of dataset_version_id or model_version_id required')
          const { data, error } = await supabase.from('proof_links').insert({ dataset_version_id, model_version_id, proof_id }).select('*').single(); if (error) return bad(error.message, 500)
          return ok({ link: data })
        }
        return bad('unknown action')
      }
      default:
        return bad('unknown resource', 404)
    }
  } catch (e: any) {
    return bad(e.message || 'Server error', 500)
  }
}

export { handler }


