'use client';

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@/supabase/config';

let client: SupabaseClient | null = null;

function setAuthCookies(session: Session | null) {
  if (typeof document === 'undefined') return;

  if (!session) {
    document.cookie = 'sb-access-token=; path=/; max-age=0; samesite=lax';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0; samesite=lax';
    return;
  }

  const maxAge = Math.max(0, session.expires_in ?? 3600);
  document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}

export function syncAuthCookies(session: Session | null) {
  setAuthCookies(session);
}

export function getSupabaseBrowserClient() {
  if (client) return client;

  const { url, anonKey } = getSupabaseConfig();

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  return client;
}
