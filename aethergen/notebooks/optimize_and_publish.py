# Databricks notebook source
# COMMAND ----------

"""
Optimize & Publish — AethergenAI Delta hardening and preview regeneration

What this does:
- Runs OPTIMIZE and Z-ORDER on a target Delta table
- Rebuilds the preview table via TABLESAMPLE
- Optionally bumps simple properties and a refreshed_at timestamp in evidence JSON

Widgets:
- full_table_name: e.g., aethergen.public.healthcare_synth_v1
- preview_percent: e.g., 1
- preview_suffix: default _preview
"""

# COMMAND ----------

dbutils.widgets.text("full_table_name", "aethergen.public.healthcare_synth_v1", "full_table_name")
dbutils.widgets.text("preview_percent", "1", "preview_percent")
dbutils.widgets.text("preview_suffix", "_preview", "preview_suffix")

full_table_name = dbutils.widgets.get("full_table_name").strip()
preview_percent = dbutils.widgets.get("preview_percent").strip()
preview_suffix = dbutils.widgets.get("preview_suffix").strip()

try:
    percent = float(preview_percent)
except Exception:
    percent = 1.0

if percent <= 0:
    percent = 1.0
if percent > 100:
    percent = 100.0

preview_table_name = f"{full_table_name}{preview_suffix}"

print({
    "full_table_name": full_table_name,
    "preview_table_name": preview_table_name,
    "preview_percent": percent,
})

# COMMAND ----------

print("OPTIMIZE + ZORDER ...")
spark.sql(f"OPTIMIZE {full_table_name}")

# Heuristic: try to Z-ORDER by common filter dimensions if they exist.
zorder_candidates = ["event_date", "region", "partition_date", "id", "patient_id_hash", "account_id"]
cols = [f.name for f in spark.table(full_table_name).schema.fields]
zorder_by = [c for c in zorder_candidates if c in cols]

if zorder_by:
    cols_expr = ", ".join(zorder_by[:3])
    spark.sql(f"OPTIMIZE {full_table_name} ZORDER BY ({cols_expr})")
    print({"zorder_by": zorder_by[:3]})
else:
    print("No Z-ORDER columns found; skipped ZORDER.")

# COMMAND ----------

print("Rebuilding preview table ...")
spark.sql(
    f"CREATE OR REPLACE TABLE {preview_table_name} AS "
    f"SELECT * FROM {full_table_name} TABLESAMPLE ({percent} PERCENT)"
)

cnt = spark.table(preview_table_name).count()
print({"preview_rows": cnt})

# COMMAND ----------

print("Done. Suggested next steps: add to Marketplace listing or refresh existing listing preview.")


