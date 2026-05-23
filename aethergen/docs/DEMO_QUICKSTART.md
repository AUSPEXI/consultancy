Set-Content -Path docs/DEMO_QUICKSTART.md -Encoding UTF8 -Value "# AethergenAI Demo Quickstart (Elastic Transfer + CODA)

## 1) Web App (Model Lab)
- Go to `#/modellab`.
- Set Rows, Fraud rate (e.g., 0.03), and Seed.
- Controls: Window Energy, Allocate Every, Use Elastic Transfer, Use Deep AE.
- Click Generate → Train. Watch Energy Ledger, Loss chart, Collision graph.
- Export: CSV, Model Card, Evidence (includes Energy Ledger).

## 2) PyTorch Notebook (GPU/Databricks)
- Open `notebooks/coda_elastic_pytorch.ipynb` and run all cells.
- Exports:
  - JSON: `energy_ledger.json` (override with env `LEDGER_JSON_PATH`).
  - Delta (if Spark available): table `aethergen.energy_ledger`.

## 3) Evidence & KPIs
- Steps‑to‑target reduction vs. baseline (AetherCradle).
- CODA efficiency at equal validation metrics.
- DP budget composition within guardrails.

## 4) Code Pointers
- Elastic Transfer: `src/services/elasticTransfer.ts`, `src/services/loraBridge.ts`
- CODA: `src/services/codaScheduler.ts`, `src/services/trainerWrapper.ts`
- Ledger types: `src/types/energyLedger.ts`
- Model Lab UI: `src/components/ModelLab/*`

## 5) Next Steps
- Replace LoRA bridge stub with module‑wise mapping and real moment projection.
- Wire CODA into production trainers (sampler weights + per‑step LR scale).
- Add dashboards over `aethergen.energy_ledger` and include in Marketplace packaging."