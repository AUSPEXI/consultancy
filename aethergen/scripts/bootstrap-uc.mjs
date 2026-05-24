import { execSync } from 'node:child_process'
import fetch from 'node-fetch'

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim()
}

const WORKSPACE_RG = process.env.AZURE_RG || 'aethergen-rg'
const WORKSPACE_NAME = process.env.DATABRICKS_WORKSPACE || 'aethergen-dbx-ws-dev'
const ACCESS_CONNECTOR_ID = process.env.ACCESS_CONNECTOR_ID || '/subscriptions/7c168ac1-1f03-495e-b1fa-de1f0d69d2a0/resourceGroups/aethergen-dbx-ws-dev-mrg/providers/Microsoft.Databricks/accessConnectors/unity-catalog-access-connector'
const ABFSS_BASE = process.env.ABFSS_BASE || 'abfss://ucroot@aethergenucsa.dfs.core.windows.net/'
const CATALOG = process.env.UC_CATALOG || 'aethergen'
const SCHEMA = process.env.UC_SCHEMA || 'evidence'
const VOLUME = process.env.UC_VOLUME || 'bundles'
const MANAGED_SUBDIR = process.env.UC_MANAGED_SUBDIR || 'uc-managed'
const CRED_NAME = process.env.UC_CRED_NAME || 'uc_cred'
const EXT_LOC_NAME = process.env.UC_EXT_LOC || 'ucroot_loc'

function getHost() {
  const fromEnv = process.env.DATABRICKS_HOST
  if (fromEnv) return fromEnv
  const url = sh(`az databricks workspace show -g ${WORKSPACE_RG} -n ${WORKSPACE_NAME} --query workspaceUrl -o tsv`)
  return `https://${url}`
}

function getToken() {
  const fromEnv = process.env.DATABRICKS_TOKEN
  if (fromEnv) return fromEnv
  return sh(`az account get-access-token --resource 2ff814a6-3304-4ab8-85cb-cd0e6f879c1d --query accessToken -o tsv`)
}

const HOST = getHost()
const TOKEN = getToken()

async function api(path, method, body) {
  const url = `${HOST}${path.startsWith('/api/') ? '' : '/api/2.1'}${path}`
  const res = await fetch(url, {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=> '')
    // 409 (already exists) is acceptable for idempotency
    if (res.status === 409) return { ok: true, status: 409, conflict: true, message: txt }
    throw new Error(`${res.status} ${res.statusText}: ${txt}`)
  }
  return res.status === 204 ? null : res.json()
}

async function ensureStorageCredentialAzureMI(name, accessConnectorId) {
  try { return await api(`/unity-catalog/storage-credentials/${encodeURIComponent(name)}`, 'GET') } catch {}
  return api(`/unity-catalog/storage-credentials`, 'POST', {
    name,
    comment: 'Managed by AethergenPlatform (Access Connector)',
    azure_managed_identity: { access_connector_id: accessConnectorId },
  })
}

async function ensureExternalLocation(name, urlStr, credentialName) {
  try { return await api(`/unity-catalog/external-locations/${encodeURIComponent(name)}`, 'GET') } catch {}
  return api(`/unity-catalog/external-locations`, 'POST', {
    name,
    url: urlStr,
    credential_name: credentialName,
    comment: 'UC external location (Managed by AethergenPlatform)'
  })
}

async function ensureCatalogWithManagedLocation(name, managedUrl) {
  try { return await api(`/unity-catalog/catalogs/${encodeURIComponent(name)}`, 'GET') } catch {}
  return api(`/unity-catalog/catalogs`, 'POST', { name, comment: 'Managed by AethergenPlatform', storage_root: managedUrl })
}

async function ensureSchema(catalog, schema) {
  try { return await api(`/unity-catalog/schemas/${encodeURIComponent(catalog)}.${encodeURIComponent(schema)}`, 'GET') } catch {}
  return api(`/unity-catalog/schemas`, 'POST', { name: schema, catalog_name: catalog, comment: 'Managed by AethergenPlatform' })
}

async function ensureVolume(catalog, schema, volume) {
  try { return await api(`/unity-catalog/volumes/${encodeURIComponent(catalog)}.${encodeURIComponent(schema)}.${encodeURIComponent(volume)}`, 'GET') } catch {}
  return api(`/unity-catalog/volumes`, 'POST', { name: volume, catalog_name: catalog, schema_name: schema, volume_type: 'MANAGED', comment: 'Evidence volume (managed)' })
}

async function main() {
  const managedUrl = ABFSS_BASE.endsWith('/') ? `${ABFSS_BASE}${MANAGED_SUBDIR}` : `${ABFSS_BASE}/${MANAGED_SUBDIR}`

  const cred = await ensureStorageCredentialAzureMI(CRED_NAME, ACCESS_CONNECTOR_ID)
  const ext = await ensureExternalLocation(EXT_LOC_NAME, ABFSS_BASE, CRED_NAME)
  const cat = await ensureCatalogWithManagedLocation(CATALOG, managedUrl)
  const sch = await ensureSchema(CATALOG, SCHEMA)
  const vol = await ensureVolume(CATALOG, SCHEMA, VOLUME)

  console.log(JSON.stringify({ ok: true, host: HOST, credential: cred, external_location: ext, catalog: cat, schema: sch, volume: vol, managed_location: managedUrl }, null, 2))
}

main().catch(err => { console.error(err.message || String(err)); process.exit(1) })


