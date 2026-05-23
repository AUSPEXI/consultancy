# Databricks notebook source
# COMMAND ----------

"""
01_setup_uc.py — Create/ensure Unity Catalog catalog, schema, and (optional) external Volume.

Widgets:
- catalog_name: e.g., aethergen
- schema_name: e.g., automotive
- volume_name: e.g., automotive_assets
- external_location_uri: optional, e.g., s3://your-bucket/aethergen/automotive/
"""

# COMMAND ----------

dbutils.widgets.text("catalog_name", "aethergen", "catalog_name")
dbutils.widgets.text("schema_name", "automotive", "schema_name")
dbutils.widgets.text("volume_name", "automotive_assets", "volume_name")
dbutils.widgets.text("external_location_uri", "", "external_location_uri")

catalog = dbutils.widgets.get("catalog_name").strip()
schema = dbutils.widgets.get("schema_name").strip()
volume = dbutils.widgets.get("volume_name").strip()
external_uri = dbutils.widgets.get("external_location_uri").strip()

# Ensure Spark context is available (do not create one in Databricks)
try:
  _ = spark.version  # type: ignore
except Exception as e:
  raise RuntimeError("Spark context is not available. Attach notebook to a running cluster.") from e

print({
  "catalog": catalog,
  "schema": schema,
  "volume": volume,
  "external_location_uri": external_uri
})

# COMMAND ----------

# Create catalog and schema
spark.sql(f"CREATE CATALOG IF NOT EXISTS {catalog}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {catalog}.{schema}")

# Create a volume: external if URI provided, else managed (fallback to plain CREATE VOLUME)
created = False
if external_uri:
  try:
    spark.sql(f"CREATE VOLUME IF NOT EXISTS {catalog}.{schema}.{volume} LOCATION '{external_uri}'")
    print({"volume_created": True, "mode": "external", "uri": external_uri})
    created = True
  except Exception as e:
    print({"volume_external_failed": str(e)})
if not created:
  try:
    # Newer syntax
    spark.sql(f"CREATE MANAGED VOLUME IF NOT EXISTS {catalog}.{schema}.{volume}")
    print({"volume_created": True, "mode": "managed"})
    created = True
  except Exception as e:
    print({"managed_syntax_failed": str(e)})
  if not created:
    try:
      # Fallback syntax (equivalent managed volume)
      spark.sql(f"CREATE VOLUME IF NOT EXISTS {catalog}.{schema}.{volume}")
      print({"volume_created": True, "mode": "managed_fallback"})
      created = True
    except Exception as e:
      print({"volume_created": False, "error": str(e)})

# COMMAND ----------

print("Unity Catalog setup complete.")


