CPU Runner (BitNet optional backend)
===================================

AethergenPlatform can optionally route lightweight gating and re‑ranking to a local CPU model runner.

- Client: `src/services/cpuRunnerService.ts`
- Proxy: `netlify/functions/cpu-runner-proxy.ts`
- UI: Stability & SLO demo → Selective Prediction → “Use CPU backend” toggle

When to use
----------
- Edge or air‑gapped hosts without GPUs
- Selective prediction gates to accept easy cases cheaply
- Retrieval re‑ranking prior to main inference

Environment variables
---------------------
- `VITE_CPU_RUNNER_URL` (frontend) — e.g., `http://localhost:8088`
- `CPU_RUNNER_BASE` (Netlify function) — e.g., `http://localhost:8088`

If unset, the proxy provides a safe, deterministic weighted‑score fallback for demos.

Local run (example)
-------------------
1. Start your CPU runner (e.g., BitNet HTTP wrapper) on `http://localhost:8088` exposing:
   - `POST /score` with `{ features: [{margin, entropy, retrieval}], weights? } → { scores: number[] }`
   - `POST /rerank` with `{ query, docs: string[] } → { order: number[] }`
2. Set env vars and run the site:
   - Windows PowerShell:
     ```powershell
     $env:VITE_CPU_RUNNER_URL = 'http://localhost:8088'
     $env:CPU_RUNNER_BASE = 'http://localhost:8088'
     npx --yes netlify dev --targetPort 5174 -c "npm run dev" | cat
     ```
3. Open Stability demo and enable the CPU backend toggle, then Calibrate.

Notes
-----
- We do not claim universal speed/energy outcomes. Measure on your workloads and hardware.
- Evidence bundles and UC comments remain the source of truth for audit.


