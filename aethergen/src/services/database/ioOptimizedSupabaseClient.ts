import { createClient } from '@supabase/supabase-js';

// Try both VITE_ prefixed and non-prefixed environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Checked both VITE_ prefixed and non-prefixed variables.');
  console.warn('Available env vars:', Object.keys(import.meta.env));
}

// Create singleton Supabase client to prevent multiple instances
let supabaseInstance: any = null;

export const supabase = (() => {
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    console.log('🔧 Creating I/O optimized Supabase client instance...');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'User-Agent': 'AethergenAI/2.0.0'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 5
        }
      }
    });
    console.log('✅ I/O optimized Supabase client created successfully');
  } else if (supabaseInstance) {
    console.log('♻️ Reusing existing Supabase client instance');
  }
  return supabaseInstance;
})();

export interface DatasetRow {
  id?: string;
  schema_id?: string;
  kind: string; // 'seed' | 'synthetic'
  record_count?: number;
  storage_uri?: string;
  created_at?: string;
  metadata?: any;
}

// Fetch examples from ae_datasets (generic, throttled)
export const fetchDatasetsOptimized = async (
  limit: number = 25
): Promise<{ success: boolean; data?: DatasetRow[]; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase
      .from('ae_datasets')
      .select('id, schema_id, kind, record_count, storage_uri, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 25))
      .abortSignal(AbortSignal.timeout(8000));
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Lightweight stats via RPC
export const getAethergenStats = async () => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  try {
    const { data, error } = await supabase.rpc('ae_get_stats').abortSignal(AbortSignal.timeout(8000));
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};