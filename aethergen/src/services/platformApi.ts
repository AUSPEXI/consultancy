export type PlatformApiConfig = {
  base?: string // defaults to '/.netlify/functions'
  live?: boolean
}

class PlatformApi {
  private base: string
  private live: boolean

  constructor(cfg?: PlatformApiConfig) {
    this.base = (cfg?.base || '/.netlify/functions').replace(/\/$/, '')
    this.live = !!cfg?.live
  }

  isLive(): boolean { return this.live }
  setLive(live: boolean) { this.live = !!live }

  async post<T=any>(fn: string, body?: any): Promise<T> {
    const url = `${this.base}/${fn}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    })
    if (!res.ok) throw new Error(`Platform API ${fn} failed: ${res.status}`)
    return res.json()
  }

  async logMlflow(payload: {
    experiment_name?: string
    recipe_json?: any
    schema_json?: any
    summary?: any
    privacy?: any
  }): Promise<{ ok: boolean; experiment_id: string; run_id: string }> {
    return this.post('log-mlflow', payload)
  }
}

export const platformApi = new PlatformApi({
  base: (import.meta.env.VITE_PLATFORM_BASE || '/.netlify/functions'),
  live: String(import.meta.env.VITE_LIVE_MODE || '').toLowerCase() === 'true'
})
