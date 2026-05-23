# Databricks notebook script to compare baseline vs context runs and write results.json
# Parameters:
# - baseline_path: path to metrics/artifacts for baseline run
# - context_path: path to metrics/artifacts for context-conditioned run
# - out_path: UC Volume/DBFS path to write combined results.json

import json
from datetime import datetime

dbutils.widgets.text('baseline_path', '')
dbutils.widgets.text('context_path', '')
dbutils.widgets.text('out_path', '')

baseline_path = dbutils.widgets.get('baseline_path')
context_path = dbutils.widgets.get('context_path')
out_path = dbutils.widgets.get('out_path')

def read_json(p):
  try:
    data = dbutils.fs.head(p, 1024 * 1024)
    return json.loads(data)
  except Exception as e:
    return None

# Replace these with your actual metric file locations produced by your training/eval notebooks
base_metrics = read_json(f"{baseline_path}/metrics.json") or {}
ctx_metrics  = read_json(f"{context_path}/metrics.json") or {}

# Compute deltas and summaries (example structure)
def get(m, k, d=None):
  v = m
  for part in k.split('.'):
    v = v.get(part, {}) if isinstance(v, dict) else {}
  return v if v != {} else d

utility_base = get(base_metrics, 'utility_at_op.value', None)
utility_ctx  = get(ctx_metrics,  'utility_at_op.value', None)

context_stability = {
  'max_delta': get(ctx_metrics, 'context_stability.max_delta', None)
}

invariance = {
  'gap_before': get(base_metrics, 'invariance.gap', None),
  'gap_after':  get(ctx_metrics,  'invariance.gap', None),
  'improvement': None
}
if invariance['gap_before'] is not None and invariance['gap_after'] is not None:
  try:
    invariance['improvement'] = float(invariance['gap_before']) - float(invariance['gap_after'])
  except:
    pass

counterfactual = get(ctx_metrics, 'counterfactual', { 'avg_shift': None, 'max_shift': None, 'tests': [] })

results = {
  'generated_at': datetime.utcnow().isoformat() + 'Z',
  'baseline_path': baseline_path,
  'context_path': context_path,
  'utility_at_op': {
    'baseline': utility_base,
    'context': utility_ctx
  },
  'stability': context_stability,
  'invariance': invariance,
  'counterfactual': counterfactual
}

dbutils.fs.put(out_path.rstrip('/') + '/results.json', json.dumps(results, indent=2), overwrite=True)
print('Wrote combined results to', out_path)


