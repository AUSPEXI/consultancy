import type { Handler } from '@netlify/functions'

type Json = Record<string, any>

const HOST = process.env.DATABRICKS_HOST || ''
const TOKEN = process.env.DATABRICKS_TOKEN || ''

function url(pathname: string): string {
  const base = pathname.startsWith('/api/2.0') || pathname.startsWith('/api/2.1') ? '' : '/api/2.1'
  return `${HOST}${base}${pathname}`
}

async function api(pathname: string, method: string, body?: any) {
  if (!HOST || !TOKEN) throw new Error('Databricks host/token not configured')
  const res = await fetch(url(pathname), {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=> '')
    throw new Error(`${res.status} ${res.statusText}: ${txt}`)
  }
  return res.status === 204 ? null : res.json()
}

async function ensureCatalog(catalog: string) {
  try { return await api(`/unity-catalog/catalogs/${encodeURIComponent(catalog)}`, 'GET') } catch {}
  return await api(`/unity-catalog/catalogs`, 'POST', { name: catalog, comment: 'Managed by AethergenPlatform' })
}

async function ensureSchema(catalog: string, schema: string) {
  try { return await api(`/unity-catalog/schemas/${encodeURIComponent(catalog)}.${encodeURIComponent(schema)}`, 'GET') } catch {}
  return await api(`/unity-catalog/schemas`, 'POST', { name: schema, catalog_name: catalog, comment: 'Managed by AethergenPlatform' })
}

async function ensureVolume(catalog: string, schema: string, volume: string) {
  try { return await api(`/unity-catalog/volumes/${encodeURIComponent(catalog)}.${encodeURIComponent(schema)}.${encodeURIComponent(volume)}`, 'GET') } catch {}
  return await api(`/unity-catalog/volumes`, 'POST', { name: volume, catalog_name: catalog, schema_name: schema, volume_type: 'MANAGED', comment: 'Evidence volume (managed)' })
}

async function dbfsMkdirs(dbfsPath: string) {
  await api(`/api/2.0/dbfs/mkdirs`, 'POST', { path: dbfsPath })
}

async function dbfsPut(dbfsPath: string, b64: string, overwrite = true) {
  await api(`/api/2.0/dbfs/put`, 'POST', { path: dbfsPath, overwrite, contents: b64 })
}

async function setObjectComment(objectType: 'tables' | 'models' | 'functions' | 'views', fullName: string, comment: string) {
  return await api(`/unity-catalog/${objectType}/${encodeURIComponent(fullName)}`, 'PATCH', { comment })
}

async function grantVolumePermissions(catalog: string, schema: string, volume: string, principal: string, privileges: string[] = ['READ_VOLUME', 'WRITE_VOLUME']) {
  const fullName = `${catalog}.${schema}.${volume}`
  // Unity Catalog permissions endpoint for securables (volumes included)
  // PATCH body uses changes with add/remove privileges
  return await api(`/unity-catalog/permissions/volumes/${encodeURIComponent(fullName)}`, 'PATCH', {
    changes: [
      { principal, add: privileges }
    ]
  })
}

async function ensureStorageCredentialAzureMI(name: string, accessConnectorId: string) {
  try { return await api(`/unity-catalog/storage-credentials/${encodeURIComponent(name)}`, 'GET') } catch {}
  // Azure Managed Identity via Access Connector
  return await api(`/unity-catalog/storage-credentials`, 'POST', {
    name,
    comment: 'Managed by AethergenPlatform (Access Connector)',
    azure_managed_identity: {
      access_connector_id: accessConnectorId,
    },
  })
}

async function ensureExternalLocation(name: string, urlStr: string, credentialName: string) {
  try { return await api(`/unity-catalog/external-locations/${encodeURIComponent(name)}`, 'GET') } catch {}
  return await api(`/unity-catalog/external-locations`, 'POST', {
    name,
    url: urlStr,
    credential_name: credentialName,
    comment: 'UC external location (Managed by AethergenPlatform)'
  })
}

async function ensureCatalogWithManagedLocation(name: string, managedUrl: string) {
  try { return await api(`/unity-catalog/catalogs/${encodeURIComponent(name)}`, 'GET') } catch {}
  // storage_root corresponds to MANAGED LOCATION in SQL
  return await api(`/unity-catalog/catalogs`, 'POST', { name, comment: 'Managed by AethergenPlatform', storage_root: managedUrl })
}

const handler: Handler = async (event) => {
  try {
    const action = event.queryStringParameters?.action || 'help'
    if (action === 'help') {
      return { statusCode: 200, body: 'Actions: ensureObjects, uploadEvidence, setTableComment, setObjectComment, grantVolume, bootstrapManaged' }
    }

    if (action === 'ensureObjects') {
      const catalog = (event.queryStringParameters?.catalog || 'aethergen').trim()
      const schema = (event.queryStringParameters?.schema || 'evidence').trim()
      const volume = (event.queryStringParameters?.volume || 'bundles').trim()
      const cat = await ensureCatalog(catalog)
      const sch = await ensureSchema(catalog, schema)
      const vol = await ensureVolume(catalog, schema, volume)
      return { statusCode: 200, body: JSON.stringify({ ok: true, catalog: cat, schema: sch, volume: vol }) }
    }

    if (action === 'uploadEvidence' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) as Json : {}
      const catalog = (body.catalog || 'aethergen').trim()
      const schema = (body.schema || 'evidence').trim()
      const volume = (body.volume || 'bundles').trim()
      const subdir = (body.subdir || '').trim() // e.g., manifest hash or date
      const files = Array.isArray(body.files) ? body.files as Array<{ name: string; base64: string }> : []
      // dbfs path for volumes: dbfs:/Volumes/<catalog>/<schema>/<volume>/...
      const base = `dbfs:/Volumes/${catalog}/${schema}/${volume}` + (subdir ? `/${subdir}` : '')
      await dbfsMkdirs(base)
      for (const f of files) {
        await dbfsPut(`${base}/${f.name}`, f.base64, true)
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true, path: base, files: files.map(f=>f.name) }) }
    }

    if (action === 'setTableComment' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) as Json : {}
      const fullName = String(body.full_name || '')
      const comment = String(body.comment || '')
      if (!fullName || !comment) return { statusCode: 400, body: 'full_name and comment required' }
      const res = await setObjectComment('tables', fullName, comment)
      return { statusCode: 200, body: JSON.stringify({ ok: true, table: res }) }
    }

    if (action === 'setObjectComment' && event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) as Json : {}
      const type = (String(body.object_type || 'tables') as any)
      const fullName = String(body.full_name || '')
      const comment = String(body.comment || '')
      if (!fullName || !comment) return { statusCode: 400, body: 'object_type, full_name and comment required' }
      const res = await setObjectComment(type, fullName, comment)
      return { statusCode: 200, body: JSON.stringify({ ok: true, object: res }) }
    }

    if (action === 'grantVolume') {
      const catalog = (event.queryStringParameters?.catalog || 'aethergen').trim()
      const schema = (event.queryStringParameters?.schema || 'evidence').trim()
      const volume = (event.queryStringParameters?.volume || 'bundles').trim()
      const principal = (event.queryStringParameters?.principal || 'users').trim()
      const privs = (event.queryStringParameters?.privileges || 'READ_VOLUME,WRITE_VOLUME').split(',').map(p => p.trim()).filter(Boolean)
      const res = await grantVolumePermissions(catalog, schema, volume, principal, privs)
      return { statusCode: 200, body: JSON.stringify({ ok: true, granted: { catalog, schema, volume, principal, privileges: privs }, response: res }) }
    }

    if (action === 'bootstrapManaged') {
      // Required: abfss base url (container root) and access connector id
      // Example abfss: 'abfss://ucroot@aethergenucsa.dfs.core.windows.net/'
      const abfss = String(event.queryStringParameters?.abfss || '').trim()
      const accessConnectorId = String(event.queryStringParameters?.access_connector_id || '').trim()
      if (!abfss || !accessConnectorId) return { statusCode: 400, body: 'abfss and access_connector_id are required' }

      const credName = (event.queryStringParameters?.credential_name || 'uc_cred').trim()
      const locName = (event.queryStringParameters?.external_location_name || 'ucroot_loc').trim()
      const catalog = (event.queryStringParameters?.catalog || 'aethergen').trim()
      const schema = (event.queryStringParameters?.schema || 'evidence').trim()
      const volume = (event.queryStringParameters?.volume || 'bundles').trim()

      const managedSubdir = (event.queryStringParameters?.managed_subdir || 'uc-managed').trim()
      const managedUrl = abfss.endsWith('/') ? `${abfss}${managedSubdir}` : `${abfss}/${managedSubdir}`

      const cred = await ensureStorageCredentialAzureMI(credName, accessConnectorId)
      const ext = await ensureExternalLocation(locName, abfss, credName)
      const cat = await ensureCatalogWithManagedLocation(catalog, managedUrl)
      const sch = await ensureSchema(catalog, schema)
      const vol = await ensureVolume(catalog, schema, volume)

      return { statusCode: 200, body: JSON.stringify({ ok: true, credential: cred, external_location: ext, catalog: cat, schema: sch, volume: vol, managed_location: managedUrl }) }
    }

    return { statusCode: 400, body: 'unknown action' }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'error' }
  }
}

export { handler }


