### Package and List on Databricks Marketplace

Concise runbook to package schema, seed, synthetic data, and models; upload to Databricks (Unity Catalog); and publish a Marketplace listing.

### Prerequisites
- Supabase + Netlify Functions configured (service role set).
- Databricks workspace with Unity Catalog (UC) enabled and a cluster/SQL warehouse with UC access.
- Databricks CLI configured with a PAT:
```bash
databricks configure --host https://<your-workspace-host> --token
```
- Provider permissions in Databricks Marketplace.

### 1) Prepare assets in Aethergen Platform
#### 1.1 Schema
- Export schema from the `Models` tab (Templates Library) or via API:
```bash
curl -sS "https://<your-site>/.netlify/functions/templates?action=list" \
  -H "Accept: application/json" > templates.json
```

#### 1.2 Seed and synthetic datasets
- In `Upload / Seed`, upload or generate a seed; click “Save to Datasets.”
- In `Generate Data`, generate synthetic data and “Save to Datasets.”
- Optionally “Verify Proof” and record Evidence.
- Bundle the latest dataset version for delivery:
```bash
# List datasets
curl -sS "https://<your-site>/.netlify/functions/datasets?action=list" > datasets.json

# Download a bundle (replace DATASET_ID with an ID from datasets.json)
curl -sS -H "Accept: application/zip" \
  "https://<your-site>/.netlify/functions/datasets?action=bundle&dataset_id=DATASET_ID&format=zip" \
  --output dataset_bundle.zip
```
- Bundle contents: `manifest.json` (name, version, row_count, byte_size, checksum), `proof.json` (if present), `redacted_preview.json`.

#### 1.3 Models
- In `Models`, create a model and add a version (framework/format). For Databricks, register/log the model with MLflow later.
- Fetch model metadata (optional):
```bash
curl -sS "https://<your-site>/.netlify/functions/models?action=list" > models.json
```

### 2) Stage assets in Databricks storage (Unity Catalog Volume)
#### 2.1 Create UC Catalog/Schema/Volume (SQL)
Run in a SQL editor or Notebook:
```sql
CREATE CATALOG IF NOT EXISTS aethergen;
GRANT USAGE ON CATALOG aethergen TO `account users`;

CREATE SCHEMA IF NOT EXISTS aethergen.sales;
GRANT USAGE ON SCHEMA aethergen.sales TO `account users`;

CREATE VOLUME IF NOT EXISTS aethergen.sales.assets COMMENT 'Aethergen assets for Marketplace';
```

#### 2.2 Upload dataset bundle to Volume
Option A: CLI copying to Volumes via DBFS path
```bash
rm -rf ./stage && mkdir -p stage && unzip -o dataset_bundle.zip -d stage
databricks fs cp -r ./stage dbfs:/Volumes/aethergen/sales/assets/dataset_$(date +%s)
```
Option B: In a Notebook, drag-and-drop into `/Volumes/aethergen/sales/assets`.

### 3) Create Delta tables from the bundle
Use a Notebook (Python + SQL). Adjust loaders to your actual data files if present.
```python
from pyspark.sql import functions as F

base = "/Volumes/aethergen/sales/assets/dataset_latest"  # set to your uploaded folder
manifest_path = f"{base}/manifest.json"

man = spark.read.option("multiline","true").json(manifest_path).first()
display(man)

# If you staged raw rows (CSV/JSON/Parquet), load them instead of preview.
df_prev = spark.read.option("multiline","true").json(f"{base}/redacted_preview.json")
df = df_prev

target = "aethergen.sales.synthetic_data"
(df.write
   .format("delta")
   .mode("overwrite")
   .option("overwriteSchema","true")
   .saveAsTable(target))

spark.sql(f"COMMENT ON TABLE {target} IS 'Aethergen synthetic dataset. See manifest/proof in Volume.'")
spark.sql(f"ALTER TABLE {target} SET TBLPROPERTIES('aeg.manifest_path'='{manifest_path}')")
```
Optional: create a separate `aethergen.sales.seed_data` table for seed.

### 4) Register models in Unity Catalog via MLflow
Register/log your model and promote to a stage.
```python
import mlflow
from mlflow import MlflowClient
import sklearn
import numpy as np

mlflow.set_registry_uri("databricks-uc")
mlflow.set_experiment("/Users/<you>/aethergen_models")

with mlflow.start_run(run_name="aethergen_model"):
    from sklearn.linear_model import LogisticRegression
    X = np.array([[0,1],[1,0],[1,1],[0,0]])
    y = np.array([0,1,1,0])
    m = LogisticRegression().fit(X,y)
    mlflow.sklearn.log_model(m, "model")
    run_id = mlflow.active_run().info.run_id

model_name = "aethergen.sales.synthetic_model"
result = mlflow.register_model(f"runs:/{run_id}/model", model_name)

client = MlflowClient()
client.transition_model_version_stage(
    name=model_name, version=result.version, stage="Staging", archive_existing_versions=False
)
```
If you have ONNX/GGUF artifacts, place them in the Volume and log using the appropriate MLflow flavor (onnx/pyfunc/custom loader).

### 5) Build the Marketplace listing
In Databricks → Marketplace:
- Create/confirm your Provider.
- New Listing:
  - Title: Aethergen Synthetic Automotive Dataset + Model
  - Assets:
    - Tables: `aethergen.sales.synthetic_data` (and seed table if applicable)
    - Models: `aethergen.sales.synthetic_model`
    - Optional: usage Notebook(s)
  - Documentation: include data dictionary from `manifest.json`, privacy/zk‑UPB note.
  - Visibility/Terms/Pricing: configure as needed, then submit or share privately.

Tip: Reference proof/evidence bundle paths; call out Evidence Ledger and harness validation.

### 6) Validate as a consumer
Subscribe from a test workspace and verify:
```sql
SELECT * FROM aethergen.sales.synthetic_data LIMIT 10;
```
```python
import mlflow
model_uri = "models:/aethergen.sales.synthetic_model/Production"  # or Staging/Version
model = mlflow.pyfunc.load_model(model_uri)
# model.predict(...)
```

### 7) Automate updates (optional)
Job to refresh Volume/table and log a new model version.
```bash
curl -sS -H "Accept: application/zip" \
  "https://<your-site>/.netlify/functions/datasets?action=bundle&dataset_id=DATASET_ID&format=zip" \
  --output bundle.zip
unzip -o bundle.zip -d stage
databricks fs cp -r ./stage dbfs:/Volumes/aethergen/sales/assets/dataset_$(date +%s)

databricks jobs run-now --job-id <JOB_ID>
```

### 8) Quality guardrails checklist
- Seed: unique keys, balanced categories, PII redaction.
- Synthetic: target utility, privacy score, zk‑UPB proof present.
- Models: SBOM/license metadata, logged metrics, validation notebook.
- Listing: screenshots, docs, contact, change log.

### Minimal deliverables
- UC Volume with `manifest.json`, `proof.json`, preview.
- Delta table `aethergen.sales.synthetic_data`.
- UC registered model `aethergen.sales.synthetic_model`.
- Marketplace listing referencing both.

---

### Edge Packaging Toolchain (Offline/Edge)
Package models (ONNX/GGUF) for secure edge delivery with checksums, license, and SBOM.

#### Directory layout
```
edge_package/
  model/
    model.onnx | model.gguf
    LICENSE.txt
    sbom.json
    manifest.json
    checksums.txt
```

#### Create checksums
- Windows PowerShell:
```powershell
cd edge_package\model
Get-ChildItem -File | ForEach-Object {
  $h = Get-FileHash $_.FullName -Algorithm SHA256
  "$($h.Hash)  $($_.Name)" }
  | Out-File -Encoding ascii checksums.txt
```
- macOS/Linux:
```bash
cd edge_package/model
sha256sum * > checksums.txt  # or: shasum -a 256 * > checksums.txt
```

#### Minimal manifest.json (example)
```json
{
  "package_version": 1,
  "name": "aethergen-automotive-synth",
  "model": {
    "framework": "onnx",
    "format": "onnx",
    "quantization": "fp16",
    "filename": "model.onnx",
    "size_bytes": 123456789,
    "sha256": "<from checksums.txt>"
  },
  "license": {
    "spdx": "Apache-2.0",
    "file": "LICENSE.txt",
    "third_party": [
      { "name": "onnxruntime", "spdx": "MIT" }
    ]
  },
  "provenance": {
    "source": "Aethergen Platform",
    "sbom": "sbom.json",
    "build_time": "2025-08-27T12:00:00Z",
    "toolchain": {
      "node": ">=18",
      "python": ">=3.10"
    }
  }
}
```

Update `size_bytes` and `sha256` to match your file. Repeat `model` section for multi-file variants (e.g., GGUF + ONNX) if needed.

#### Example SBOM (CycloneDX minimal placeholder)
```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "metadata": { "component": { "name": "aethergen-automotive-synth", "type": "application" } },
  "components": [
    { "name": "onnxruntime", "version": "1.18.0", "licenses": [{ "license": { "id": "MIT" } }] }
  ]
}
```

#### Package as ZIP
- Windows PowerShell:
```powershell
Compress-Archive -Path edge_package\model\* -DestinationPath edge_package\aeg_edge_package.zip -Force
```
- macOS/Linux:
```bash
cd edge_package && zip -r aeg_edge_package.zip model/
```

#### Verify checksums after transfer
- Windows PowerShell:
```powershell
cd model
Get-Content checksums.txt | ForEach-Object {
  $parts = $_ -split '\\s+'; if ($parts.Length -ge 2) {
    $expected = $parts[0]; $file = $parts[1];
    $actual = (Get-FileHash $file -Algorithm SHA256).Hash;
    if ($actual -ne $expected) { Write-Error "Checksum mismatch: $file" }
  }
}
```
- macOS/Linux:
```bash
sha256sum -c checksums.txt
```

#### Notes
- Include quantization metadata (e.g., `q8_0`, `q4_k_m`) in `manifest.json` when distributing GGUF.
- Keep `LICENSE.txt` and any third-party notices with the package.
- Attach `aeg_edge_package.zip` to your Databricks Volume or deliver via your preferred channel; reference it in the Marketplace listing.


