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
    const { id, name, description, schema_json } = payload;
    if (!name || !schema_json) return { statusCode: 400, body: 'name and schema_json are required' };

    const schemaString = typeof schema_json === 'string' ? schema_json : JSON.stringify(schema_json);
    const schema_hash = crypto.createHash('sha256').update(schemaString).digest('hex');

    const supabase = createClient(url, serviceKey);

    if (id) {
      // Update existing schema
      const { data, error } = await supabase
        .from('ae_schemas')
        .update({ name, description, schema_json: JSON.parse(schemaString), schema_hash })
        .eq('id', id)
        .select('id, schema_hash')
        .single();
      if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      return { statusCode: 200, body: JSON.stringify({ id: data.id, schema_hash: data.schema_hash, updated: true }) };
    } else {
      // Insert new schema
      const { data, error } = await supabase
        .from('ae_schemas')
        .insert({ name, description, schema_json: JSON.parse(schemaString), schema_hash })
        .select('id, schema_hash')
        .single();
      if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      return { statusCode: 200, body: JSON.stringify({ id: data.id, schema_hash: data.schema_hash, created: true }) };
    }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Unknown error' }) };
  }
};
