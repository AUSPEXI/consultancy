# Databricks notebook source
# COMMAND ----------

"""
05_register_models.py — Train/log a simple model; register in MLflow (Unity Catalog).

Widgets:
- catalog_name, schema_name, dataset_name
- model_name (defaults to catalog.schema.material_defect_detection_v1)
"""

# COMMAND ----------

from pyspark.sql import functions as F
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.classification import LogisticRegression
import json
import time
try:
  import mlflow  # type: ignore
  _MLFLOW = True
except Exception:
  _MLFLOW = False

dbutils.widgets.text("catalog_name", "aethergen", "catalog_name")
dbutils.widgets.text("schema_name", "automotive", "schema_name")
dbutils.widgets.text("dataset_name", "material_defect_v1", "dataset_name")
dbutils.widgets.text("model_name", "", "model_name")
dbutils.widgets.text("volume_uri", "", "volume_uri")

catalog = dbutils.widgets.get("catalog_name").strip()
schema = dbutils.widgets.get("schema_name").strip()
dataset = dbutils.widgets.get("dataset_name").strip()
model_name = dbutils.widgets.get("model_name").strip() or f"{catalog}.{schema}.material_defect_detection_v1"
volume_uri = dbutils.widgets.get("volume_uri").strip().rstrip("/")

# Ensure Spark context is available (do not create one in Databricks)
try:
  _ = spark.version  # type: ignore
except Exception as e:
  raise RuntimeError("Spark context is not available. Attach notebook to a running cluster.") from e

full_table = f"{catalog}.{schema}.{dataset}"
df = spark.table(full_table).withColumn("label", F.col("defect_label").cast("double"))

features = ["surface_roughness","scratch_length_mm","dent_depth_mm","temperature_c","humidity_pct"]
va = VectorAssembler(inputCols=features, outputCol="features")
data = va.transform(df).select("features","label")
train, test = data.randomSplit([0.9, 0.1], seed=42)

lr = LogisticRegression(maxIter=50)
model = lr.fit(train)

summary = {
  "model_name": model_name,
  "trained_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
  "features": features,
}

if _MLFLOW:
  try:
    mlflow.set_registry_uri("databricks-uc")
    # Use shared path to avoid user-home permission issues on serverless
    mlflow.set_experiment("/Shared/aethergen/experiments")
    with mlflow.start_run(run_name="material_defect_detection_v1"):
      mlflow.spark.log_model(model, "model")
      run_id = mlflow.active_run().info.run_id
    registered = mlflow.register_model(f"runs:/{run_id}/model", model_name)
    print({"registered_model": model_name, "version": registered.version})
    summary["mlflow_run_id"] = run_id
    summary["registered_version"] = getattr(registered, 'version', None)
  except Exception as e:
    print({"mlflow_register_skipped": str(e)})
    if volume_uri:
      dbutils.fs.put(f"{volume_uri}/{dataset}_model_card.json", json.dumps(summary, indent=2), True)
else:
  print({"mlflow_unavailable": True})
  if volume_uri:
    dbutils.fs.put(f"{volume_uri}/{dataset}_model_card.json", json.dumps(summary, indent=2), True)


