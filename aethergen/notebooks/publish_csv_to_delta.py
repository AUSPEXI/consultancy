# Databricks notebook source
# COMMAND ----------

"""
Publisher Notebook (Python) — AethergenAI → Databricks Delta + Marketplace

Usage (in Databricks):
1) Import this .py as a notebook, or copy into a new Python notebook.
2) Set the widgets below (dataset_name, landing_uri, etc.).
3) Run all cells. It will:
   - Load CSV(s) from landing_uri
   - Write Delta to delta_base_uri/dataset_name/
   - Register table in Unity Catalog
   - Add comments + properties (privacy settings, synthetic ratio, evidence URI)
   - Create a preview table via TABLESAMPLE
   - Emit a lightweight profile JSON (saved to evidence_uri)

Notes:
- Requires a Unity Catalog-enabled workspace and a Storage Credential/External Location
  that grants access to delta_base_uri and evidence_uri locations.
- This notebook assumes CSV input (header=true, inferSchema=true). Adjust for JSON/Parquet if needed.
"""

# COMMAND ----------

# Widgets for parameterization
dbutils.widgets.text("dataset_name", "healthcare_synth_v1", "dataset_name")
dbutils.widgets.text("landing_uri", "s3://your-landing-bucket/healthcare_v1/*.csv", "landing_uri")
dbutils.widgets.text("delta_base_uri", "s3://your-datasets-bucket", "delta_base_uri")
dbutils.widgets.text("catalog_name", "aethergen", "catalog_name")
dbutils.widgets.text("schema_name", "public", "schema_name")
dbutils.widgets.text("version", "v1", "version")
dbutils.widgets.text("privacy_level", "high", "privacy_level")
dbutils.widgets.text("synthetic_ratio", "0.98", "synthetic_ratio")
dbutils.widgets.text("epsilon", "1.0", "epsilon")
dbutils.widgets.text("evidence_uri", "s3://your-evidence-bucket/healthcare_v1.json", "evidence_uri")
dbutils.widgets.text("preview_percent", "1", "preview_percent")

# COMMAND ----------

from pyspark.sql import functions as F
from pyspark.sql import DataFrame

dataset_name = dbutils.widgets.get("dataset_name").strip()
landing_uri = dbutils.widgets.get("landing_uri").strip()
delta_base_uri = dbutils.widgets.get("delta_base_uri").strip().rstrip("/")
catalog_name = dbutils.widgets.get("catalog_name").strip()
schema_name = dbutils.widgets.get("schema_name").strip()
version = dbutils.widgets.get("version").strip()
privacy_level = dbutils.widgets.get("privacy_level").strip()
synthetic_ratio = dbutils.widgets.get("synthetic_ratio").strip()
epsilon = float(dbutils.widgets.get("epsilon").strip() or "1.0")
evidence_uri = dbutils.widgets.get("evidence_uri").strip()
preview_percent_str = dbutils.widgets.get("preview_percent").strip()

try:
    preview_percent = float(preview_percent_str)
except Exception:
    preview_percent = 1.0

if preview_percent <= 0:
    preview_percent = 1.0
if preview_percent > 100:
    preview_percent = 100.0

delta_uri = f"{delta_base_uri}/{dataset_name}/"
full_table_name = f"{catalog_name}.{schema_name}.{dataset_name}"
preview_table_name = f"{full_table_name}_preview"

print("Parameters:")
print({
    "dataset_name": dataset_name,
    "landing_uri": landing_uri,
    "delta_uri": delta_uri,
    "catalog_name": catalog_name,
    "schema_name": schema_name,
    "version": version,
    "privacy_level": privacy_level,
    "synthetic_ratio": synthetic_ratio,
    "evidence_uri": evidence_uri,
    "preview_percent": preview_percent,
})

# COMMAND ----------

# Load CSV → Delta
print("Loading CSV from landing_uri ...")
df: DataFrame = (
    spark.read
    .option("header", "true")
    .option("inferSchema", "true")
    .csv(landing_uri)
)

record_count = df.count()
print(f"Loaded rows: {record_count}")

print(f"Writing Delta to {delta_uri} ...")
(
    df.write
    .format("delta")
    .mode("overwrite")
    .save(delta_uri)
)

# COMMAND ----------

# Register table in Unity Catalog
print("Registering table in Unity Catalog ...")
spark.sql(f"CREATE CATALOG IF NOT EXISTS {catalog_name}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {catalog_name}.{schema_name}")
spark.sql(f"CREATE TABLE IF NOT EXISTS {full_table_name} USING DELTA LOCATION '{delta_uri}'")

comment = (f"Synthetic dataset {dataset_name}; eps={epsilon}; evidence attached.")
spark.sql(f"COMMENT ON TABLE {full_table_name} IS '{comment}'")

tblprops = (
    f"ALTER TABLE {full_table_name} SET TBLPROPERTIES ("
    f"  'aethergen.version'='{version}',"
    f"  'aethergen.privacy'='{{\"epsilon\":{epsilon},\"synthetic_ratio\":{synthetic_ratio}}}',"
    f"  'aethergen.evidence_uri'='{evidence_uri}'"
    f")"
)
spark.sql(tblprops)

# COMMAND ----------

# Create preview table via TABLESAMPLE
print(f"Creating preview table at {preview_table_name} ...")
spark.sql(
    f"CREATE OR REPLACE TABLE {preview_table_name} AS "
    f"SELECT * FROM {full_table_name} TABLESAMPLE ({preview_percent} PERCENT)"
)

preview_count = spark.table(preview_table_name).count()
print({"preview_rows": preview_count})

# COMMAND ----------

# Emit lightweight profile JSON (summary statistics)
print("Generating profile JSON ...")
summary_pdf = df.summary().toPandas()
profile_json = summary_pdf.to_json(orient="records")

try:
    # dbutils.fs.put supports direct cloud URIs when workspace has appropriate permissions.
    dbutils.fs.put(evidence_uri, profile_json, True)
    print(f"Wrote profile JSON to {evidence_uri}")
except Exception as e:
    fallback_path = f"/FileStore/aethergen/evidence/{dataset_name}_profile.json"
    dbutils.fs.put(fallback_path, profile_json, True)
    print(
        "Could not write to evidence_uri; wrote to DBFS fallback instead.",
        {"fallback": fallback_path, "error": str(e)},
    )

# COMMAND ----------

print("Done. Next steps:")
print("1) Verify the tables exist and are queryable:")
print(f"   SELECT COUNT(*) FROM {full_table_name};")
print(f"   SELECT * FROM {preview_table_name} LIMIT 10;")
print("2) Go to Marketplace → Create listing → Add these tables (full + preview).")
print("3) Attach evidence bundle (JSON/PDF), README, and a getting-started notebook.")
print("4) Set pricing/terms, submit for review.")


