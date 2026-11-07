import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const hasSupabaseConfig =
  /^https?:\/\/.+/.test(url) && anonKey.length > 20 && !url.includes('your-project-ref');

let client: SupabaseClient | null = null;

/** Realtime-only Supabase client, or null when env vars are missing. */
export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseConfig) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}
