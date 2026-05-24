import { useMemo } from 'react'

export function useOnDeviceSLOHooks() {
  return useMemo(() => {
    const url = '/blog/on-device-ai-slos-hybrid-routing'
    const title = 'On‑Device AI: Hybrid Routing & SLOs'
    const hook1 = `Run smarter on phones and edge: cap fallback rate, battery per inference, and thermal delta. Hybrid routing prefers CPU/NPU, promotes to cloud when safe. ${url}`
    const hook2 = `Hybrid on‑device AI that holds the line: fallback ≤15%, battery budget per request, thermal guardrails. Evidence‑ready. ${url}`
    return { title, url, hooks: [hook1, hook2] }
  }, [])
}

export function useRiskGuardHooks() {
  return useMemo(() => {
    const url = '/blog/hallucination-risk-guard-pre-generation'
    const title = 'Pre‑generation Hallucination Risk Guard'
    const hook1 = `Catch risk before generation: estimate uncertainty, calibrate a threshold for ≤5% hallucination rate, then fetch context or abstain. ${url}`
    const hook2 = `Evidence‑led guard for LLMs: risk score → policy (generate, fetch, abstain, reroute). Bound errors with a calibrated threshold. ${url}`
    return { title, url, hooks: [hook1, hook2] }
  }, [])
}
