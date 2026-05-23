import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const urlCandidates = [
  'SUPABASE_URL',
  'SUPABASE_DATABASE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'REACT_APP_SUPABASE_URL',
  'PUBLIC_SUPABASE_URL'
] as const;
const keyCandidates = [
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'REACT_APP_SUPABASE_ANON_KEY',
  'PUBLIC_SUPABASE_ANON_KEY'
] as const;

function firstEnv(names: readonly string[]) {
  for (const n of names) {
    const v = process.env[n as keyof NodeJS.ProcessEnv];
    if (v) return { name: n, value: v as string };
  }
  return null;
}

export const handler: Handler = async () => {
  const urlVar = firstEnv(urlCandidates);
  const keyVar = firstEnv(keyCandidates);

  if (!urlVar || !keyVar) {
    const present = Object.keys(process.env).filter(k => k.toUpperCase().includes('SUPABASE'));
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing Supabase URL or ANON key in function runtime env',
        presentSupabaseEnvNames: present
      })
    };
  }

  const supabase = createClient(urlVar.value, keyVar.value);
  const { data, error } = await supabase.rpc('ae_get_stats');
  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  return { statusCode: 200, body: JSON.stringify({ ok: true, from: { urlVar: urlVar.name, keyVar: keyVar.name }, data }) };
};
