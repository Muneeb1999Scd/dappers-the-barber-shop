import { createClient } from '@supabase/supabase-js';

// Supabase Project Credentials
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://kpgpxokcsumjtpyrhlxr.supabase.co';
export const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ffunjYcRUrGoq9js9PKA2w_rBlmg34E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function checkSupabaseStatus() {
  try {
    const res = await fetch('/api/supabase/status');
    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      error: err.message
    };
  }
}
