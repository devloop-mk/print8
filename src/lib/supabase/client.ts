import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} in environment variables`);
  }
  return value;
}

function createValidatedClient(keyEnvName: string): SupabaseClient {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = readEnv(keyEnvName);

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is invalid. Use https://YOUR_PROJECT.supabase.co',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let adminClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createValidatedClient('SUPABASE_SERVICE_ROLE_KEY');
  }
  return adminClient;
}

export function getSupabase(): SupabaseClient {
  if (!publicClient) {
    publicClient = createValidatedClient('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return publicClient;
}

/** @deprecated Use getSupabaseAdmin() */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabaseAdmin(), prop);
  },
});

/** @deprecated Use getSupabase() */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});

export function formatSupabaseError(error: unknown): string {
  if (!(error instanceof Error)) return 'Unknown database error';

  const message = error.message;

  if (message.includes('fetch failed')) {
    return 'Cannot connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL and that your project is active (not paused).';
  }
  if (message.includes('Missing NEXT_PUBLIC_SUPABASE_URL')) {
    return message;
  }
  if (message.includes('Missing SUPABASE_SERVICE_ROLE_KEY')) {
    return message;
  }
  if (
    message.includes('upload_sessions') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  ) {
    return 'Database tables are missing. Run supabase/schema.sql in the Supabase SQL editor.';
  }
  if (message.includes('Invalid API key') || message.includes('JWT')) {
    return 'Invalid Supabase API key. Check SUPABASE_SERVICE_ROLE_KEY in .env.local';
  }
  if (
    message.includes('invalid input syntax for type bigint') ||
    message.includes('invalid input syntax for type integer')
  ) {
    return 'Database column types are wrong (IDs must be text, not bigint). Run supabase/reset-schema.sql in the Supabase SQL Editor.';
  }

  return message;
}
