export async function submitABExperiment(jobSpec?: any): Promise<{ ok: boolean; run_id?: string; error?: string }> {
  const res = await fetch(`.netlify/functions/ab-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_spec: jobSpec })
  })
  try { return await res.json() } catch { return { ok: false, error: 'bad_json' } }
}


