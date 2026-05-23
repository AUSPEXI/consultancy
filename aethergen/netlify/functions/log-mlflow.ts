import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const HOST = (process.env.DATABRICKS_HOST || '').replace(/\/?$/, '');
const TOKEN = process.env.DATABRICKS_TOKEN || '';
const DEFAULT_EXP = process.env.MLFLOW_EXPERIMENT_NAME || '/Shared/Aethergen';

async function api(path: string, body?: any) {
  const res = await fetch(`${HOST}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Databricks API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function ensureExperiment(name: string): Promise<string> {
  // get-by-name; if missing, create
  try {
    const got = await api('/api/2.0/mlflow/experiments/get-by-name', { experiment_name: name });
    return got.experiment.experiment_id as string;
  } catch {
    const created = await api('/api/2.0/mlflow/experiments/create', { name });
    return created.experiment_id as string;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!HOST || !TOKEN) return { statusCode: 500, body: 'Missing DATABRICKS_HOST or DATABRICKS_TOKEN' };
  try {
    const payload = JSON.parse(event.body || '{}');
    const experimentName = payload.experiment_name || DEFAULT_EXP;
    const recipe_json = payload.recipe_json || {};
    const schema_json = payload.schema_json || {};
    const summary = payload.summary || {};
    const privacy = payload.privacy || {};

    const experiment_id = await ensureExperiment(experimentName);

    const created = await api('/api/2.0/mlflow/runs/create', {
      experiment_id,
      start_time: Date.now(),
      tags: [{ key: 'source', value: 'AethergenAI' }]
    });
    const run_id = created.run.info.run_id as string;

    // Log params/tags
    const params: Array<{ key: string; value: string }> = [
      { key: 'recipe_hash', value: String(Math.abs(hash(JSON.stringify(recipe_json)))) },
      { key: 'schema_hash', value: String(Math.abs(hash(JSON.stringify(schema_json)))) },
      { key: 'epsilon', value: String(privacy.epsilon ?? '') },
      { key: 'synthetic_ratio', value: String(privacy.synthetic_ratio ?? '') }
    ];
    for (const p of params) {
      await api('/api/2.0/mlflow/runs/log-parameter', { run_id, key: p.key, value: p.value });
    }

    // Log metrics (flatten summary top-level numeric values)
    const metrics: Array<{ key: string; value: number; timestamp: number }> = [];
    const ts = Date.now();
    if (summary && typeof summary === 'object') {
      Object.entries(summary).forEach(([ablation, metricsObj]: any) => {
        if (metricsObj && typeof metricsObj === 'object') {
          Object.entries(metricsObj).forEach(([k, v]: any) => {
            if (typeof v === 'number') metrics.push({ key: `${ablation}.${k}`, value: v, timestamp: ts });
          });
        }
      });
    }
    // Batch if available
    if (metrics.length > 0) {
      await api('/api/2.0/mlflow/runs/log-batch', { run_id, metrics });
    }

    // Attach artifacts: store recipe and summary as params via log-dict equivalent
    await api('/api/2.0/mlflow/runs/set-tag', { run_id, key: 'recipe_json', value: JSON.stringify(recipe_json) });
    await api('/api/2.0/mlflow/runs/set-tag', { run_id, key: 'summary_json', value: JSON.stringify(summary) });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, experiment_id, run_id })
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Unknown error' }) };
  }
};

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return h >>> 0;
}
