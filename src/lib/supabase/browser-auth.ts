import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseAuthUrl } from '@/lib/supabase/auth-env';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Browser Supabase client for OAuth (persists session via cookies via @supabase/ssr). */
export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseAuthUrl(), getSupabaseAnonKey());
  }
  return browserClient;
}
