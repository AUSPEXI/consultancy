import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  if (!url || !serviceKey) return { statusCode: 500, body: 'Missing Supabase service config' };

  try {
    const payload = JSON.parse(event.body || '{}');
    const { schema_id, kind, record_count, storage_uri, metadata } = payload;
    if (!schema_id || !kind) return { statusCode: 400, body: 'schema_id and kind are required' };

    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase
      .from('ae_datasets')
      .insert({ schema_id, kind, record_count: record_count || 0, storage_uri, metadata })
      .select('id')
      .single();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ id: data.id }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Unknown error' }) };
  }
};
