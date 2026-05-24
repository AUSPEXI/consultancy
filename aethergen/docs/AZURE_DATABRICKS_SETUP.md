# Azure Databricks Setup – Cluster & Products

## Cluster
- Workspace: create or select
- Compute: New cluster
  - Runtime: latest LTS ML runtime
  - Nodes: small (for eval) or per customer policy
  - Libraries: `mlflow`, `pyspark`, `requests`

## Access
- Service principal with workspace access
- PAT token for API jobs (store in key vault)

## Artifacts
- Create jobs for:
  - Anchor extraction notebook (public/notebooks/anchor_extractor.py)
  - Acceptance checks notebook (public/notebooks/acceptance_checks.py)
- Configure job params (dataset paths, output locations)

## Products (Marketplace)
- Package dataset/model with evidence artifacts
- Use Unity Catalog; attach lineage/evidence summary
- Listing checklist: description, pricing, license, support, evidence link

## Next Steps
- Add PAT and workspace URL to Netlify env vars if functions will call jobs
- Dry‑run the two notebooks end‑to‑end; export evidence ZIP
