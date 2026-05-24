import { createClient } from '@supabase/supabase-js';

const url = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
const anon = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && anon ? createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
}) : null;

export function assertSupabase() {
  if (!supabase) throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return supabase;
}


