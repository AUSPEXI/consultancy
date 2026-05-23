# Databricks notebook source
# COMMAND ----------

"""
02_schema_seed.py — Define Delta schema for automotive QC and create a small seed and preview.

Widgets:
- catalog_name, schema_name, dataset_name
- delta_base_uri: external storage base (e.g., s3://bucket/delta)
- preview_percent: default 1
"""

# COMMAND ----------

from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, TimestampType
from pyspark.sql import functions as F
import datetime as _dt

dbutils.widgets.text("catalog_name", "aethergen", "catalog_name")
dbutils.widgets.text("schema_name", "automotive", "schema_name")
dbutils.widgets.text("dataset_name", "material_defect_v1", "dataset_name")
dbutils.widgets.text("delta_base_uri", "", "delta_base_uri")
dbutils.widgets.text("preview_percent", "1", "preview_percent")

catalog = dbutils.widgets.get("catalog_name").strip()
schema = dbutils.widgets.get("schema_name").strip()
dataset = dbutils.widgets.get("dataset_name").strip()
delta_base = dbutils.widgets.get("delta_base_uri").strip().rstrip("/")
preview_percent = float(dbutils.widgets.get("preview_percent").strip() or "1")

# Ensure Spark context is available (do not create one in Databricks)
try:
  _ = spark.version  # type: ignore
except Exception as e:
  raise RuntimeError("Spark context is not available. Attach notebook to a running cluster.") from e

full_table = f"{catalog}.{schema}.{dataset}"
delta_uri = f"{delta_base}/{dataset}/" if delta_base else None

schema_def = StructType([
  StructField("ts", TimestampType(), True),
  StructField("line_id", StringType(), True),
  StructField("station_id", StringType(), True),
  StructField("camera_id", StringType(), True),
  StructField("part_serial", StringType(), True),
  StructField("surface_roughness", DoubleType(), True),
  StructField("scratch_length_mm", DoubleType(), True),
  StructField("dent_depth_mm", DoubleType(), True),
  StructField("temperature_c", DoubleType(), True),
  StructField("humidity_pct", DoubleType(), True),
  StructField("defect_label", IntegerType(), True) # 0/1
])

# Generate tiny seed (use Python datetimes, not Spark column expressions)
now = _dt.datetime.utcnow()
seed_rows = [
  (now, "L1", "S1", "C1", "PS-0001", 0.22, 0.0, 0.0, 22.1, 45.0, 0),
  (now, "L1", "S1", "C2", "PS-0002", 0.28, 1.2, 0.0, 22.5, 44.5, 1),
  (now, "L1", "S2", "C3", "PS-0003", 0.20, 0.0, 0.4, 22.7, 44.8, 1),
  (now, "L2", "S3", "C4", "PS-0004", 0.18, 0.0, 0.0, 21.9, 46.2, 0)
]
seed_df = spark.createDataFrame(seed_rows, schema_def)

spark.sql(f"CREATE CATALOG IF NOT EXISTS {catalog}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {catalog}.{schema}")

if delta_uri:
  (seed_df.write.format("delta").mode("overwrite").save(delta_uri))
  spark.sql(f"CREATE TABLE IF NOT EXISTS {full_table} USING DELTA LOCATION '{delta_uri}'")
else:
  try:
    spark.sql(f"TRUNCATE TABLE {full_table}")
  except Exception:
    pass
  (seed_df.write.format("delta").mode("append").saveAsTable(full_table))

preview_table = f"{full_table}_preview"
spark.sql(
  f"CREATE OR REPLACE TABLE {preview_table} AS SELECT * FROM {full_table} TABLESAMPLE ({preview_percent} PERCENT)"
)

print({"seed_rows": seed_df.count(), "table": full_table, "preview": preview_table})


