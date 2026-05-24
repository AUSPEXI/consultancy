import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const url = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!url || !serviceKey) return { statusCode: 500, body: 'Missing Supabase service config' };

  try {
    const payload = JSON.parse(event.body || '{}');
    const { schema_id, recipe_json, summary_json } = payload;
    if (!schema_id || !recipe_json) return { statusCode: 400, body: 'schema_id and recipe_json are required' };

    const recipeStr = typeof recipe_json === 'string' ? recipe_json : JSON.stringify(recipe_json);
    const recipe_hash = crypto.createHash('sha256').update(recipeStr).digest('hex');

    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase
      .from('ae_ablation_runs')
      .insert({ schema_id, recipe_hash, recipe_json: JSON.parse(recipeStr), summary_json })
      .select('id, recipe_hash')
      .single();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ id: data.id, recipe_hash: data.recipe_hash }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Unknown error' }) };
  }
};
