import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!url || !serviceKey) return { statusCode: 500, body: 'Missing Supabase service config' };

  try {
    const payload = JSON.parse(event.body || '{}');
    const { ablation_run_id, content } = payload;
    if (!ablation_run_id || !content) return { statusCode: 400, body: 'ablation_run_id and content are required' };

    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase
      .from('ae_evidence_bundles')
      .insert({ ablation_run_id, content })
      .select('id')
      .single();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ id: data.id }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Unknown error' }) };
  }
};
