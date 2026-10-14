import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project credentials provided by user
const DEFAULT_SUPABASE_URL = 'https://cmarpqhjzrwvanrwcgoz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtYXJwcWhqenJ3dmFucndjZ296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODkyMjQsImV4cCI6MjEwNzU2NTIyNH0.16bWwvQjiVtBcyqpcgwS-GRNK5_Tt4Q8lZirIWFZB0o';

const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('alight_custom_supabase_url') : null;
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('alight_custom_supabase_key') : null;

// Support both NEXT_PUBLIC_ and VITE_ env prefixes
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseUrl = savedUrl || envUrl || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = savedKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

export let supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('alight_custom_supabase_url', url);
      localStorage.setItem('alight_custom_supabase_key', key);
    } else {
      localStorage.removeItem('alight_custom_supabase_url');
      localStorage.removeItem('alight_custom_supabase_key');
    }
    window.location.reload();
  }
}
