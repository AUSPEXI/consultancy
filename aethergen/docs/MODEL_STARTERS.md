# Model Starters

Prefilled configurations to bootstrap common model types. Each starter includes defaults for SLOs, Risk Guard/Context Engine hooks, and evidence export.

## Starters
- LLM: text generation with Context Engine and Risk Guard; evidence ZIP
- SLM (On‑Device): small model routing with fallback SLOs
- LAM (Agents): plan/act loop, typed tool I/O, error normalization
- MoE: policy/score router with per‑expert thresholds
- VLM: image+text prompts, citation‑ready span packing
- MLM (Embeddings): retrieval pipeline with P@k/nDCG harness
- LCM (Images): fast image gen placeholder with device guardrails
- SAM (Segmentation): mask viewer/export, IoU evidence

## Evidence Hooks
- context_provenance.json appended with signals and included sources
- crypto_profile.json records hash/signature/KEM posture

## SLO Defaults
- latency.p95_ms, coverage target, max_fallback_rate (on device), privacy probes enabled

## Next Steps
- Add per‑starter quickstarts in UI and plug into Marketplace flows.

