# Databricks notebook source
# COMMAND ----------

"""
03_synthetic_generate.py — Generate constrained synthetic automotive QC data, write Delta.

Widgets:
- catalog_name, schema_name, dataset_name
- delta_base_uri (optional)
- rows (default 100000)
"""

# COMMAND ----------

from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, TimestampType
import datetime as _dt

dbutils.widgets.text("catalog_name", "aethergen", "catalog_name")
dbutils.widgets.text("schema_name", "automotive", "schema_name")
dbutils.widgets.text("dataset_name", "material_defect_v1", "dataset_name")
dbutils.widgets.text("delta_base_uri", "", "delta_base_uri")
dbutils.widgets.text("rows", "20000", "rows")

catalog = dbutils.widgets.get("catalog_name").strip()
schema = dbutils.widgets.get("schema_name").strip()
dataset = dbutils.widgets.get("dataset_name").strip()
delta_base = dbutils.widgets.get("delta_base_uri").strip().rstrip("/")
rows = int(dbutils.widgets.get("rows").strip() or "100000")

# Ensure Spark context is available (do not create one in Databricks)
try:
  _ = spark.version  # type: ignore
except Exception as e:
  raise RuntimeError("Spark context is not available. Attach notebook to a running cluster.") from e

full_table = f"{catalog}.{schema}.{dataset}"
delta_uri = f"{delta_base}/{dataset}/" if delta_base else None

# Generate at the Spark side for reliability on serverless
base = spark.range(rows).withColumnRenamed("id", "idx")
df = (
  base
    .withColumn("ts", F.current_timestamp())
    .withColumn("line_id", F.concat(F.lit("L"), (F.col("idx") % F.lit(3)) + F.lit(1)))
    .withColumn("station_id", F.concat(F.lit("S"), (F.col("idx") % F.lit(5)) + F.lit(1)))
    .withColumn("camera_id", F.concat(F.lit("C"), (F.col("idx") % F.lit(7)) + F.lit(1)))
    .withColumn("part_serial", F.format_string("PS-%06d", F.col("idx")))
    # Distributions
    .withColumn("surface_roughness", F.greatest(F.lit(0.1), F.lit(0.22) + F.randn() * F.lit(0.05)))
    .withColumn("scratch_length_mm", F.when(F.rand() < 0.2, F.greatest(F.lit(0.0), F.lit(0.4) + F.randn() * F.lit(0.3))).otherwise(F.lit(0.0)))
    .withColumn("dent_depth_mm", F.when(F.rand() < 0.1, F.greatest(F.lit(0.0), F.lit(0.3) + F.randn() * F.lit(0.2))).otherwise(F.lit(0.0)))
    .withColumn("temperature_c", F.lit(22.0) + F.randn() * F.lit(1.0))
    .withColumn("humidity_pct", F.least(F.lit(60.0), F.greatest(F.lit(35.0), F.lit(45.0) + F.randn() * F.lit(3.0))))
    .withColumn("defect_label", ( (F.col("surface_roughness") > 0.27) | (F.col("scratch_length_mm") > 1.0) | (F.col("dent_depth_mm") > 0.5) ).cast("int"))
    .drop("idx")
)

if delta_uri:
  (df.write.format("delta").mode("overwrite").save(delta_uri))
  spark.sql(f"CREATE TABLE IF NOT EXISTS {full_table} USING DELTA LOCATION '{delta_uri}'")
else:
  try:
    spark.sql(f"CREATE TABLE IF NOT EXISTS {full_table} (ts TIMESTAMP, line_id STRING, station_id STRING, camera_id STRING, part_serial STRING, surface_roughness DOUBLE, scratch_length_mm DOUBLE, dent_depth_mm DOUBLE, temperature_c DOUBLE, humidity_pct DOUBLE, defect_label INT) USING DELTA")
    spark.sql(f"TRUNCATE TABLE {full_table}")
  except Exception:
    pass
  (df.coalesce(8).write.format("delta").mode("append").saveAsTable(full_table))

# Optimize & Z-Order on frequent predicates
try:
  spark.sql(f"OPTIMIZE {full_table} ZORDER BY (ts, line_id, station_id)")
except Exception:
  pass

print({"rows": rows, "table": full_table})


