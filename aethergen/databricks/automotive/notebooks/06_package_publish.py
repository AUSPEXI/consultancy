# Databricks notebook source
# COMMAND ----------

"""
06_package_publish.py — Assemble delivery manifest, SBOM placeholder, and link evidence.

Widgets:
- catalog_name, schema_name, dataset_name, model_name
- volume_uri: where to write package files (manifest.json, sbom.json, listing.json)
"""

# COMMAND ----------

import json, time

dbutils.widgets.text("catalog_name", "aethergen", "catalog_name")
dbutils.widgets.text("schema_name", "automotive", "schema_name")
dbutils.widgets.text("dataset_name", "material_defect_v1", "dataset_name")
dbutils.widgets.text("model_name", "aethergen.automotive.material_defect_detection_v1", "model_name")
dbutils.widgets.text("volume_uri", "", "volume_uri")

catalog = dbutils.widgets.get("catalog_name").strip()
schema = dbutils.widgets.get("schema_name").strip()
dataset = dbutils.widgets.get("dataset_name").strip()
model_name = dbutils.widgets.get("model_name").strip()
volume_uri = dbutils.widgets.get("volume_uri").strip().rstrip("/")

full_table = f"{catalog}.{schema}.{dataset}"
evidence_path = f"{volume_uri}/{dataset}_evidence.json" if volume_uri else ""

manifest = {
  "name": f"{dataset}",
  "catalog": catalog,
  "schema": schema,
  "table": full_table,
  "model": model_name,
  "version": f"v{int(time.time())}",
  "assets": {
    "evidence": evidence_path
  }
}

sbom = {
  "components": [
    {"name": "pyspark", "version": spark.version},
    {"name": "mlflow", "version": "2.x"}
  ],
  "licenses": [
    {"component": "pyspark", "license": "Apache-2.0"},
    {"component": "mlflow", "license": "Apache-2.0"}
  ]
}

listing = {
  "title": "Aethergen Automotive: Material Defect Detection v1",
  "tables": [full_table],
  "models": [model_name],
  "evidence": evidence_path,
  "docs": "See manifest and evidence for KPIs and limits."
}

if volume_uri:
  dbutils.fs.put(f"{volume_uri}/{dataset}_manifest.json", json.dumps(manifest, indent=2), True)
  dbutils.fs.put(f"{volume_uri}/{dataset}_sbom.json", json.dumps(sbom, indent=2), True)
  dbutils.fs.put(f"{volume_uri}/{dataset}_listing.json", json.dumps(listing, indent=2), True)
  print({"written": True, "volume_uri": volume_uri})
else:
  print({"written": False, "reason": "no volume_uri"})


