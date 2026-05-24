export type MetricsRun = { ok: boolean; run_id?: string; error?: string }
export type MetricsState = { ok: boolean; state?: string; run?: any; error?: string }

export async function submitMetricsRun(datasetPath: string, ucVolumePath: string, config: unknown = {}): Promise<MetricsRun> {
  const res = await fetch(`.netlify/functions/metrics-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_path: datasetPath, uc_volume: ucVolumePath, config })
  })
  try { return await res.json() } catch { return { ok: false, error: 'bad_json' } }
}

export async function fetchMetricsResult(runId: string): Promise<MetricsState> {
  const res = await fetch(`.netlify/functions/metrics-result?run_id=${encodeURIComponent(runId)}`)
  try { return await res.json() } catch { return { ok: false, error: 'bad_json' } }
}


